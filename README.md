# RouletteWeb - 高併發交易模擬系統

## 📖 專案簡介

RouletteWeb 是一個用於模擬高併發交易的前後端分離專案。這個專案源於對高併發交易系統的好奇與研究。

### 核心概念

- **高頻交易 (HFT)**: 需要持續檢查和快速交易，追求極致的速度
- **高併發交易**: 同時處理大量用戶的交易請求，考驗系統的並發處理能力

本專案通過輪盤遊戲的形式，模擬多用戶同時進行交易的高併發場景，並使用 **Protocol Buffers (Protobuf)** 來優化網路封包的傳輸效率。

## 🛠️ 技術棧

### 前端
- **Vue 3** - 現代化的前端框架
- **TypeScript** - 類型安全的 JavaScript
- **Vite** - 快速的前端建置工具
- **Pinia** - Vue 3 的狀態管理庫
- **Vue Router** - 前端路由管理
- **protobufjs** - Protocol Buffers 的 JavaScript 實現

### 後端
- **C++ Server** - 高效能的後端伺服器

### 通訊協議
- **WebSocket** - 即時雙向通訊
- **Protocol Buffers** - 高效的二進位序列化格式

## ✨ 功能特色

- 🔐 **用戶登入系統** - 安全的身份驗證機制
- 🎰 **輪盤遊戲** - 1-30 數字輪盤，支援多種下注金額
- 💰 **即時下注** - 透過 WebSocket 即時下注與同步
- ⏱️ **倒數計時** - 每輪遊戲倒數計時，同步所有玩家
- 📊 **即時結果** - 遊戲結果即時同步，顯示中獎號碼
- 💵 **資金管理** - 即時更新玩家餘額
- 🚀 **高併發支援** - 設計用於處理大量同時連線的用戶

## 📁 專案結構

```
RouletteWeb/
├── public/
│   ├── img/              # 圖片資源
│   └── proto/            # Protocol Buffers 定義檔
│       ├── game.proto    # 遊戲相關協議
│       └── login.proto   # 登入相關協議
├── src/
│   ├── assets/           # 靜態資源
│   ├── enums/            # 枚舉定義
│   │   └── protocol.ts   # 協議 ID 枚舉
│   ├── network/           # 網路通訊模組
│   │   ├── wsClient.ts   # WebSocket 客戶端
│   │   └── MessageHandle.ts  # 訊息處理類
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia 狀態管理
│   │   └── GameManager.ts
│   ├── views/            # 頁面組件
│   │   ├── Login.vue      # 登入頁面
│   │   └── RouletteMain.vue  # 輪盤遊戲主頁面
│   ├── App.vue           # 根組件
│   └── main.ts           # 應用程式入口
├── package.json
├── vite.config.ts
└── README.md
```

## 🔧 環境要求

- **Node.js**: ^20.19.0 或 >=22.12.0
- **npm** 或 **yarn**
- **C++ Server** (需另外啟動)

## 📦 安裝步驟

1. **克隆專案**
```bash
git clone <repository-url>
cd RouletteWeb
```

2. **安裝依賴**
```bash
npm install
```

3. **啟動開發伺服器**
```bash
npm run dev
```

4. **啟動 C++ 後端伺服器**
   - 請確保 C++ 伺服器運行在 `ws://localhost:8888/ws`

## 🚀 使用說明

### 開發模式

```bash
# 啟動開發伺服器
npm run dev
```

開發伺服器預設運行在 `http://localhost:5173`

### 建置生產版本

```bash
# 類型檢查 + 建置
npm run build

# 僅建置（不進行類型檢查）
npm run build-only

# 類型檢查
npm run type-check
```

### 預覽生產版本

```bash
npm run preview
```

## 🎮 遊戲流程

1. **登入**
   - 輸入帳號和密碼
   - 系統驗證後連接到遊戲伺服器

2. **開始遊戲**
   - 進入輪盤遊戲頁面
   - 選擇下注金額（$10, $50, $100, $500, $1000）
   - 點擊輪盤上的數字進行下注

3. **遊戲進行**
   - 每輪遊戲有 30 秒倒數時間
   - 在倒數期間可以持續下注
   - 系統即時同步所有玩家的下注狀態

4. **結果公布**
   - 倒數結束後，系統公布中獎號碼
   - 自動結算並更新玩家餘額
   - 開始新一輪遊戲

## 📡 通訊協議

### Protocol Buffers 定義

專案使用 Protocol Buffers 定義了以下訊息類型：

**登入協議** (`login.proto`):
- `LoginRequest` - 登入請求
- `LoginResponse` - 登入回應

**遊戲協議** (`game.proto`):
- `StartRequest` - 開始遊戲請求
- `CountDownSync` - 倒數同步
- `BetRequest` - 下注請求
- `BetResponse` - 下注回應
- `BetResult` - 遊戲結果

### 協議 ID

```typescript
enum Protocol {
  LoginRequest = 1,
  BetRequest = 2,
  StartGameRequest = 3,
  
  LoginResponse = 1001,
  CountDownSync = 1002,
  BetResponse = 1003,
  GameResult = 1004,
}
```

## 🔌 WebSocket 連線

- **連線地址**: `ws://localhost:8888/ws`
- **資料格式**: 二進位 (ArrayBuffer)
- **封包格式**: 
  - 前 4 bytes: 封包長度
  - 接下來 4 bytes: 協議 ID
  - 其餘: Protobuf 編碼的訊息內容

## 🎯 核心模組說明

### WSClient
負責 WebSocket 連線管理，包括：
- 連線建立與斷線處理
- 訊息發送與接收
- 回調函數管理

### MessageHandle
處理 Protocol Buffers 訊息的編碼與解碼：
- 載入 `.proto` 檔案
- 訊息序列化與反序列化
- 封包格式處理

### GameManager (Pinia Store)
全域狀態管理：
- WebSocket 客戶端實例
- 訊息處理器實例
- 玩家資訊（ID、餘額）

## 📝 開發注意事項

1. **Protocol Buffers 同步**
   - 前端與後端的 `.proto` 檔案必須保持一致
   - 修改協議後需要重新載入

2. **WebSocket 連線**
   - 確保後端伺服器已啟動
   - 檢查連線地址是否正確

3. **類型安全**
   - 使用 TypeScript 確保類型安全
   - 執行 `npm run type-check` 檢查類型錯誤

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

本專案為學習與研究用途。

## 📧 聯絡方式

如有問題或建議，歡迎提出 Issue。

---

**注意**: 本專案為高併發交易系統的模擬實作，用於學習和研究目的。
