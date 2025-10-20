# レシート家計簿アプリ

個人開発で作成している「（自分だけに）ちょうどいいレシート家計簿」アプリです。

## 技術スタック

### フロントエンド
- **Framework**: Expo (React Native)
- **ナビゲーション**: React Navigation
- **OCR**: ML Kit Text Recognition
- **カメラ**: expo-camera, expo-media-library
- **HTTP通信**: axios

### バックエンド
- **Runtime**: Node.js
- **Framework**: Express
- **データベース**: Firebase Firestore
- **AI**: OpenAI API (gpt-4o-mini)

### インフラ・デプロイ
- **開発環境**: EAS Build (Custom Development Build)
- **本番環境**: Railway ✅ デプロイ済み
- **ビルド**: ローカルビルド (--local) で無料枠活用

## セットアップ

### 1. リポジトリのクローン
```bash
git clone https://github.com/mikiIDE/Gs_PG_ReceiptApp.git
cd receipt-app
```

### 2. バックエンドのセットアップ（ローカル開発時のみ）
```bash
cd backend
npm install

# .envファイルを作成
# OPENAI_API_KEY=your-openai-api-key
# PORT=3000

# FirebaseのserviceAccountKey.jsonを配置
# backend/serviceAccountKey.json
```

### 3. フロントエンドのセットアップ
```bash
cd frontend
npm install
```

## 起動方法

### 推奨: Railway本番環境を使用（自分向け）
本番環境がRailwayにデプロイ済みのため、バックエンドの起動は不要。

```bash
cd frontend
npx expo start
```

`frontend/src/config.js` が Railway URL に設定されていることを確認してください：
```javascript
export const API_URL = 'https://your-railway-app-name.up.railway.app/api';
```

### ローカル開発環境を使用する場合
バックエンドをローカルで起動：
```bash
cd backend
node index.js
```

フロントエンド起動：
```bash
cd frontend
npx expo start
```

`frontend/src/config.js` をローカルIPアドレスに変更：
```javascript
export const API_URL = 'http://[your-ip-address]:3000/api';
```

## 機能

### 実装済み
- ✅ レシート一覧表示
- ✅ レシート手動追加
- ✅ 商品ごとの最安値比較
- ✅ OCR機能（レシート撮影 + ML Kit）
- ✅ ChatGPT API連携（自動構造化）
- ✅ Railway本番環境デプロイ

### 今後追加したい機能（未定）
- 📊 カテゴリ管理
- 📈 グラフ・統計表示
- 🔍 検索・フィルター機能
- 📉 支出分析
- 📅 月次レポート

## 開発状況

- **MVP1（手動入力版）**: 完成 - 2025年8月
- **OCR機能**: 完成 - 2025年9月
- **Railway本番環境**: デプロイ完了 - 2025年9月
- **ChatGPT API連携**: 完成 - 2025年10月

## プロジェクト構造

```
receipt-app/
├── frontend/              # Expo アプリ
│   ├── src/
│   │   ├── screens/       # HomeScreen, AddReceiptScreen, OCRScreen
│   │   ├── services/      # API通信 (api.js, chatgpt.js)
│   │   └── config.js      # 環境設定
│   ├── App.js            # メインアプリ
│   ├── eas.json          # EAS Build設定
│   └── app.json          # Expo設定
├── backend/              # Express サーバー
│   ├── index.js          # APIエンドポイント
│   ├── .env              # 環境変数（ローカル）
│   └── package.json
└── README.md
```

## 環境変数

### ローカル開発（backend/.env）
```env
OPENAI_API_KEY=your-openai-api-key
PORT=3000
```

### Railway本番環境
Railway の Variables で以下を設定済み：
- `OPENAI_API_KEY`: OpenAI APIキー
- `FIREBASE_SERVICE_ACCOUNT`: Firebase認証情報（JSON文字列）

## ライセンス

個人プロジェクト
