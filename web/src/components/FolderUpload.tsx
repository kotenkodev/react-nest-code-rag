import {
  useState,
  useRef,
  useMemo,
  type ChangeEvent,
  type FormEvent,
  type DragEvent,
} from "react";
import { Input } from "./ui/input/input";
import { Button } from "./ui/button/button";
import {
  Folder,
  Upload,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  ArrowRight,
  FileCode,
  Files,
  Archive,
  DownloadCloud,
} from "lucide-react";
import axios from "@/lib/axios";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB per file/zip
const MAX_BATCH_SIZE_BYTES = 100 * 1024 * 1024; // 100MB total batch

export interface FolderUploadProps {
  onSourceSelected?: (source: {
    type: "link" | "folder" | "zip";
    value: string;
    fileCount?: number;
  }) => void;
  className?: string;
}

interface GroupedItem {
  id: string;
  name: string;
  type: "folder" | "zip" | "file";
  fileCount: number;
  totalSize: number;
}

async function readEntryFiles(entry: any): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file(
        (file: File) => {
          const relativePath = entry.fullPath
            ? entry.fullPath.replace(/^\//, "")
            : file.name;
          Object.defineProperty(file, "webkitRelativePath", {
            value: relativePath,
            writable: false,
            configurable: true,
          });
          resolve([file]);
        },
        () => resolve([]),
      );
    });
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();
    const entries: any[] = await new Promise((resolve) => {
      dirReader.readEntries(
        (results: any[]) => resolve(results),
        () => resolve([]),
      );
    });
    const nestedFiles = await Promise.all(
      entries.map((child) => readEntryFiles(child)),
    );
    return nestedFiles.flat();
  }
  return [];
}

export function FolderUpload({
  onSourceSelected,
  className = "",
}: FolderUploadProps) {
  const [activeTab, setActiveTab] = useState<"link" | "folder">("link");

  // Git Repo Link state
  const [repoUrl, setRepoUrl] = useState("https://github.com/kotenkodev/");
  const [branch, setBranch] = useState("main");
  const [linkStatus, setLinkStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [linkMessage, setLinkMessage] = useState("");
  const [linkError, setLinkError] = useState("");

  // Folder, Multi-File, and Zip upload state
  const [files, setFiles] = useState<File[]>([]);
  const [folderError, setFolderError] = useState("");
  const [folderMessage, setFolderMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Compute the expected GitHub Zip download URL preview
  const previewZipUrl = useMemo(() => {
    const trimmed = repoUrl.trim();
    if (!trimmed || trimmed === "https://github.com/kotenkodev/") return "";
    if (trimmed.endsWith(".zip")) return trimmed;

    const cleaned = trimmed.replace(/\.git$/, "").replace(/\/+$/, "");
    const githubMatch = cleaned.match(
      /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)/,
    );
    if (githubMatch) {
      const [, owner, repo] = githubMatch;
      return `https://github.com/${owner}/${repo}/archive/refs/heads/${branch || "main"}.zip`;
    }

    const shorthandMatch = cleaned.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
    if (shorthandMatch) {
      const [, owner, repo] = shorthandMatch;
      return `https://github.com/${owner}/${repo}/archive/refs/heads/${branch || "main"}.zip`;
    }

    return "";
  }, [repoUrl, branch]);

  const totalSizeBytes = files.reduce((acc, f) => acc + f.size, 0);
  const formattedSize = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  // Group files into high-level items (folders, zip files, individual loose files)
  const groupedItems = useMemo<GroupedItem[]>(() => {
    const map = new Map<string, GroupedItem>();

    for (const file of files) {
      const isZip = file.name.toLowerCase().endsWith(".zip");
      const relativePath = file.webkitRelativePath || file.name;
      const isFolderChild = relativePath.includes("/");

      if (isZip) {
        const key = `zip:${file.name}`;
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            name: file.name,
            type: "zip",
            fileCount: 1,
            totalSize: file.size,
          });
        } else {
          const item = map.get(key)!;
          item.totalSize += file.size;
        }
      } else if (isFolderChild) {
        const rootFolderName = relativePath.split("/")[0];
        const key = `folder:${rootFolderName}`;
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            name: rootFolderName,
            type: "folder",
            fileCount: 1,
            totalSize: file.size,
          });
        } else {
          const item = map.get(key)!;
          item.fileCount += 1;
          item.totalSize += file.size;
        }
      } else {
        const key = `file:${file.name}`;
        map.set(key, {
          id: key,
          name: file.name,
          type: "file",
          fileCount: 1,
          totalSize: file.size,
        });
      }
    }

    return Array.from(map.values());
  }, [files]);

  const processAndAddFiles = (newFiles: File[]) => {
    setFolderError("");
    setFolderMessage("");
    setUploadSuccess(false);

    if (newFiles.length === 0) return;

    const existingPaths = new Set(
      files.map((f) => f.webkitRelativePath || f.name),
    );
    const combinedFiles = [...files];

    let currentTotalSize = totalSizeBytes;

    for (const file of newFiles) {
      const pathKey = file.webkitRelativePath || file.name;
      if (existingPaths.has(pathKey)) continue;

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFolderError(`File "${file.name}" exceeds the 50MB limit.`);
        return;
      }

      currentTotalSize += file.size;
      if (currentTotalSize > MAX_BATCH_SIZE_BYTES) {
        setFolderError("Total selection exceeds 100MB batch limit.");
        return;
      }

      existingPaths.add(pathKey);
      combinedFiles.push(file);
    }

    setFiles(combinedFiles);
  };

  const removeGroupedItem = (item: GroupedItem) => {
    setFiles((prevFiles) =>
      prevFiles.filter((file) => {
        if (item.type === "zip") {
          return file.name !== item.name;
        }
        if (item.type === "folder") {
          const rootName = file.webkitRelativePath?.split("/")[0];
          return rootName !== item.name;
        }
        return file.name !== item.name;
      }),
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
    setFolderMessage("");

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file, file.webkitRelativePath || file.name);
    });

    try {
      const response = await axios.post("/api/repositories/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setIsUploading(false);
      setUploadSuccess(true);
      const isZip = files.some((f) => f.name.toLowerCase().endsWith(".zip"));
      const serverMsg = response.data?.message || "Uploaded successfully!";
      setFolderMessage(serverMsg);

      const summaryName =
        groupedItems.length > 1
          ? `${groupedItems.length} Sources (${groupedItems.slice(0, 2).map((i) => i.name).join(", ")}...)`
          : groupedItems[0]?.name || "Local Selection";

      onSourceSelected?.({
        type: isZip ? "zip" : "folder",
        value: summaryName,
        fileCount: response.data?.fileCount || files.length,
      });
    } catch (err: any) {
      setIsUploading(false);
      const errDetail =
        err.response?.data?.message ||
        "Upload failed. Please verify the server connection.";
      setFolderError(
        typeof errDetail === "string" ? errDetail : JSON.stringify(errDetail),
      );
    }
  };

  const handleLinkSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      setLinkError("Please enter a valid GitHub repository URL.");
      return;
    }

    setLinkError("");
    setLinkMessage("");
    setLinkStatus("loading");

    try {
      const response = await axios.post("/api/repositories/upload", {
        link: repoUrl.trim(),
        branch: branch.trim() || "main",
      });

      setLinkStatus("success");
      setLinkMessage(
        response.data?.message ||
          `Downloaded and indexed ${response.data?.fileCount || 0} files.`,
      );

      const repoTitle = repoUrl.trim().replace(/^https?:\/\/(www\.)?github\.com\//, "");
      onSourceSelected?.({
        type: "link",
        value: `${repoTitle} (${branch.trim() || "main"})`,
        fileCount: response.data?.fileCount,
      });
    } catch (err: any) {
      setLinkStatus("error");
      const errDetail =
        err.response?.data?.message ||
        "Failed to download repository ZIP archive from GitHub.";
      setLinkError(
        typeof errDetail === "string" ? errDetail : JSON.stringify(errDetail),
      );
    }
  };

  const resetSelection = () => {
    setFiles([]);
    setFolderError("");
    setFolderMessage("");
    setUploadSuccess(false);
    if (folderInputRef.current) folderInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (zipInputRef.current) zipInputRef.current.value = "";
  };

  return (
    <div
      className={`border border-[var(--border)] bg-[var(--surface)] p-3 ${className}`}
    >
      {/* Mode Toggle Header */}
      <div className="mb-3 border-b border-[var(--border)] pb-2">
        <div className="mb-2 text-[0.6rem] font-mono tracking-[0.16em] text-[var(--text-muted)] uppercase">
          INGESTION SOURCE
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={`flex items-center justify-center gap-1.5 py-1 text-[0.62rem] font-mono transition-all ${
              activeTab === "link"
                ? "bg-[var(--surface-raised)] text-[var(--color-green)] border border-[var(--border-active)] font-medium"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border)] bg-transparent"
            }`}
          >
            <DownloadCloud size={11} /> REPO ZIP LINK
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("folder")}
            className={`flex items-center justify-center gap-1.5 py-1 text-[0.62rem] font-mono transition-all ${
              activeTab === "folder"
                ? "bg-[var(--surface-raised)] text-[var(--color-green)] border border-[var(--border-active)] font-medium"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border)] bg-transparent"
            }`}
          >
            <Folder size={11} /> FOLDER / ZIP
          </button>
        </div>
      </div>

      {/* Tab 1: GIT REPOSITORY ZIP DOWNLOAD */}
      {activeTab === "link" && (
        <form onSubmit={handleLinkSubmit} className="space-y-3">
          <div>
            <Input
              label="GitHub Repository"
              placeholder="https://github.com/kotenkodev/reponame"
              value={repoUrl}
              onChange={(e) => {
                setRepoUrl(e.target.value);
                setLinkError("");
                setLinkStatus("idle");
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Branch"
              value={branch}
              onChange={(e) => {
                setBranch(e.target.value);
                setLinkError("");
                setLinkStatus("idle");
              }}
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
                {linkStatus === "loading" ? "DOWNLOADING..." : "DOWNLOAD & INDEX"}
                <ArrowRight size={12} className="ml-1" />
              </Button>
            </div>
          </div>

          {previewZipUrl && (
            <div className="border border-[var(--border)] bg-[var(--surface-raised)] p-2 text-[0.58rem] font-mono text-[var(--text-muted)] leading-relaxed break-all">
              <div className="text-[var(--color-green)] mb-0.5 flex items-center gap-1">
                <Archive size={10} /> Zip Download URL:
              </div>
              <span className="text-[var(--text-secondary)]">{previewZipUrl}</span>
            </div>
          )}

          {linkError && (
            <div className="flex items-start gap-1.5 text-[0.62rem] text-[var(--color-amber)] font-mono">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              <span>{linkError}</span>
            </div>
          )}

          {linkStatus === "success" && (
            <div className="flex items-start gap-1.5 text-[0.62rem] text-[var(--color-green)] font-mono">
              <CheckCircle2 size={12} className="shrink-0 mt-0.5" />
              <span>{linkMessage || "Repository downloaded & extracted successfully."}</span>
            </div>
          )}
        </form>
      )}

      {/* Tab 2: LOCAL FOLDER / ZIP / MULTI-FILE UPLOAD */}
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
            {...({ webkitdirectory: "", directory: "" } as Record<
              string,
              string
            >)}
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

          {/* Native Hidden Zip File Picker Input */}
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            multiple
            className="hidden"
            id="zip-upload-input"
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
            <span className="text-[0.62rem] font-mono text-[var(--text-secondary)] font-medium uppercase">
              {isDragging ? "DROP ITEMS HERE" : "DRAG & DROP FOLDER, ZIP, OR FILES"}
            </span>
          </div>

          {/* Action Buttons: Add Folder, Add Zip, Add Files */}
          <div className="grid grid-cols-3 gap-1">
            <Button
              type="button"
              variant="OUTLINE"
              size="SM"
              className="w-full px-1 text-[0.54rem] tracking-tight"
              onClick={() => folderInputRef.current?.click()}
              title="Select a directory with files"
            >
              <Folder
                size={10}
                className="mr-1 shrink-0 text-[var(--color-green)]"
              />
              <span className="truncate">+ FOLDER</span>
            </Button>

            <Button
              type="button"
              variant="OUTLINE"
              size="SM"
              className="w-full px-1 text-[0.54rem] tracking-tight"
              onClick={() => zipInputRef.current?.click()}
              title="Select a .zip archive"
            >
              <Archive
                size={10}
                className="mr-1 shrink-0 text-[var(--color-green)]"
              />
              <span className="truncate">+ ZIP</span>
            </Button>

            <Button
              type="button"
              variant="OUTLINE"
              size="SM"
              className="w-full px-1 text-[0.54rem] tracking-tight"
              onClick={() => fileInputRef.current?.click()}
              title="Select multiple code files"
            >
              <Files
                size={10}
                className="mr-1 shrink-0 text-[var(--color-green)]"
              />
              <span className="truncate">+ FILES</span>
            </Button>
          </div>

          {/* Summary of Selected Items with Individual Deselect Buttons */}
          {files.length > 0 && (
            <div className="space-y-2 border-t border-[var(--border)] pt-2.5">
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {groupedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-1 text-[0.62rem] font-mono text-[var(--text-secondary)]"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {item.type === "zip" ? (
                        <Archive
                          size={12}
                          className="text-[var(--color-green)] shrink-0"
                        />
                      ) : item.type === "folder" ? (
                        <Folder
                          size={12}
                          className="text-[var(--color-green)] shrink-0"
                        />
                      ) : (
                        <FileCode
                          size={12}
                          className="text-[var(--color-green)] shrink-0"
                        />
                      )}
                      <span className="truncate font-medium">{item.name}</span>
                      <span className="text-[0.55rem] text-[var(--text-muted)] shrink-0">
                        {item.type === "folder"
                          ? `(${item.fileCount} files)`
                          : `(${(item.totalSize / 1024).toFixed(1)} KB)`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGroupedItem(item)}
                      className="ml-2 text-[var(--text-muted)] hover:text-[var(--color-amber)] transition-colors p-0.5 shrink-0"
                      title={`Remove ${item.name}`}
                    >
                      <XCircle size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[0.6rem] font-mono text-[var(--text-muted)] px-1">
                <span>
                  {files.length} total files ({groupedItems.length} items)
                </span>
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
                  {isUploading ? "UPLOADING..." : "UPLOAD & INDEX"}
                </Button>
              </div>
            </div>
          )}

          {folderError && (
            <div className="flex items-start gap-1.5 text-[0.62rem] text-[var(--color-amber)] font-mono">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              <span>{folderError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="flex items-start gap-1.5 text-[0.62rem] text-[var(--color-green)] font-mono">
              <CheckCircle2 size={12} className="shrink-0 mt-0.5" />
              <span>{folderMessage || "Items uploaded and indexed successfully!"}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
