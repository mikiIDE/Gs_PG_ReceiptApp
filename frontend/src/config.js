// バックエンドのURL設定
// export const API_URL = 'http://localhost:3000/api';

// iOS シミュレーターの場合
// export const API_URL = 'http://127.0.0.1:3000/api';

export const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://receipt-app-backend-production.up.railway.app/api'
  : 'http://127.0.0.1:3000/api';
