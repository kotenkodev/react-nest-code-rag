export type ChatMessage = {
  id: string;
  text: string;
  sources?: string[];
  isUser: boolean;
  isError?: boolean;
};
