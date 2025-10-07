// ChatGPT Text API Service (Server経由)
// レシートのOCRテキストを構造化されたデータに変換

import { API_URL } from '../config';

/**
 * OCRで認識されたレシートテキストをサーバー経由でChatGPT APIで構造化
 * @param {string} ocrText - ML Kit OCRで認識されたテキスト
 * @returns {Promise<Object>} 構造化されたレシートデータ
 */
export const structureReceiptData = async (ocrText) => {
  try {
    const requestUrl = `${API_URL}/receipts/process-ocr`;
    console.log('🔍 リクエスト送信先:', requestUrl);
    console.log('🔍 API_URL:', API_URL);
    
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ocrText: ocrText
      }),
    });
    
    console.log('📡 レスポンスステータス:', response.status);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Failed to process OCR text');
    }

    return {
      ...result.data,
      isFallback: result.fallback || false,
      rawOcr: result.raw_ocr
    };

  } catch (error) {
    console.error('ChatGPT API Service Error:', error);
    
    // 完全なフォールバック: OCRテキストから基本的な情報を抽出
    return createClientFallback(ocrText);
  }
};

/**
 * サーバーエラー時のクライアント側フォールバック
 */
const createClientFallback = (ocrText) => {
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
    confidence: 'low',
    isFallback: true,
    rawOcr: ocrText
  };
};

/**
 * サーバー接続状況をチェック
 */
export const checkServerConnection = async () => {
  try {
    const response = await fetch(`${API_URL}/`);
    return response.ok;
  } catch (error) {
    return false;
  }
};
