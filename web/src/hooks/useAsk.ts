import axios from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";

export const useAskChat = () => {
  return useMutation({
    mutationFn: async (query: string) => {
      const res = await axios.post("/rag/query", { query });
      return res.data;
    },
  });
};
