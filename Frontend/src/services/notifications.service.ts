import apiClient from "@/lib/api-client";

export const notificationsService = {
  getHistory: () => apiClient.get("/notifications/history"),
};
