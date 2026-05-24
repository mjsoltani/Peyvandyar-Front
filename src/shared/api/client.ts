// API Client with Axios
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { env } from '../config/env';
import { API_CONFIG } from '../config/constants';
import { ApiError } from '../types/api';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: env.API_BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        if (typeof window !== 'undefined') {
          const token = this.getAuthToken();
          if (token) {
            config.headers['X-Encrypted-Token'] = token;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        const apiError = this.handleError(error);
        return Promise.reject(apiError);
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'peyvandyar_token') {
        return value;
      }
    }
    return null;
  }

  private handleError(error: AxiosError): ApiError {
    const response = error.response;
    const data = response?.data as any;

    const apiError: ApiError = {
      message: data?.message || data?.error || error.message || 'خطای ناشناخته',
      statusCode: response?.status,
      isAuthError: response?.status === 401 || response?.status === 403,
      isSubscriptionExpired: data?.error === 'subscription_expired',
    };

    // Log error in development
    if (env.IS_DEVELOPMENT) {
      console.error('API Error:', apiError);
    }

    return apiError;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put(url, data, config);
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.patch(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config);
  }
}

export const apiClient = new ApiClient();
