import { ChevronRight, FolderOpen, Folder, FileCode2 } from "lucide-react";

interface FileItem {
  name: string;
  type: "file" | "folder";
  depth: number;
  open?: boolean;
  active?: boolean;
}

const defaultFiles: FileItem[] = [
  { name: "src", type: "folder", depth: 0, open: true },
  { name: "app", type: "folder", depth: 1, open: true },
  { name: "layout.tsx", type: "file", depth: 2 },
  { name: "page.tsx", type: "file", depth: 2 },
  { name: "lib", type: "folder", depth: 1, open: true },
  { name: "auth.ts", type: "file", depth: 2, active: true },
  { name: "db.ts", type: "file", depth: 2 },
  { name: "middleware.ts", type: "file", depth: 1 },
  { name: "package.json", type: "file", depth: 0 },
];

export default function FileTree({ files = defaultFiles }: { files?: FileItem[] }) {
  return (
    <div className="py-2">
      {files.map((item, index) => {
        const Icon =
          item.type === "folder"
            ? item.open
              ? FolderOpen
              : Folder
            : FileCode2;
        return (
          <button
            key={`${item.name}-${index}`}
            className={`flex h-8 w-full items-center gap-2 border-l-2 text-left text-[0.7rem] transition-colors ${
              item.active
                ? "border-[var(--color-green)] bg-[var(--surface-raised)] text-[var(--color-green)]"
                : "border-transparent text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-secondary)]"
            }`}
            style={{ paddingLeft: `${12 + item.depth * 14}px` }}
          >
            {item.type === "folder" && (
              <ChevronRight
                size={10}
                className={item.open ? "rotate-90" : ""}
              />
            )}
            <Icon size={13} />
            {item.name}
          </button>
        );
      })}
    </div>
  );
}
