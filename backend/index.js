const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

// OpenAI APIの設定
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
// レシートデータの更新
app.put('/api/receipts/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('receipts').doc(id).update(receipt);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// レシートデータの削除
app.delete('/api/receipts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('receipts').doc(id).delete();
    res.json({ success: true, id });
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

// OCRテキストをChatGPT APIで構造化処理
app.post('/api/receipts/process-ocr', async (req, res) => {
  try {
    const { ocrText } = req.body;

    if (!ocrText) {
      return res.status(400).json({ error: 'OCRテキストが必要です' });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    const prompt = `
以下のレシートのOCR結果から、構造化されたJSONデータを作成してください。

OCRテキスト:
${ocrText}

以下の形式で正確にJSONのみを返してください（他のテキストは含めないでください）:
{
  "store": "店名",
  "date": "YYYY-MM-DD",
  "items": [
    {"name": "推定商品名", "price": 金額}
  ],
  "total": 合計金額,
  "confidence": "high/medium/low"
}

ルール:
- OCRテキストの上部（最初の数行）に店名が含まれることが多いです
- 店名が不明な場合は"不明"としてください
- 合計金額は「合計」「お会計」「計」などのキーワード付近の金額を優先してください
- 税込の最終金額を合計金額として使用してください（小計ではなく税込合計）
- 商品の個別価格は税抜きでも問題ありません
- 商品名が不明な場合は価格から推定してください
- 価格情報は必ず数値で返してください
- confidenceは認識できた情報量に基づいて判定してください
`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    try {
      const structuredData = JSON.parse(content);
      
      // 基本的なバリデーション
      if (!structuredData.store || !structuredData.items || !Array.isArray(structuredData.items)) {
        throw new Error('Invalid response format from ChatGPT');
      }

      res.json({
        success: true,
        data: structuredData,
        raw_ocr: ocrText
      });

    } catch (parseError) {
      console.error('Failed to parse ChatGPT response:', content);
      
      // フォールバック処理
      const fallbackData = createFallbackStructure(ocrText);
      res.json({
        success: true,
        data: fallbackData,
        raw_ocr: ocrText,
        fallback: true
      });
    }

  } catch (error) {
    console.error('ChatGPT API Error:', error);
    
    // エラー時のフォールバック
    const fallbackData = createFallbackStructure(req.body.ocrText);
    res.json({
      success: true,
      data: fallbackData,
      raw_ocr: req.body.ocrText,
      fallback: true,
      error: error.message
    });
  }
});

// フォールバック用のヘルパー関数
function createFallbackStructure(ocrText) {
  const lines = ocrText.split('\n');
  const prices = [];
  let store = '不明';

  // 価格を抽出
  lines.forEach(line => {
    const priceMatches = line.match(/¥(\d{1,3}(?:,\d{3})*)/g);
    if (priceMatches) {
      priceMatches.forEach(match => {
        const price = parseInt(match.replace(/[¥,]/g, ''));
        if (price > 0 && price < 100000) {
          prices.push(price);
        }
      });
    }
  });

  // 店名を推測
  const firstLine = lines[0]?.trim();
  if (firstLine && firstLine.length > 0 && firstLine.length < 20) {
    store = firstLine;
  }

  // 商品リストを作成
  const items = prices.slice(0, -1).map((price, index) => ({
    name: `商品${index + 1}`,
    price: price
  }));

  const total = prices.length > 0 ? Math.max(...prices) : 0;

  return {
    store: store,
    date: new Date().toISOString().split('T')[0],
    items: items,
    total: total,
    confidence: 'low'
  };
}

// テスト用エンドポイント
app.get('/', (req, res) => {
  res.json({ message: 'Receipt App API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
