import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deadlinesService } from "@/services/deadlines.service";

export const useDashboard = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: () => deadlinesService.getDashboard(),
    refetchInterval: 60000,
    staleTime: 30000,
  });

export const useDeadlines = (params?: { category?: string; status?: string; search?: string }) =>
  useQuery({
    queryKey: ["deadlines", params],
    queryFn: () => deadlinesService.getAll(params),
    staleTime: 30000,
  });

export const useCalendar = (year: number, month: number) =>
  useQuery({
    queryKey: ["calendar", year, month],
    queryFn: () => deadlinesService.getCalendar(year, month),
    staleTime: 60000,
  });

export const useMarkFiled = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: string) => deadlinesService.markFiled(instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["health-score"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["ca-dashboard"] });
      toast.success("Filing recorded successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
