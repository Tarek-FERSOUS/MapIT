import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { useAuthStore } from "../store/authStore";

function getWebBaseURL(): string {
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:3000`;
  }
  return "http://localhost:3000";
}

function getNativeBaseURL(): string {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri;

  const host = typeof hostUri === "string" ? hostUri.split(":")[0] : null;

  if (host) {
    return `http://${host}:3000`;
  }

  return "http://localhost:3000";
}

const webBaseURL = process.env.EXPO_PUBLIC_API_URL_WEB || getWebBaseURL();
const runtimeNativeBaseURL = getNativeBaseURL();
const envNativeBaseURL = process.env.EXPO_PUBLIC_API_URL || "";
const nativeBaseURL = runtimeNativeBaseURL || envNativeBaseURL || "http://localhost:3000";
const baseURL = Platform.OS === "web" ? webBaseURL : nativeBaseURL;

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json"
      }
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear auth and let the app redirect to login
          useAuthStore.getState().clearAuth();
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = void>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();

// Error handling utility
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data?.error && typeof data.error === "string") {
      return data.error;
    }

    if (data?.message && typeof data.message === "string") {
      return data.message;
    }

    if (error.response?.status === 404) {
      return "Resource not found";
    }

    if (error.response?.status === 401) {
      return "Authentication required. Please log in again.";
    }

    if (error.response?.status === 403) {
      return "You do not have permission to perform this action";
    }

    if (error.response?.status === 500) {
      return "Server error. Please try again later.";
    }

    if (error.message === "Network Error") {
      return "Network error. Please check your connection.";
    }

    if (error.message) {
      return error.message;
    }
  }

  return fallback;
}

// Convenience methods for common endpoints
export const api = {
  // Auth
  auth: {
    login: (username: string, password: string) =>
      apiClient.post<{ token: string; role: string }>("/auth/login", {
        username,
        password
      }),
    getMe: () =>
      apiClient.get<{ user: any }>("/auth/me")
  },

  // Dashboard
  dashboard: {
    getSummary: () =>
      apiClient.get<any>("/dashboard/summary")
  },

  // Incidents
  incidents: {
    list: (params?: { q?: string; status?: string; priority?: string }) =>
      apiClient.get<any>("/incidents", { params }),
    get: (id: string) =>
      apiClient.get<any>(`/incidents/${id}`),
    create: (data: any) =>
      apiClient.post<any>("/incidents", data),
    update: (id: string, data: any) =>
      apiClient.patch<any>(`/incidents/${id}`, data),
    delete: (id: string) =>
      apiClient.delete(`/incidents/${id}`),
    addNote: (id: string, note: string) =>
      apiClient.post(`/incidents/${id}/notes`, { note })
  },

  // Documents
  documents: {
    list: (params?: { q?: string }) =>
      apiClient.get<any>("/documents", { params }),
    get: (id: string) =>
      apiClient.get<any>(`/documents/${id}`),
    create: (data: any) =>
      apiClient.post<any>("/documents", data),
    update: (id: string, data: any) =>
      apiClient.patch<any>(`/documents/${id}`, data),
    delete: (id: string) =>
      apiClient.delete(`/documents/${id}`)
  },

  // Assets
  assets: {
    list: (params?: { q?: string; type?: string; status?: string }) =>
      apiClient.get<any>("/assets", { params }),
    get: (id: string) =>
      apiClient.get<any>(`/assets/${id}`),
    create: (data: any) =>
      apiClient.post<any>("/assets", data),
    update: (id: string, data: any) =>
      apiClient.patch<any>(`/assets/${id}`, data),
    delete: (id: string) =>
      apiClient.delete(`/assets/${id}`)
  },

  // Problems
  problems: {
    list: (params?: { q?: string; severity?: string; status?: string }) =>
      apiClient.get<any>("/problems", { params }),
    get: (id: string) =>
      apiClient.get<any>(`/problems/${id}`),
    create: (data: any) =>
      apiClient.post<any>("/problems", data),
    update: (id: string, data: any) =>
      apiClient.patch<any>(`/problems/${id}`, data),
    delete: (id: string) =>
      apiClient.delete(`/problems/${id}`)
  },

  // Relationships
  relationships: {
    list: (params?: { sourceId?: string; targetId?: string }) =>
      apiClient.get<any>("/relationships", { params }),
    create: (data: any) =>
      apiClient.post<any>("/relationships", data),
    delete: (id: string) =>
      apiClient.delete(`/relationships/${id}`)
  },

  // Search
  search: {
    global: (query: string) =>
      apiClient.get<any>("/search", { params: { q: query } })
  },

  // Knowledge suggestions
  knowledge: {
    suggestionsForIncident: (incidentId: string) =>
      apiClient.get<any>(`/incidents/${incidentId}/suggestions`),
    suggestionsForProblem: (problemId: string) =>
      apiClient.get<any>(`/problems/${problemId}/suggestions`)
  },

  // Settings
  settings: {
    get: (username: string) =>
      apiClient.get<any>(`/settings/${username}`),
    update: (username: string, data: any) =>
      apiClient.patch<any>(`/settings/${username}`, data)
  },

  // Reports
  reports: {
    generate: (type: string, params?: any) =>
      apiClient.post<any>("/reports/generate", { type, params })
  }
};

export default apiClient;
