const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

// Firebase Admin SDK の初期化
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Railway環境（本番）
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // ローカル環境（開発）
  serviceAccount = require('./serviceAccountKey.json');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();  // ← これが定義されてから
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json());

// レシートデータの取得
app.get('/api/receipts', async (req, res) => {
  try {
    const snapshot = await db.collection('receipts').orderBy('purchaseDate', 'desc').get();
    const receipts = [];
    snapshot.forEach(doc => {
      receipts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// レシートデータの追加
app.post('/api/receipts', async (req, res) => {
  try {
    const { storeName, totalAmount, purchaseDate, items } = req.body;
    
    const receipt = {
      storeName,
      totalAmount: Number(totalAmount),
      purchaseDate,
      items: items.map(item => ({
        name: item.name,
        price: Number(item.price),
        category: item.category || '未分類'
      })),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('receipts').add(receipt);
    res.status(201).json({ success: true, id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 商品の最安値比較
app.get('/api/items/:itemName/best-price', async (req, res) => {
  try {
    const itemName = req.params.itemName;
    const snapshot = await db.collection('receipts').get();
    
    const priceData = [];
    snapshot.forEach(doc => {
      const receipt = doc.data();
      const targetItem = receipt.items?.find(item => 
        item.name.includes(itemName)
      );
      if (targetItem) {
        priceData.push({
          store: receipt.storeName,
          price: targetItem.price,
          date: receipt.purchaseDate
        });
      }
    });
    
    // 最安値順にソート
    priceData.sort((a, b) => a.price - b.price);
    
    res.json({
      itemName,
      priceComparison: priceData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// テスト用エンドポイント
app.get('/', (req, res) => {
  res.json({ message: 'Receipt App API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
