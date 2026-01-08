import axios from "axios";
import { getSession } from "next-auth/react";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/api",
  withCredentials: true,
});

interface CustomSession {
  accessToken?: string;
}

api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const session = await getSession();
    if (session && (session as unknown as CustomSession).accessToken) {
      config.headers.Authorization = `Bearer ${(session as unknown as CustomSession).accessToken}`;
    }
  }
  return config;
});
