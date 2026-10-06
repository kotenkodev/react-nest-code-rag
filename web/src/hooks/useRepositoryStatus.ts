import axios from "@/lib/axios";
import { useAuthStore } from "@/store/store";
import { RepositoryStatus } from "@/types/repository-status.type";
import { useQuery } from "@tanstack/react-query";

export type RepositoryProgress = {
  id?: string;
  name?: string;
  url?: string | null;
  status: RepositoryStatus;
  processedFilesCount: number;
  totalFilesCount: number;
  errorMessage?: string;
};

export const useRepositoryStatus = () => {
  const user = useAuthStore((s) => s.user);

  return useQuery<RepositoryProgress>({
    queryKey: ["repository", "status", user?.email],
    queryFn: async () => {
      const res = await axios.get("/api/repositories/status");
      return res.data;
    },
    enabled: !!user?.email,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === RepositoryStatus.PENDING ? 1000 : false;
    },
  });
};
