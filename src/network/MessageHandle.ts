import protobuf from "protobufjs";
import { Protocol } from "@/enums/protocol";

export class MessageData {
  protocol: number;
  len: number;
  payload: Uint8Array;
  
  constructor(id: number, len: number, data: Uint8Array) {
    this.protocol = id;
    this.len = len;
    this.payload = data;
  }
}

export class MessageHandle {

    private protoTypes = new Map<string, protobuf.Type>();

    constructor() {
        // 初始化 Protocol 的 protobuf 類型
        this.loadProtoTypes();
    }

    private async loadProtoTypes() {
        const [loginRoot, gameRoot] = await Promise.all([
            protobuf.load("proto/login.proto"),
            protobuf.load("proto/game.proto"),
        ]);
        
        const collectTypes = (obj: protobuf.ReflectionObject) => {
            if (obj instanceof protobuf.Type)
            {
                this.protoTypes.set(obj.fullName.replace(/^\./, ""), obj);
                console.log(`Loaded proto type: ${obj.fullName.replace(/^\./, "")}`);
            }
            else if (obj instanceof protobuf.Namespace)
            {
                obj.nestedArray.forEach((nested) => collectTypes(nested));
            }
        };

        loginRoot.nestedArray.forEach((nested) => collectTypes(nested));
        gameRoot.nestedArray.forEach((nested) => collectTypes(nested));
    }

    public handleMessage(data: Uint8Array) {
        const dataView = new DataView(data.buffer);
        const len = dataView.getInt32(0, true);
        const protocol = dataView.getInt32(4, true);
        
        const payload = data.slice(8);

        var message : MessageData = new MessageData(protocol, len, payload);

        return message;
    }

    public decodedMessage(messageName: string, payload: Uint8Array)
    {
        const MessageType = this.protoTypes.get(messageName);
        const decodedMessage = MessageType!.decode(payload);

        return decodedMessage as any;
    }

    public generateSendPacket(protocolId: Protocol, messageName: string, payload: object)
    {
        if (!this.protoTypes.has(messageName)) {
            console.error("Protos not loaded");
            return new Uint8Array(0);
        }

        const MessageType = this.protoTypes.get(messageName);
        if(MessageType === undefined) {
            console.error(`Message type ${messageName} not found`);
            return new Uint8Array(0);
        }

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

        return packet;
    }
}