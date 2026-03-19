import apiClient from "@/lib/api-client";

export const authService = {
  sendOtp: (mobile: string) => apiClient.post("/auth/otp/send", { mobile }),
  verifyOtp: (mobile: string, otp: string) => apiClient.post("/auth/otp/verify", { mobile, otp }),
  refresh: () => apiClient.post("/auth/refresh"),
  logout: () => apiClient.post("/auth/logout"),
  me: () => apiClient.get("/auth/me"),
};
