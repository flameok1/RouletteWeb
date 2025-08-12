import protobuf from "protobufjs";
import { Protocol } from "@/enums/protocol";

export class WSClient {
    private ws: WebSocket | null = null;

    private protoTypes = new Map();

    public isConnected = false;
    public onConnectCB = null as (() => void) | null;
    public onMessageCB = null as ((data: Uint8Array) => void) | null;

    constructor()
    {
    }

    connect(url : string)
    {

        this.ws = new WebSocket(url);
        this.ws.binaryType = "arraybuffer";

        this.ws.onopen = () => {
            this.isConnected = true;
            console.log('WebSocket 連線已建立');

            if(this.onConnectCB != null)
            {
                this.onConnectCB();
            }
        };

        this.ws.onmessage = (event) => {
            // 檢查收到的資料是否為 ArrayBuffer
            if (event.data instanceof ArrayBuffer) {
                //console.log('Received an ArrayBuffer:', event.data);
            
                if (this.onMessageCB) {
                    this.onMessageCB(new Uint8Array(event.data));
                    return;
                }

            } else {
                console.log('Received non-ArrayBuffer data:', event.data);
            }
        };

        this.ws.onclose = () => {
            this.isConnected = false;
            console.log('WebSocket 連線已關閉');
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket 錯誤:', error);
        };
    }

    disconnect()
    {
        if (this.ws)
        {
            this.ws.close();
            this.isConnected = false;
            console.log('WebSocket 連線已關閉');
        }
    }

    async loadProtos()
    {
        // 載入多個 proto
        const [loginRoot] = await Promise.all([
            protobuf.load("proto/login.proto"),
        ]);

        this.protoTypes.set("loginpackage.LoginRequest", loginRoot.lookupType("loginpackage.LoginRequest"));
        this.protoTypes.set("loginpackage.LoginResponse", loginRoot.lookupType("loginpackage.LoginResponse"));
    }

    sendPacket(packet : Uint8Array)
    {
        if(!this.ws){
            console.error("WebSocket is not connected");
            return;
        }

        // 發送
        this.ws.send(packet);
    }
}
