import apiClient from "@/lib/api-client";

export interface BusinessProfileDto {
  name: string;
  gstin?: string;
  entityType: "PROPRIETOR" | "PVT_LTD" | "LLP" | "PARTNERSHIP";
  gstStatus: "REGULAR" | "COMPOSITION" | "NOT_REGISTERED" | "PENDING";
  employeeRange: "SOLO" | "SMALL" | "GROWING" | "MID" | "LARGE";
  states: string[];
  industry: "TRADING" | "MANUFACTURING" | "FOOD" | "IT_SERVICES" | "EXPORT_IMPORT" | "OTHER";
  turnoverRange: "UNDER_20L" | "L20_1CR5" | "CR1_5_5" | "CR5_20" | "ABOVE_20CR";
  isExporter?: boolean;
  hasPoshObligation?: boolean;
}

export const businessService = {
  createProfile: (dto: BusinessProfileDto) => apiClient.post("/business/profile", dto),
  getProfile: () => apiClient.get("/business/profile"),
  updateProfile: (dto: Partial<BusinessProfileDto>) => apiClient.put("/business/profile", dto),
  getNotificationPreferences: () => apiClient.get("/business/notifications"),
  updateNotificationPreferences: (prefs: unknown) => apiClient.put("/business/notifications", prefs),
};
