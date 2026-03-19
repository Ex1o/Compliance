import apiClient from "@/lib/api-client";

export const healthService = {
  getScore: () => apiClient.get("/health-score"),
};
