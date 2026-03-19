import apiClient from "@/lib/api-client";

export const caService = {
  getDashboard: () => apiClient.get("/ca/dashboard"),
  getClientDeadlines: (businessId: string) => apiClient.get(`/ca/clients/${businessId}/deadlines`),
  markClientDeadlineFiled: (instanceId: string) => apiClient.patch(`/ca/clients/deadlines/${instanceId}/file`),
  addClient: (mobile: string) => apiClient.post("/ca/clients", { mobile }),
  removeClient: (businessId: string) => apiClient.delete(`/ca/clients/${businessId}`),
};
