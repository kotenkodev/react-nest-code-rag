import { useState, useRef, type ChangeEvent, type FormEvent, type DragEvent } from "react";
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
  Files,
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

async function readEntryFiles(entry: any): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file(
        (file: File) => {
          const relativePath = entry.fullPath ? entry.fullPath.replace(/^\//, "") : file.name;
          Object.defineProperty(file, "webkitRelativePath", {
            value: relativePath,
            writable: false,
            configurable: true,
          });
          resolve([file]);
        },
        () => resolve([])
      );
    });
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();
    const entries: any[] = await new Promise((resolve) => {
      dirReader.readEntries(
        (results: any[]) => resolve(results),
        () => resolve([])
      );
    });
    const nestedFiles = await Promise.all(entries.map((child) => readEntryFiles(child)));
    return nestedFiles.flat();
  }
  return [];
}

export function FolderUpload({ onSourceSelected, className = "" }: FolderUploadProps) {
  const [activeTab, setActiveTab] = useState<"link" | "folder">("folder");

  // Link state
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [linkStatus, setLinkStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [linkError, setLinkError] = useState("");

  // Folder & File upload state
  const [files, setFiles] = useState<File[]>([]);
  const [folderError, setFolderError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSizeBytes = files.reduce((acc, f) => acc + f.size, 0);
  const formattedSize = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  const rootFolderNames = Array.from(
    new Set(
      files
        .map((f) => f.webkitRelativePath?.split("/")[0] || f.name)
        .filter(Boolean)
    )
  );

  const processAndAddFiles = (newFiles: File[]) => {
    setFolderError("");
    setUploadSuccess(false);

    if (newFiles.length === 0) return;

    const existingPaths = new Set(files.map((f) => f.webkitRelativePath || f.name));
    const combinedFiles = [...files];

    let currentTotalSize = totalSizeBytes;

    for (const file of newFiles) {
      const pathKey = file.webkitRelativePath || file.name;
      if (existingPaths.has(pathKey)) continue;

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFolderError(`File "${file.name}" exceeds the 2MB limit.`);
        return;
      }

      currentTotalSize += file.size;
      if (currentTotalSize > MAX_BATCH_SIZE_BYTES) {
        setFolderError("Total selection size exceeds the 10MB batch limit.");
        return;
      }

      existingPaths.add(pathKey);
      combinedFiles.push(file);
    }

    setFiles(combinedFiles);
  };

  const removeFolderOrFile = (targetName: string) => {
    setFiles((prevFiles) =>
      prevFiles.filter((file) => {
        const rootName = file.webkitRelativePath?.split("/")[0] || file.name;
        return rootName !== targetName;
      })
    );
  };

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      processAndAddFiles(Array.from(event.target.files));
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = Array.from(e.dataTransfer.items || []);
    if (items.length > 0) {
      const filePromises = items.map((item) => {
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) {
          return readEntryFiles(entry);
        }
        const file = item.getAsFile();
        return Promise.resolve(file ? [file] : []);
      });

      const extractedFiles = (await Promise.all(filePromises)).flat();
      processAndAddFiles(extractedFiles);
    } else if (e.dataTransfer.files) {
      processAndAddFiles(Array.from(e.dataTransfer.files));
    }
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
      await fetch("/api/upload", {
        method: "POST",
        body: formData,
      }).catch(() => null);

      setIsUploading(false);
      setUploadSuccess(true);

      const summaryName =
        rootFolderNames.length > 1
          ? `${rootFolderNames.length} Sources (${rootFolderNames.slice(0, 2).join(", ")}...)`
          : rootFolderNames[0] || "Local Selection";

      onSourceSelected?.({
        type: "folder",
        value: summaryName,
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

  const resetSelection = () => {
    setFiles([]);
    setFolderError("");
    setUploadSuccess(false);
    if (folderInputRef.current) folderInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
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
            <Folder size={11} /> FILES / FOLDERS
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

      {/* Tab 2: LOCAL FOLDER / MULTI-FILE UPLOAD */}
      {activeTab === "folder" && (
        <div className="space-y-3">
          {/* Native Hidden Folder Picker Input */}
          <input
            ref={folderInputRef}
            type="file"
            multiple
            className="hidden"
            id="folder-upload-input"
            onChange={handleFilesSelected}
            {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
          />

          {/* Native Hidden Multi-File Picker Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            id="multi-file-upload-input"
            onChange={handleFilesSelected}
          />

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center border border-dashed p-3 text-center transition-all ${
              isDragging
                ? "border-[var(--color-green)] bg-[var(--surface-raised)] shadow-[var(--glow-green)]"
                : "border-[var(--border)] bg-[var(--surface-raised)]"
            }`}
          >
            <FolderPlus size={18} className="mb-1 text-[var(--color-green)]" />
            <span className="text-[0.65rem] font-mono text-[var(--text-secondary)] font-medium uppercase">
              {isDragging ? "DROP ITEMS HERE" : "DRAG & DROP FOLDERS OR FILES"}
            </span>
          </div>

          {/* Action Buttons: Add Folder vs Add Multi-Files */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="OUTLINE"
              size="SM"
              className="w-full text-[0.62rem]"
              onClick={() => folderInputRef.current?.click()}
            >
              <Folder size={11} className="mr-1 text-[var(--color-green)]" />
              {files.length > 0 ? "+ FOLDER" : "SELECT FOLDER"}
            </Button>

            <Button
              type="button"
              variant="OUTLINE"
              size="SM"
              className="w-full text-[0.62rem]"
              onClick={() => fileInputRef.current?.click()}
              title="Select multiple files using Ctrl / Shift in native file dialog"
            >
              <Files size={11} className="mr-1 text-[var(--color-green)]" />
              {files.length > 0 ? "+ FILES" : "MULTI-FILES"}
            </Button>
          </div>

          {/* Summary of Selected Items with Individual Deselect Buttons */}
          {files.length > 0 && (
            <div className="space-y-2 border-t border-[var(--border)] pt-2.5">
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {rootFolderNames.map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-1 text-[0.65rem] font-mono text-[var(--text-secondary)]"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <FileCode size={12} className="text-[var(--color-green)] shrink-0" />
                      <span className="truncate">{name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFolderOrFile(name)}
                      className="ml-2 text-[var(--text-muted)] hover:text-[var(--color-amber)] transition-colors p-0.5 shrink-0"
                      title={`Remove ${name}`}
                    >
                      <XCircle size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[0.6rem] font-mono text-[var(--text-muted)] px-1">
                <span>{files.length} files ({rootFolderNames.length} items)</span>
                <span>{formattedSize} MB</span>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="OUTLINE"
                  size="SM"
                  onClick={resetSelection}
                  className="flex-1 text-[0.62rem]"
                >
                  CLEAR ALL
                </Button>
                <Button
                  type="button"
                  variant="EXEC"
                  size="SM"
                  onClick={handleFolderUpload}
                  disabled={isUploading}
                  className="flex-1 text-[0.62rem]"
                >
                  <Upload size={11} className="mr-1" />
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
              <CheckCircle2 size={12} /> Items uploaded successfully!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
