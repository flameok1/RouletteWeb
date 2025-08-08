import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useGMStore = defineStore('GameManager', () => {

  let fscoket: WebSocket;
  const isConnected = ref(false);
  const messageQueue = ref<string[]>([]);

  const connect = (url : string) => {
      // 在 action 中初始化 WebSocket
      fscoket = new WebSocket(url);

      fscoket.onopen = () => {
        isConnected.value = true;
        console.log('WebSocket 連線已建立');
      };

      fscoket.onmessage = (event) => {
        // 處理接收到的訊息
        messageQueue.value.push(event.data);
      };

      fscoket.onclose = () => {
        isConnected.value = false;
        console.log('WebSocket 連線已關閉');
      };

      fscoket.onerror = (error) => {
        console.error('WebSocket 錯誤:', error);
      };
    }

  const disconnect = () =>
    {
      if (fscoket) {
        fscoket.close();
        isConnected.value = false;
        console.log('WebSocket 連線已關閉');
      }
    }

  return { connect , disconnect }
})
