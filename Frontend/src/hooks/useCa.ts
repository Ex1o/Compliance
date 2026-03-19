import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { caService } from "@/services/ca.service";

export const useCaDashboard = () =>
  useQuery({
    queryKey: ["ca-dashboard"],
    queryFn: () => caService.getDashboard(),
    refetchInterval: 120000,
  });

export const useAddClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mobile: string) => caService.addClient(mobile),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["ca-dashboard"] });
      toast.success(`${res.data?.clientName || "Client"} added successfully`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useMarkClientFiled = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: string) => caService.markClientDeadlineFiled(instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ca-dashboard"] });
      toast.success("Client filing recorded");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
