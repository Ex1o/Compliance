import { create } from "zustand";
import { persist } from "zustand/middleware";
import apiClient from "@/lib/api-client";

interface User {
  id: string;
  role: "MSME_OWNER" | "CA_PARTNER" | "ADMIN";
  mobile?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isNewUser: boolean;
  isLoading: boolean;
  sendOtp: (mobile: string) => Promise<{ expiresIn: number }>;
  verifyOtp: (mobile: string, otp: string) => Promise<{ isNewUser: boolean }>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isNewUser: false,
      isLoading: false,

      sendOtp: async (mobile: string) => {
        const res = await apiClient.post("/auth/otp/send", { mobile });
        return res.data;
      },

      verifyOtp: async (mobile: string, otp: string) => {
        const res = await apiClient.post("/auth/otp/verify", { mobile, otp });
        const { accessToken, isNewUser, user } = res.data;
        localStorage.setItem("access_token", accessToken);
        set({ accessToken, isNewUser, user, isAuthenticated: true });
        return { isNewUser };
      },

      logout: async () => {
        try {
          await apiClient.post("/auth/logout");
        } finally {
        localStorage.removeItem("access_token");
        set({ user: null, accessToken: null, isAuthenticated: false });
        window.location.href = "/login";
        }
      },

      fetchMe: async () => {
        const res = await apiClient.get("/auth/me");
        set({ user: res.data, isAuthenticated: true });
      },

      setToken: (token: string) => {
        localStorage.setItem("access_token", token);
        set({ accessToken: token });
      },
    }),
    {
      name: "compliancewala-auth",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
