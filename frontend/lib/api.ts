import axios from "axios";
import { guestAdapter } from "./guestAdapter";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const isGuest = localStorage.getItem('guestMode') === 'true';
    if (isGuest) {
      config.adapter = guestAdapter;
    }
  }
  return config;
});
