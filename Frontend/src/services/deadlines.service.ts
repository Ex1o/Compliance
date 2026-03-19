import apiClient from "@/lib/api-client";

const createDashboardFallback = () => {
  const now = new Date();
  const inDays = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  };

  const upcoming = [
    {
      id: "dev-gst-1",
      title: "GSTR-3B Monthly Return",
      form: "GSTR-3B",
      category: "GST",
      dueDate: inDays(3),
      daysLeft: 3,
      status: "PENDING",
      penaltyRate: "₹50/day",
      portalUrl: "https://www.gst.gov.in/",
    },
    {
      id: "dev-tds-1",
      title: "TDS Payment",
      form: "Challan 281",
      category: "TDS",
      dueDate: inDays(6),
      daysLeft: 6,
      status: "PENDING",
      penaltyRate: "1.5%/month",
      portalUrl: "https://www.incometax.gov.in/",
    },
    {
      id: "dev-pf-1",
      title: "EPF Monthly Filing",
      form: "ECR",
      category: "PF",
      dueDate: inDays(-2),
      daysLeft: -2,
      status: "OVERDUE",
      penaltyRate: "₹100/day",
      portalUrl: "https://unifiedportal-emp.epfindia.gov.in/",
    },
  ];

  return {
    success: true,
    data: {
      summary: {
        overdue: 1,
        dueThisWeek: 2,
        dueThisMonth: 4,
      },
      penalties: {
        total: 2200,
        saved: 12000,
      },
      overdueItems: [
        {
          ...upcoming[2],
          dailyRate: 100,
          daysOverdue: 2,
        },
      ],
      upcoming,
    },
    timestamp: new Date().toISOString(),
  };
};

export const deadlinesService = {
  getDashboard: async () => {
    try {
      return await apiClient.get("/deadlines/dashboard");
    } catch (error) {
      if (import.meta.env.DEV) {
        return createDashboardFallback();
      }
      throw error;
    }
  },
  getAll: (params?: { category?: string; status?: string; search?: string }) => apiClient.get("/deadlines", { params }),
  getCalendar: (year: number, month: number) => apiClient.get("/deadlines/calendar", { params: { year, month } }),
  markFiled: (instanceId: string) => apiClient.patch(`/deadlines/${instanceId}/file`),
};
