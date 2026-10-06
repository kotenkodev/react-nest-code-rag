import axios from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export const useApiStatus = () => {
  const { data, isError } = useQuery({
    queryKey: ["api"],
    queryFn: async () => {
      const res = await axios.get("/api/health");
      return res.data.status === "OK";
    },
    refetchInterval: 3000,
    refetchOnMount: true,
  });
  return { isOnline: data, isError };
};
