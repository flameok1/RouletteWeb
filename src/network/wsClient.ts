import protobuf from "protobufjs";
import { Protocol } from "@/enums/protocol";

export class WSClient {
    private ws: WebSocket | null = null;
    private protoRoot: protobuf.Root | null = null;

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

        // 合併成一個 Root（方便統一查找）
        this.protoRoot = new protobuf.Root();
        this.protoRoot.add(loginRoot.lookupType("loginpackage.LoginRequest"));
    }

    sendPacket(protocolId: Protocol, messageName: string, payload: object)
    {
        if (!this.protoRoot) {
            console.error("Protos not loaded");
            return;
        }

        const MessageType = this.protoRoot.lookupType(messageName);
        const errMsg = MessageType.verify(payload);
        if (errMsg) throw Error(errMsg);

        const message = MessageType.create(payload);
        const bodyBuffer = MessageType.encode(message).finish(); // Uint8Array

        // 加上協議 ID（4 byte int32）
        const header = new ArrayBuffer(4);
        new DataView(header).setInt32(0, protocolId, true); // 小端序（C++ 注意對應）

        // 合併
        const packet = new Uint8Array(header.byteLength + bodyBuffer.byteLength);
        packet.set(new Uint8Array(header), 0);
        packet.set(bodyBuffer, header.byteLength);

        if(!this.ws){
            console.error("WebSocket is not connected");
            return;
        }

        console.log(packet);
        // 發送
        //this.ws.send(packet);
    }
}
