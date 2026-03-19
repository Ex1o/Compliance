import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { businessService, BusinessProfileDto } from "@/services/business.service";

export const useBusinessProfile = () =>
  useQuery({
    queryKey: ["business-profile"],
    queryFn: () => businessService.getProfile(),
    staleTime: 300000,
  });

export const useSaveProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: BusinessProfileDto) => businessService.createProfile(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-profile"] });
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Profile saved. Generating your compliance calendar...");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
