import axios from "@/lib/axios";
import { useAuthStore } from "@/store/store";
import { useQuery } from "@tanstack/react-query";

export const useRepository = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const {} = useQuery({
    queryKey: ["repository"],
    queryFn: async () => {
      const res = await axios.get("/api/repositories");
      return res.data;
    },
    enabled: isAuthenticated,
  });
};
