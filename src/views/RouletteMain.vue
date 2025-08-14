<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGMStore } from '@/stores/GameManager.ts'
import { Protocol } from '@/enums/protocol';

const GameManager = useGMStore()


// 下注金額選項
const betOptions = [10, 50, 100, 500, 1000]
const selectedBet = ref(10)

// 遊戲狀態
const currentRound = ref(1)
const countdown = ref(30)
const nowWinNumber = ref(1)
const isLoopWIn = ref(true)

// 轉盤數字 (1-30)
const rouletteNumbers = Array.from({ length: 30 }, (_, i) => i + 1)
const bets = ref<number[]>(new Array(30).fill(0));

// 倒數計時器
let countdownTimer: number | null = null
let loopWinTimer: number | null = null

const startCountdown = () => {
  if (countdownTimer !== null) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    }
  }, 1000)
}

const loopWin = () => {
  stopLoopWin();

  loopWinTimer = setInterval(() => {
    nowWinNumber.value++;
    if(nowWinNumber.value > 30) {
      nowWinNumber.value = 1;
    }
  }, 300)
}

const stopLoopWin = () => {
  if (loopWinTimer !== null) {
    clearInterval(loopWinTimer);
    loopWinTimer = null;
  }
}

const selectBet = (amount: number) => {
  selectedBet.value = amount
}

const betsUpdate = (index: number, amount: number) => {
  if (index < 0 || index >= bets.value.length) return;

  GameManager.wsClient.sendPacket
    (
        GameManager.messageHandle.generateSendPacket(
            Protocol.BetRequest,
            "gamepackage.BetRequest",
            {
              betnum : index,
              amount: amount,
            }
        )
    );
}

const messageCB = (data: Uint8Array) => {
    var MessageData = GameManager.messageHandle.handleMessage(data);

    //console.log("封包長度:", MessageData.len);
    //console.log("協議 ID:", MessageData.protocol);
    //console.log("Payload:", MessageData.payload);


    switch (MessageData.protocol) {
        case Protocol.CountDownSync:
            const decodedMessage = GameManager.messageHandle.decodedMessage("gamepackage.CountDownSync", MessageData.payload);

            countdown.value = decodedMessage.countdown;
            currentRound.value = decodedMessage.round;
            startCountdown();

            if(loopWinTimer == null) {
                loopWin();
            }
            break;

        case Protocol.BetResponse:
            const betResponse = GameManager.messageHandle.decodedMessage("gamepackage.BetResponse", MessageData.payload);
            console.log("Bet Response:", betResponse);

            // 更新下注金額
            if (betResponse.betnum >= 0 && betResponse.betnum < bets.value.length) {
                bets.value[betResponse.betnum] = betResponse.amount;
            }

            GameManager.playerMoney = betResponse.playermoney;
            break;

          case Protocol.GameResult:
            const gameResult = GameManager.messageHandle.decodedMessage("gamepackage.BetResult", MessageData.payload);
            console.log("Game Result:", gameResult);

            stopLoopWin();
            nowWinNumber.value = gameResult.winnum;
            GameManager.playerMoney = gameResult.playermoney;

            // 重置下注金額
            bets.value.fill(0);
            break;
    }
};

const startGame = () => {
    loopWin();

    if(GameManager.wsClient.isConnected === false) {
        console.error("WebSocket is not connected.");
        return;
    }

    GameManager.wsClient.sendPacket
    (
        GameManager.messageHandle.generateSendPacket(
            Protocol.StartGameRequest,
            "gamepackage.StartRequest",
            {
              playermoney : GameManager.playerMoney,
            }
        )
    );
}

onMounted(() => {
  GameManager.wsClient.onMessageCB = messageCB;
  startGame()
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<template>
  <div class="roulette-container">
    <!-- 左側控制面板 -->
    <div class="left-panel">
      <!-- 玩家金錢顯示區域 -->
      <div class="money-display">
        <h2>玩家金錢: ${{ GameManager.playerMoney.toLocaleString() }}</h2>
      </div>

      <!-- 下注按鈕區域 -->
      <div class="bet-buttons">
        <button
          v-for="amount in betOptions"
          :key="amount"
          :class="['bet-button', { 'selected': selectedBet === amount }]"
          @click="selectBet(amount)"
        >
          ${{ amount }}
        </button>
      </div>
    </div>

    <!-- 右側轉盤區域 -->
    <div class="right-panel">
      <div class="roulette-section">
        <!-- 轉盤外圈 -->
        <div class="roulette-wheel">
          <div
            v-for="(number, index) in rouletteNumbers"
            :key="number"
            class="roulette-number"
            :style="{
              transform: `rotate(${(index * 360) / 30}deg) translateY(-200px)`
            }"
            @click="betsUpdate(index, selectedBet)"
          >
            <div class="number-content" :class="{ 'bd_red': nowWinNumber == index + 1 }">
              <div class="number">{{ number }}</div>
              <div class="bet-amount">${{ bets[index] }}</div>
            </div>
          </div>
        </div>

        <!-- 中央區域 -->
        <div class="center-area">
          <div class="round-info">
            <h3>第 {{ currentRound }} 輪</h3>
            <div class="countdown">
              <span class="countdown-label">倒數時間:</span>
              <span class="countdown-time">{{ countdown }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.roulette-container {
  min-height: 100vh;
  display: flex;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  gap: 30px;
}

/* 左側控制面板 */
.left-panel {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* 右側轉盤面板 */
.right-panel {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 玩家金錢顯示區域 */
.money-display {
  height: 100px;
  width: 100%;
  background: linear-gradient(90deg, #2c3e50, #34495e);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.money-display h2 {
  color: #f39c12;
  font-size: 1.8rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  margin: 0;
  text-align: center;
}

/* 下注按鈕區域 */
.bet-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.bet-button {
  padding: 15px 25px;
  font-size: 1.2rem;
  font-weight: bold;
  background: #3498db;
  color: white;
  border: 3px solid #000;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.bet-button:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.bet-button.selected {
  border-color: #e74c3c;
  background: #e74c3c;
  box-shadow: 0 0 15px rgba(231, 76, 60, 0.6);
}

/* 轉盤區域 */
.roulette-section {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.roulette-wheel {
  position: relative;
  width: 500px;
  height: 500px;
}

.roulette-number {
  position: absolute;
  top: 5%;
  left: 50%;
  width: 100px;
  height: 100px;
  margin-left: -50px;
  margin-top: -50px;
  transform-origin: 50px 250px;
  cursor: pointer;
}

.number-content {
  width: 100%;
  height: 100%;
  background: #f1c40f;
  border: 3px solid #000;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.boarder_red {
  border: 3px solid #ff1900;
}

.bd_red {
  background: #e74c3c;
}

.number {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 5px;
}

.bet-amount {
  font-size: 0.9rem;
  color: #e74c3c;
  font-weight: bold;
}

/* 中央區域 */
.center-area {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 150px;
  background: linear-gradient(135deg, #ecf0f1, #bdc3c7);
  border: 4px solid #2c3e50;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
}

.round-info {
  text-align: center;
}

.round-info h3 {
  color: #2c3e50;
  font-size: 1.3rem;
  margin: 0 0 15px 0;
  font-weight: bold;
}

.countdown {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.countdown-label {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.countdown-time {
  color: #e74c3c;
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}
</style>