import { useQuery } from "@tanstack/react-query";
import { healthService } from "@/services/health.service";

export const useHealthScore = () =>
  useQuery({
    queryKey: ["health-score"],
    queryFn: () => healthService.getScore(),
    staleTime: 120000,
  });
