import axios from "@/lib/axios";
import { useAuthStore } from "@/store/store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useRepository = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["repository"],
    queryFn: async () => {
      const res = await axios.get("/api/repositories");
      return res.data;
    },
    enabled: isAuthenticated,
  });
};

export const useDeleteRepository = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await axios.delete("/api/repositories");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repository"] });
    },
  });
};
