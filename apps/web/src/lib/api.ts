import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig
} from "axios";
import { ApiError } from "@/types/api";

const API_BASE_URL = "/api/backend";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json"
      }
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear auth state and redirect to login
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(
    url: string,
    data?: Record<string, any>
  ): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: Record<string, any>
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T = void>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export const apiClient = new ApiClient();

export function getApiErrorMessage(error: unknown, fallbackMessage = "Something went wrong") {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as ApiError | string | undefined;

    if (typeof responseData === "string" && responseData.trim()) {
      return responseData;
    }

    if (responseData && typeof responseData === "object") {
      if (typeof responseData.error === "string" && responseData.error.trim()) {
        return responseData.error;
      }

      if (typeof responseData.message === "string" && responseData.message.trim()) {
        return responseData.message;
      }
    }

    if (error.response?.status === 404) {
      return "Requested data was not found";
    }

    if (error.message && error.message !== "Network Error") {
      return error.message;
    }

    return "Unable to reach the server. Please try again.";
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}
