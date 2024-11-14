export const API_CONFIG = {
  baseUrl: 'http://192.168.0.40:7117',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  endpoints: {
    deviceData: '/api/AREditior/GetDeviceData',
    assignDeviceData: '/api/AREditior/GetAssignDeviceData'
  }
};

// 測試連接函數
export const testConnection = async () => {
  try {
    // 1. 測試基本連接
    const baseResponse = await fetch(API_CONFIG.baseUrl);
    console.log('Base URL response:', baseResponse.status);

    // 2. 測試 OPTIONS 請求
    const optionsResponse = await fetch(API_CONFIG.baseUrl, {
      method: 'OPTIONS',
      headers: API_CONFIG.headers
    });
    console.log('OPTIONS response:', optionsResponse.status);

    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}; 