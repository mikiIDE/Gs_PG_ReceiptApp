import axios from 'axios';
import { API_URL } from '../config';

export const receiptAPI = {
  // レシート一覧取得
  getReceipts: async () => {
    const response = await axios.get(`${API_URL}/receipts`);
    return response.data;
  },
  
  // レシート追加
  addReceipt: async (receiptData) => {
    const response = await axios.post(`${API_URL}/receipts`, receiptData);
    return response.data;
  }
};
