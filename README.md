# レシート家計簿アプリ

個人開発で作成している「（自分だけに）ちょうどいいレシート家計簿」アプリです。

## 技術スタック

- **フロントエンド**: Expo (React Native)
- **バックエンド**: Node.js + Express
- **データベース**: Firebase Firestore
- **デプロイ**: Railway（予定）

## セットアップ

### 1. リポジトリのクローン
```bash
git clone [your-repository-url]
cd receipt-app
```

### 2. バックエンドのセットアップ
```bash
cd backend
npm install

# FirebaseのserviceAccountKey.jsonを配置する必要があります
# backend/serviceAccountKey.json
```

### 3. フロントエンドのセットアップ
```bash
cd frontend
npm install
```

## 起動方法

### バックエンド
```bash
cd backend
npm run dev
```

### フロントエンド
```bash
cd frontend
npm run ios  # iOS
npm run web  # Web
```

## 機能

### 実装済み
- ✅ レシート一覧表示
- ✅ レシート手動追加
- ✅ 商品ごとの最安値比較

### 今後の実装予定
- 📷 OCR機能（レシート撮影）
- 🤖 ChatGPT連携（自動構造化）
- 📊 家計分析機能

## 開発状況

MVP1（手動入力版）完成 - 2025年8月

## ライセンス

個人プロジェクト
