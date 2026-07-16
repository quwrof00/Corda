import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Point this to your running Next.js backend
export const API_BASE_URL = "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Expose token management helpers
export const TokenStorage = {
  set: async (token: string) => {
    if (Platform.OS === "web") {
      try { localStorage.setItem("auth_token", token); } catch (e) {}
    } else {
      await SecureStore.setItemAsync("auth_token", token);
    }
  },
  get: async () => {
    if (Platform.OS === "web") {
      try { return localStorage.getItem("auth_token"); } catch (e) { return null; }
    } else {
      return await SecureStore.getItemAsync("auth_token");
    }
  },
  clear: async () => {
    if (Platform.OS === "web") {
      try { localStorage.removeItem("auth_token"); } catch (e) {}
    } else {
      await SecureStore.deleteItemAsync("auth_token");
    }
  },
};

// Inject JWT token from storage into every request
api.interceptors.request.use(async (config) => {
  const token = await TokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
