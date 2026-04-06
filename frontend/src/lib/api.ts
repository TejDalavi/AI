import axios from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: "https://ai-2-wem5.onrender.com", // ✅ FIXED
});

// ✅ Attach JWT token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ✅ Handle 401 errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
