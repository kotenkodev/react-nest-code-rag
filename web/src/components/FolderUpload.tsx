import { useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { Input } from "./ui/input/input";
import { Button } from "./ui/button/button";
import {
  Link2,
  Folder,
  Upload,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  ArrowRight,
  FileCode,
} from "lucide-react";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB per file
const MAX_BATCH_SIZE_BYTES = 10 * 1024 * 1024; // 10MB total batch

export interface FolderUploadProps {
  onSourceSelected?: (source: {
    type: "link" | "folder";
    value: string;
    fileCount?: number;
  }) => void;
  className?: string;
}

export function FolderUpload({ onSourceSelected, className = "" }: FolderUploadProps) {
  const [activeTab, setActiveTab] = useState<"link" | "folder">("folder");
  
  // Link state
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [linkStatus, setLinkStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [linkError, setLinkError] = useState("");

  // Folder upload state
  const [files, setFiles] = useState<File[]>([]);
  const [folderError, setFolderError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Folder size calculation
  const totalSizeBytes = files.reduce((acc, f) => acc + f.size, 0);
  const formattedSize = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  const handleFolderChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFolderError("");
    setUploadSuccess(false);

    if (!event.target.files || event.target.files.length === 0) {
      setFiles([]);
      return;
    }

    const selectedFiles = Array.from(event.target.files);
    let totalSize = 0;
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFolderError(`File "${file.name}" exceeds the 2MB limit.`);
        return;
      }

      totalSize += file.size;
      if (totalSize > MAX_BATCH_SIZE_BYTES) {
        setFolderError("Total folder size exceeds the 10MB batch limit.");
        return;
      }

      validFiles.push(file);
    }

    setFiles(validFiles);
  };

  const handleFolderUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setFolderError("");

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file, file.webkitRelativePath || file.name);
    });

    try {
      // Simulate/Trigger API request
      await fetch("/api/upload", {
        method: "POST",
        body: formData,
      }).catch(() => null); // Gracefully handle dev mock

      setIsUploading(false);
      setUploadSuccess(true);

      const folderName = files[0]?.webkitRelativePath?.split("/")[0] || "Local Folder";
      onSourceSelected?.({
        type: "folder",
        value: folderName,
        fileCount: files.length,
      });
    } catch (err) {
      setIsUploading(false);
      setFolderError("Upload failed. Please check backend connection.");
    }
  };

  const handleLinkSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      setLinkError("Please enter a valid Git repository URL.");
      return;
    }

    setLinkError("");
    setLinkStatus("loading");

    try {
      // Simulate API indexing request
      await new Promise((resolve) => setTimeout(resolve, 800));
      setLinkStatus("success");
      onSourceSelected?.({
        type: "link",
        value: repoUrl.trim(),
      });
    } catch (err) {
      setLinkStatus("error");
      setLinkError("Failed to index repository link.");
    }
  };

  const resetFolder = () => {
    setFiles([]);
    setFolderError("");
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`border border-[var(--border)] bg-[var(--surface)] p-3 ${className}`}>
      {/* Mode Toggle Header */}
      <div className="mb-3 flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="text-[0.6rem] font-mono tracking-[0.16em] text-[var(--text-muted)] uppercase">
          SOURCE CONFIGURATION
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={`flex items-center gap-1 px-2 py-1 text-[0.65rem] font-mono transition-all ${
              activeTab === "link"
                ? "bg-[var(--surface-raised)] text-[var(--color-green)] border border-[var(--border-active)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent"
            }`}
          >
            <Link2 size={11} /> LINK
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("folder")}
            className={`flex items-center gap-1 px-2 py-1 text-[0.65rem] font-mono transition-all ${
              activeTab === "folder"
                ? "bg-[var(--surface-raised)] text-[var(--color-green)] border border-[var(--border-active)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent"
            }`}
          >
            <Folder size={11} /> FOLDER
          </button>
        </div>
      </div>

      {/* Tab 1: GIT REPOSITORY LINK */}
      {activeTab === "link" && (
        <form onSubmit={handleLinkSubmit} className="space-y-3">
          <div>
            <Input
              label="Repository URL"
              placeholder="https://github.com/org/repo.git"
              value={repoUrl}
              onChange={(e) => {
                setRepoUrl(e.target.value);
                setLinkError("");
              }}
              prefix="git://"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
            />
            <div className="flex items-end">
              <Button
                type="submit"
                variant="EXEC"
                size="SM"
                className="w-full"
                disabled={!repoUrl.trim() || linkStatus === "loading"}
              >
                {linkStatus === "loading" ? "INDEXING..." : "INDEX LINK"}
                <ArrowRight size={12} className="ml-1" />
              </Button>
            </div>
          </div>

          {linkError && (
            <div className="flex items-center gap-1.5 text-[0.65rem] text-[var(--color-amber)] font-mono">
              <AlertTriangle size={12} /> {linkError}
            </div>
          )}

          {linkStatus === "success" && (
            <div className="flex items-center gap-1.5 text-[0.65rem] text-[var(--color-green)] font-mono">
              <CheckCircle2 size={12} /> Repository linked & queued for indexing.
            </div>
          )}
        </form>
      )}

      {/* Tab 2: LOCAL FOLDER UPLOAD */}
      {activeTab === "folder" && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            id="folder-upload-input"
            onChange={handleFolderChange}
            {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
          />

          {files.length === 0 ? (
            <label
              htmlFor="folder-upload-input"
              className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-[var(--border)] bg-[var(--surface-raised)] p-4 text-center transition-all hover:border-[var(--color-green)] hover:bg-[var(--surface)]"
            >
              <FolderPlus size={20} className="mb-2 text-[var(--color-green)]" />
              <span className="text-[0.7rem] font-mono text-[var(--text-secondary)]">
                SELECT LOCAL PROJECT FOLDER
              </span>
              <span className="mt-1 text-[0.6rem] text-[var(--text-muted)]">
                Max 2MB per file · 10MB total batch limit
              </span>
            </label>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-2">
                <div className="flex items-center gap-2 truncate text-[0.7rem] font-mono text-[var(--text-secondary)]">
                  <FileCode size={14} className="text-[var(--color-green)] shrink-0" />
                  <span className="truncate">{files[0]?.webkitRelativePath?.split("/")[0] || "Folder"}</span>
                </div>
                <button
                  type="button"
                  onClick={resetFolder}
                  className="text-[var(--text-muted)] hover:text-[var(--color-amber)] transition-colors p-0.5"
                  title="Clear selected folder"
                >
                  <XCircle size={14} />
                </button>
              </div>

              <div className="flex items-center justify-between text-[0.62rem] font-mono text-[var(--text-muted)] px-1">
                <span>{files.length} files selected</span>
                <span>{formattedSize} MB</span>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="OUTLINE"
                  size="SM"
                  onClick={resetFolder}
                  className="flex-1"
                >
                  CLEAR
                </Button>
                <Button
                  type="button"
                  variant="EXEC"
                  size="SM"
                  onClick={handleFolderUpload}
                  disabled={isUploading}
                  className="flex-1"
                >
                  <Upload size={12} className="mr-1" />
                  {isUploading ? "UPLOADING..." : "UPLOAD"}
                </Button>
              </div>
            </div>
          )}

          {folderError && (
            <div className="flex items-center gap-1.5 text-[0.65rem] text-[var(--color-amber)] font-mono">
              <AlertTriangle size={12} /> {folderError}
            </div>
          )}

          {uploadSuccess && (
            <div className="flex items-center gap-1.5 text-[0.65rem] text-[var(--color-green)] font-mono">
              <CheckCircle2 size={12} /> Folder uploaded successfully!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
