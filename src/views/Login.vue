<script setup lang="ts">
import { ref , onMounted } from 'vue'
import { useGMStore } from '@/stores/GameManager.ts'
import { Protocol } from '@/enums/protocol';
import protobuf from "protobufjs";

const GameManager = useGMStore()

const loginAcc = ref('');
const loginPw = ref('');

let isLogining = false;

onMounted( async () => {
    await GameManager.wsClient.loadProtos();
});

const connectCB = () =>
{
    isLogining = false;
    console.log('Connected to WebSocket');

    GameManager.wsClient.sendPacket(
        Protocol.LoginRequest,
        "loginpackage.LoginRequest",
        {
            username: loginAcc.value,
            password: loginPw.value
        }
    );
}

const onLogin = () => {

    if(isLogining) {
        return;
    }

    isLogining = true;
    console.log('gg ' + loginAcc.value + loginPw.value)

    GameManager.wsClient.onConnectCB = connectCB;
    GameManager.wsClient.connect('ws://localhost:8888/ws');
}

</script>

<template>
  <div class="login_bg">
    <div class="login-area">
        <div class="input_area">
            <div class="image_frame">
                <img src="/img/logo.png" alt="alt logo"/>
            </div>

            <div class="input_title"> title </div>

            <div class="input_panel">
                <div class="login-desc">帳號</div>
                <input type="text" placeholder="請輸入帳號" class="input_login" v-model="loginAcc" />
                <div class="login-desc">密碼</div>
                <input type="password" placeholder="請輸入密碼" class="input_login" v-model="loginPw" />
                <button class="login_button" @click="onLogin">登入</button>                
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.login_bg {
    position: relative;
    width: 100%;
    height: 100vh;
    background-color: #ffffff;
    background-image: url("/img/login_bg.png");
    background-size: cover;
    padding-top: calc(50vh - 300px);
    box-sizing: border-box;
}


.login-area {
    display: block;
    height: 500px;
    max-width: 33.333%;
    min-width: 300px;
    margin: 0 auto;
    padding: 0;
    box-sizing: border-box;
    background-color: #ffffff;
    border-radius: 16px;
}

.login-area .input_area {
    background-color: #ffffff;
    padding: 20PX;
    border-radius: 16px;
}

.login-area .input_area .image_frame {
    position: relative;
    width: 100%;
    height: 100%;
}

.login-area .input_area .image_frame img{
    display: block;
    margin: auto;
    max-height: 100%;
    max-width: 60%;
    width: auto;
    height: auto;
}

.login-area .input_area .input_title {
    margin: 0 0 40px 0;
    text-align: center;
    font-size: 30px;
}

.login-area .input_area .input_panel {
    width: 240px;
    justify-content: center;
    position: relative;
    margin: 0 auto;
}

.login-area .input_area .input_panel .input_login {
    position: relative;
    display: block;
    margin-left: 0px;
    width: 100%;
    height: 35px;
    line-height: 30px;
    font-family: GJ_N, "Noto Sans TC", sans-serif;
    font-size: 14px;
    padding-left: 15px;
    box-sizing: border-box;
    background: #ffffff;
    border: 1px solid #636363;
    border-radius: 2px;
    &:focus {
        outline: 0px;
    }
}

.login-area .input_area .input_panel .login-desc {
    line-height: 25px;
}

.login-area .input_area .input_panel .login_button {
    display: block;
    text-align: center;
    line-height: 20px;
    font-size: 14px;
    position: relative;
    align-items: center;
    width: 240px;
    margin: 10px auto 0;
    padding: 12px 19px;
    cursor: pointer;
    background: #409eff;
    text-align: center;
    color: #ffffff;
    border-radius: 4px;
    border: 0px;
    cursor: pointer;
    font-family: GJ_N, "Noto Sans TC", sans-serif;

    &:hover {
        background: #79bbff;
    }

    &:focus {
        outline: 0px;
    }
}

@media (width <= 1280px) {

.login-area {
    max-width: 50%;
}
}

@media (width <= 768px) {

.login-area {
    max-width: 90%;
}
}

@media (width <= 500px) {


}

</style>
