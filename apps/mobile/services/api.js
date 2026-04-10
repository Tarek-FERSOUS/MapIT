import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { useAuthStore } from "../store/authStore";

function getWebBaseURL() {
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:3000`;
  }

  return "http://localhost:3000";
}

function getNativeBaseURL() {
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

const defaultBaseURL = Platform.OS === "web" ? getWebBaseURL() : getNativeBaseURL();
const webBaseURL = process.env.EXPO_PUBLIC_API_URL_WEB || getWebBaseURL();
const nativeBaseURL = process.env.EXPO_PUBLIC_API_URL || getNativeBaseURL();
const baseURL = Platform.OS === "web" ? webBaseURL : nativeBaseURL || defaultBaseURL;

const api = axios.create({
  baseURL,
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }

    return Promise.reject(error);
  }
);

export default api;