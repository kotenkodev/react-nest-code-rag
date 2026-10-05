import axios from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export const useRepository = () => {
  const {} = useQuery({
    queryKey: ["repository"],
    queryFn: async () => {
      const res = await axios.get("/api/repositories");
      return res.data;
    },
  });
};
