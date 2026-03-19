import apiClient from "@/lib/api-client";

const createHealthFallback = () => ({
  success: true,
  data: {
    overall: 78,
    gst: 82,
    tds: 74,
    pfEsi: 69,
    mca: 80,
    industry: 77,
    totalFiled: 78,
    penaltySaved: 12000,
    improvementTips: [
      "File GST returns at least 2 days before due date.",
      "Set monthly reminders for TDS payment deadlines.",
      "Review PF/ESI filings weekly to avoid overdue penalties.",
    ],
  },
  timestamp: new Date().toISOString(),
});

export const healthService = {
  getScore: async () => {
    try {
      return await apiClient.get("/health-score");
    } catch (error) {
      if (import.meta.env.DEV) {
        return createHealthFallback();
      }
      throw error;
    }
  },
};
