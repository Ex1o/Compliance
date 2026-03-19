import apiClient from "@/lib/api-client";

export const deadlinesService = {
  getDashboard: () => apiClient.get("/deadlines/dashboard"),
  getAll: (params?: { category?: string; status?: string; search?: string }) => apiClient.get("/deadlines", { params }),
  getCalendar: (year: number, month: number) => apiClient.get("/deadlines/calendar", { params: { year, month } }),
  markFiled: (instanceId: string) => apiClient.patch(`/deadlines/${instanceId}/file`),
};
