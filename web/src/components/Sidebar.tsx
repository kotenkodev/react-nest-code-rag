import { RepositoryStatus } from "@/types/repository-status.type";
import { Link2, Archive, Folder, GitBranch } from "lucide-react";
import { FolderUpload } from "./FolderUpload";
import { Badge } from "./ui/badge/badge";

type SidebarProps = {
  mobileTab: "search" | "sources";
  activeSource: {
    type: "link" | "folder" | "zip";
    value: string;
    fileCount?: number;
  };
  onSourceSelected: (source: {
    type: "link" | "folder" | "zip";
    value: string;
    fileCount?: number;
  }) => void;
};

export default function Sidebar({
  mobileTab,
  activeSource,
  onSourceSelected,
}: SidebarProps) {
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

      <div className="flex h-10 sm:h-11 shrink-0 items-center border-b border-(--border) px-3 sm:px-4">
        <Badge variant="OFFLINE" className="ml-auto text-[0.6rem]">
          {RepositoryStatus.IDLE}
        </Badge>
      </div>
    </aside>
  );
}
