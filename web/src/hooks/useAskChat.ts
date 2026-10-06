import { useAuthStore } from "@/store/store";
import { useMutation } from "@tanstack/react-query";

interface AskChatParams {
  query: string;
  onChunk?: (chunk: string) => void;
  onSources?: (sources: string[]) => void;
}

const baseUrl = import.meta.env.VITE_API_URL;

export const useAskChat = () => {
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ query, onChunk, onSources }: AskChatParams) => {
      const response = await fetch(`${baseUrl}/api/rag/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user?.email || "",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.type === "sources" && Array.isArray(data.sources)) {
              onSources?.(data.sources);
            } else if (data.type === "delta" && data.text) {
              fullText += data.text;
              onChunk?.(data.text);
            }
          } catch {
            // Ignore non-JSON SSE lines
          }
        }
      }

      return fullText;
    },
  });
};
