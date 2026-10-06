import { RepositoryStatus } from "@/types/repository-status.type";
import { Link2, Archive, Folder } from "lucide-react";
import { FolderUpload } from "./FolderUpload";
import { Badge } from "./ui/badge/badge";
import type { RepositoryProgress } from "@/hooks/useRepositoryStatus";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip/tooltip";

type SidebarProps = {
  mobileTab: "search" | "sources";
  activeSource: {
    type: "link" | "folder" | "zip";
    value: string;
    fileCount?: number;
  };
  status?: RepositoryProgress;
  onSourceSelected: (source: {
    type: "link" | "folder" | "zip";
    value: string;
    fileCount?: number;
  }) => void;
};

export default function Sidebar({
  mobileTab,
  activeSource,
  status,
  onSourceSelected,
}: SidebarProps) {
  const currentStatus = status?.status ?? RepositoryStatus.IDLE;

  return (
    <aside
      className={`border-r border-(--border) bg-(--surface) h-full overflow-y-auto ${
        mobileTab === "sources" ? "flex flex-col" : "hidden md:flex md:flex-col"
      }`}
    >
      <div className="border-b border-(--border) p-3 sm:p-4">
        <div className="mb-2 text-[0.6rem] tracking-[0.16em] text-(--text-muted) font-mono">
          ACTIVE SOURCE
        </div>
        <div className="mb-3 flex items-center gap-2 text-xs text-(--text-secondary) font-mono min-w-0">
          {activeSource.type === "link" ? (
            <Link2 size={13} className="text-(--text-primary) shrink-0" />
          ) : activeSource.type === "zip" ? (
            <Archive size={13} className="text-(--text-primary) shrink-0" />
          ) : (
            <Folder size={13} className="text-(--text-primary) shrink-0" />
          )}
          <span className="truncate font-medium">{activeSource.value}</span>
        </div>

        <FolderUpload
          onSourceSelected={(source) => {
            onSourceSelected(source);
          }}
          className="mt-2"
        />
      </div>

      <div className="flex h-10 sm:h-11 shrink-0 items-center justify-between border-b border-(--border) px-3 sm:px-4 text-[0.65rem] font-mono text-(--text-muted)">
        <span>STATUS</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help inline-flex">
                <Badge
                  variant={
                    currentStatus === RepositoryStatus.SUCCESS
                      ? "ACTIVE"
                      : currentStatus === RepositoryStatus.PENDING
                        ? "SCANNING"
                        : currentStatus === RepositoryStatus.FAILED
                          ? "CRITICAL"
                          : "OFFLINE"
                  }
                  className="text-[0.6rem]"
                >
                  {currentStatus === RepositoryStatus.PENDING
                    ? `PENDING (${status?.processedFilesCount ?? 0}/${status?.totalFilesCount ?? 0})`
                    : currentStatus}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs normal-case">
              {status?.errorMessage ? (
                <span className="text-red-400 font-sans">
                  Error: {status.errorMessage}
                </span>
              ) : currentStatus === RepositoryStatus.PENDING ? (
                `Indexing files (${status?.processedFilesCount ?? 0} of ${status?.totalFilesCount ?? 0}). Chunks are being vectorized.`
              ) : currentStatus === RepositoryStatus.SUCCESS ? (
                `Repository successfully indexed (${status?.totalFilesCount ?? 0} files).`
              ) : currentStatus === RepositoryStatus.FAILED ? (
                "Indexing failed. Please check repository or try uploading again."
              ) : (
                "No active codebase indexed. Upload a repository or link to start."
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}
