import { FileCode2, Sparkles, User } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "./ui/badge/badge";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "./ui/panel/panel";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/message.type";

interface ChatMessageProps {
  message: ChatMessage;
  className?: string;
}

export default function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.isUser;

  return (
    <Panel
      notch="sm"
      className={cn(
        "mb-4 transition-all duration-200",
        isUser
          ? "border-(--border) bg-(--surface)/70 border-l-[3px] border-l-(--text-muted)"
          : "border-(--border) bg-(--surface) border-l-[3px] border-l-(--accent-primary) shadow-(--glow-green)",
        className,
      )}
    >
      <PanelHeader
        className={cn(
          "px-3 sm:px-4 py-2 flex items-center justify-between",
          isUser ? "bg-(--surface-raised)/60" : "bg-(--surface-raised)",
        )}
      >
        <div className="flex items-center gap-2">
          {isUser ? (
            <div className="flex items-center justify-center w-5 h-5 rounded-none bg-(--surface) border border-(--border) text-(--text-muted)">
              <User size={12} />
            </div>
          ) : (
            <div className="flex items-center justify-center w-5 h-5 rounded-none bg-green/10 border border-green text-(--text-primary)">
              <Sparkles size={12} />
            </div>
          )}

          <PanelTitle
            className={cn(
              "text-[0.68rem] sm:text-xs font-mono tracking-wider",
              isUser ? "text-(--text-secondary)" : "text-(--text-primary)",
            )}
          >
            {isUser ? "USER QUERY" : "RAG RESPONSE"}
          </PanelTitle>
        </div>

        {isUser ? (
          <Badge variant="OFFLINE" className="text-[0.58rem] font-mono">
            PROMPT
          </Badge>
        ) : message.isError ? (
          <Badge variant="WARNING" className="text-[0.58rem] font-mono">
            ERROR
          </Badge>
        ) : (
          <Badge variant="ACTIVE" className="text-[0.58rem] font-mono">
            GENERATED
          </Badge>
        )}
      </PanelHeader>

      <PanelContent className="space-y-3.5 p-3 sm:p-4 text-[0.75rem] sm:text-xs leading-relaxed overflow-hidden">
        {isUser ? (
          <p className="text-(--text-secondary) whitespace-pre-wrap font-sans font-normal">
            {message.text}
          </p>
        ) : (
          <div className="text-(--text-secondary) space-y-2 prose-sm max-w-none">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="text-(--text-secondary) leading-relaxed mb-2.5 last:mb-0">
                    {children}
                  </p>
                ),
                h1: ({ children }) => (
                  <h1 className="text-sm font-bold font-mono text-(--text-primary) mt-3 mb-1.5 pb-1 border-b border-(--border)">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xs font-bold font-mono text-(--text-primary) mt-3 mb-1.5">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xs font-semibold font-mono text-(--text-secondary) mt-2.5 mb-1">
                    {children}
                  </h3>
                ),
                table: ({ children }) => (
                  <div className="my-3 w-full overflow-x-auto border border-(--border)">
                    <table className="w-full text-left text-[0.7rem] font-mono border-collapse">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-(--surface-raised) text-(--text-primary) border-b border-(--border)">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-(--border)">{children}</tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-(--surface-raised)/40 transition-colors">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="px-2.5 py-1.5 font-bold uppercase tracking-wider text-[0.65rem] border-r border-(--border) last:border-r-0">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-2.5 py-1.5 text-(--text-secondary) border-r border-(--border) last:border-r-0 align-top">
                    {children}
                  </td>
                ),
                code: ({ className, children, ...props }) => {
                  const isInline =
                    !className &&
                    typeof children === "string" &&
                    !children.includes("\n");
                  return isInline ? (
                    <code
                      className="px-1.5 py-0.5 font-mono text-[0.72rem] bg-(--surface-raised) text-(--text-primary) border border-(--border)"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <pre className="p-3 my-2 overflow-x-auto font-mono text-[0.72rem] bg-(--surface-raised) text-(--text-primary) border border-(--border)">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
                ul: ({ children }) => (
                  <ul className="list-disc pl-4 space-y-1 my-2 text-(--text-secondary)">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-4 space-y-1 my-2 text-(--text-secondary)">
                    {children}
                  </ol>
                ),
              }}
            >
              {message.text}
            </Markdown>
          </div>
        )}

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="pt-2.5 border-t border-(--border)">
            <div className="flex items-center gap-1.5 text-[0.6rem] font-mono text-(--text-muted) uppercase tracking-wider mb-2">
              <FileCode2 size={11} className="text-(--text-primary)" />
              <span>Referenced Sources</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {message.sources?.map((source) => (
                <Badge
                  key={source}
                  variant="ACTIVE"
                  className="text-[0.6rem] font-mono hover:bg-green/10 transition-colors"
                >
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </PanelContent>
    </Panel>
  );
}
