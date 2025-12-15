/**
 * Serviço de comunicação HTTP com o backend FastAPI
 * Configuração centralizada do cliente Axios
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { env } from '../utils/env';
import { logError, logDebug } from '../utils/logger';
import { BackendError } from '../utils/errorHandler';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.BACKEND_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logDebug(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
          data: config.data,
        });
        return config;
      },
      (error) => {
        logError('Erro na requisição', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logDebug(`[API] Resposta recebida de ${response.config.url}`, {
          status: response.status,
        });
        return response;
      },
      (error: AxiosError) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError): void {
    if (error.response) {
      // Resposta com código de erro
      logError(`Erro na resposta [${error.response.status}]`, error, {
        url: error.config?.url,
        data: error.response.data,
      });
    } else if (error.request) {
      // Requisição foi feita mas não houve resposta
      logError('Sem resposta do backend', error, {
        url: error.config?.url,
      });
    } else {
      // Erro ao configurar a requisição
      logError('Erro ao configurar requisição', error);
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw new BackendError('Erro ao fazer GET', { url, error });
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw new BackendError('Erro ao fazer POST', { url, error });
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw new BackendError('Erro ao fazer PUT', { url, error });
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw new BackendError('Erro ao fazer DELETE', { url, error });
    }
  }

  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }
}

export default new ApiService();
