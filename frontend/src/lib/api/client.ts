import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { APIResponse, HTTP_STATUS } from '@/types/api';

class APIClient {
  private client: AxiosInstance;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`[API] Response ${response.status} from ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        const status = error.response?.status;
        const url = error.config?.url;

        console.error(`[API] Error ${status} from ${url}:`, error.response?.data || error.message);

        // Handle specific error cases
        if (status === HTTP_STATUS.UNAUTHORIZED) {
          // Handle unauthorized access
          console.warn('[API] Unauthorized access');
        } else if (status === HTTP_STATUS.SERVICE_UNAVAILABLE) {
          // Handle service unavailable
          console.warn('[API] Service unavailable');
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic GET request
  async get<T>(url: string, params?: Record<string, any>): Promise<APIResponse<T>> {
    try {
      const response = await this.client.get<any>(url, { params });
      const data = response.data;

      // Check if response is already in APIResponse format
      if (data && typeof data === 'object' && 'success' in data) {
        return data as APIResponse<T>;
      }

      // Otherwise, wrap the response in APIResponse format
      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Generic POST request
  async post<T>(url: string, data?: any): Promise<APIResponse<T>> {
    try {
      const response = await this.client.post<any>(url, data);
      const responseData = response.data;

      // Check if response is already in APIResponse format
      if (responseData && typeof responseData === 'object' && 'success' in responseData) {
        return responseData as APIResponse<T>;
      }

      // Otherwise, wrap the response in APIResponse format
      return {
        success: true,
        data: responseData as T,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Generic PUT request
  async put<T>(url: string, data?: any): Promise<APIResponse<T>> {
    try {
      const response = await this.client.put<any>(url, data);
      const responseData = response.data;

      // Check if response is already in APIResponse format
      if (responseData && typeof responseData === 'object' && 'success' in responseData) {
        return responseData as APIResponse<T>;
      }

      // Otherwise, wrap the response in APIResponse format
      return {
        success: true,
        data: responseData as T,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Generic DELETE request
  async delete<T>(url: string): Promise<APIResponse<T>> {
    try {
      const response = await this.client.delete<any>(url);
      const responseData = response.data;

      // Check if response is already in APIResponse format
      if (responseData && typeof responseData === 'object' && 'success' in responseData) {
        return responseData as APIResponse<T>;
      }

      // Otherwise, wrap the response in APIResponse format
      return {
        success: true,
        data: responseData as T,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // File upload
  async upload<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<APIResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.client.post<any>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      const responseData = response.data;

      // Check if response is already in APIResponse format
      if (responseData && typeof responseData === 'object' && 'success' in responseData) {
        return responseData as APIResponse<T>;
      }

      // Otherwise, wrap the response in APIResponse format
      return {
        success: true,
        data: responseData as T,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Handle errors consistently
  private handleError(error: any): APIResponse {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      return {
        success: false,
        error: data?.error || `HTTP ${status} Error`,
        message: data?.message || 'Request failed',
      };
    } else if (error.request) {
      // Network error
      return {
        success: false,
        error: 'Network Error',
        message: 'Unable to connect to the server. Please check your connection.',
      };
    } else {
      // Other error
      return {
        success: false,
        error: 'Client Error',
        message: error.message || 'An unexpected error occurred',
      };
    }
  }

  // Set authorization header
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Remove authorization header
  removeAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Set custom header
  setHeader(key: string, value: string): void {
    this.client.defaults.headers.common[key] = value;
  }

  // Remove custom header
  removeHeader(key: string): void {
    delete this.client.defaults.headers.common[key];
  }
}

// Create singleton instance
export const apiClient = new APIClient();

// Export class for custom instances
export { APIClient };