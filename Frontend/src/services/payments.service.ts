import apiClient from "@/lib/api-client";

export type SubscriptionPlan = "FREE" | "STARTER" | "GROWTH" | "CA_PARTNER";

export const paymentsService = {
  createSubscription: (plan: SubscriptionPlan) => apiClient.post("/payments/subscribe", { plan }),
  getCurrentSubscription: () => apiClient.get("/payments/subscription"),
};
