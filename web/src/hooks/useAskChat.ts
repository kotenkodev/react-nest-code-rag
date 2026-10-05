import { useAuthStore } from "@/store/store";
import { useMutation } from "@tanstack/react-query";

interface AskChatParams {
  query: string;
  onChunk?: (chunk: string) => void;
}

export const useAskChat = () => {
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ query, onChunk }: AskChatParams) => {
      const response = await fetch("http://localhost:3000/rag/query", {
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        onChunk?.(chunk);
      }

      return fullText;
    },
  });
};
