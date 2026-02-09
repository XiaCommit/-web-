import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  AxiosError,
  type AxiosResponse,
} from "axios";
import { ElNotification } from "element-plus";
import { reportError } from "@/utils/errorReport";
const service: AxiosInstance = axios.create({
  baseURL: '', 
  timeout: 5000,
});
// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = sessionStorage.getItem('token');
    if (token && config.url !== '/api/login' && config.url !== '/api/register') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    reportError(error, 'API', '网络请求失败，请重试');
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.data.code !== '0000' && response.data.status !== 1) {
      ElNotification({
        title: 'Error',
        message: response.data.message,
        type: 'error',
      });
      return response.data;
    }
    return response.data;
  },
  (error: AxiosError) => {
    reportError(error, 'API', '网络请求失败，请重试');
    return Promise.reject(error);
  }
);

export default service;
