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

        // 加上協議 ID（4 byte int32）
        const protocolHeader = new ArrayBuffer(4);
        new DataView(protocolHeader).setInt32(0, protocolId, true); // 小端序（C++ 注意對應）

        // 封包長度頭（4 bytes）= 協議 ID + body 長度
        const packetLen = protocolHeader.byteLength + bodyBuffer.byteLength;
        const lengthHeader = new ArrayBuffer(4);
        new DataView(lengthHeader).setInt32(0, packetLen, true);

        // 合併
        const packet = new Uint8Array(protocolHeader.byteLength + lengthHeader.byteLength + bodyBuffer.byteLength);
        packet.set(new Uint8Array(protocolHeader), 0);
        packet.set(new Uint8Array(lengthHeader), protocolHeader.byteLength);
        packet.set(bodyBuffer, protocolHeader.byteLength + lengthHeader.byteLength);

        if(!this.ws){
            console.error("WebSocket is not connected");
            return;
        }

        console.log(packet);
        // 發送
        this.ws.send(packet);
    }
}
