import protobuf from "protobufjs";
import { Protocol } from "@/enums/protocol";

export class WSClient {
    private ws: WebSocket | null = null;

    private protoRoot: protobuf.Root | null = null;
    private protoTypes = new Map();

    public isConnected = false;
    public onConnectCB = null as (() => void) | null;
    public messageQueue : string[] = [];

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
            // 處理接收到的訊息
            this.messageQueue.push(event.data);

            // 檢查收到的資料是否為 ArrayBuffer
            if (event.data instanceof ArrayBuffer) {
                console.log('Received an ArrayBuffer:', event.data);
            

                // 假設 encodedData 就是你收到的 Uint8Array
                const receivedUint8Array: Uint8Array = new Uint8Array(event.data);
                const dataView = new DataView(receivedUint8Array.buffer);

                const len = dataView.getInt32(0, true);       // 從 offset=0 讀取第一個 int
                const protocol = dataView.getInt32(4, true);  // 從 offset=4 讀取第二個 in

                // 剩下的二進位資料
                const payload = receivedUint8Array.slice(8); // 從 index=2 開始切出新的 Uint8Array

                console.log("封包長度:", len);
                console.log("協議 ID:", protocol);
                console.log("Payload:", payload);

                switch (protocol) {
                    case Protocol.LoginResponse:
                        console.log("處理 LoginResponse 協議");
                        const MessageType = this.protoTypes.get("loginpackage.LoginResponse");
                        const decodedMessage = MessageType.decode(payload);

                        console.log('使用者名稱:', decodedMessage.username);
                        console.log('密碼:', decodedMessage.password);
                        break;
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

    sendPacket(protocolId: Protocol, messageName: string, payload: object)
    {
        if (!this.protoTypes.has(messageName)) {
            console.error("Protos not loaded");
            return;
        }

        const MessageType = this.protoTypes.get(messageName);
        const errMsg = MessageType.verify(payload);
        if (errMsg) throw Error(errMsg);

        const message = MessageType.create(payload);
        const bodyBuffer = MessageType.encode(message).finish(); // Uint8Array

        // 協議 ID（4 byte int32）
        const protocolHeader = new ArrayBuffer(4);
        new DataView(protocolHeader).setUint32(0, protocolId, true); // 小端序（C++ 注意對應）

        // 封包長度頭（4 bytes）= 協議 ID + body 長度
        const packetLen = protocolHeader.byteLength + bodyBuffer.byteLength;
        const lengthHeader = new ArrayBuffer(4);
        new DataView(lengthHeader).setUint32(0, packetLen, true);

        // 合併
        const packet = new Uint8Array(protocolHeader.byteLength + lengthHeader.byteLength + bodyBuffer.byteLength);
        //先封包長度再protocolID
        packet.set(new Uint8Array(lengthHeader), 0);
        packet.set(new Uint8Array(protocolHeader), lengthHeader.byteLength);
        packet.set(bodyBuffer, protocolHeader.byteLength + lengthHeader.byteLength);

        if(!this.ws){
            console.error("WebSocket is not connected");
            return;
        }

        console.log(protocolHeader.byteLength + lengthHeader.byteLength + bodyBuffer.byteLength);
        console.log(packet);
        // 發送
        this.ws.send(packet);
    }
}
