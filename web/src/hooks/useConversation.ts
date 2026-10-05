import type { ChatMessage } from "@/types/message.type";
import { useReducer } from "react";

type ChatAction =
  | { type: "ADD_USER_MESSAGE"; text: string }
  | { type: "ADD_BOT_RESPONSE"; text: string }
  | { type: "ADD_ERROR_MESSAGE"; text: string }
  | { type: "CLEAR_MESSAGES" };

function chatReducer(state: ChatMessage[], action: ChatAction): ChatMessage[] {
  switch (action.type) {
    case "ADD_USER_MESSAGE":
      return [
        ...state,
        {
          id: crypto.randomUUID(),
          text: action.text,
          isUser: true,
        },
      ];
    case "ADD_BOT_RESPONSE":
      return [
        ...state,
        {
          id: crypto.randomUUID(),
          text: action.text,
          isUser: false,
        },
      ];
    case "ADD_ERROR_MESSAGE":
      return [
        ...state,
        {
          id: crypto.randomUUID(),
          text: action.text,
          isUser: false,
          isError: true,
        },
      ];
    case "CLEAR_MESSAGES":
      return [];
    default:
      return state;
  }
}

export function useConversation() {
  const [messages, dispatch] = useReducer(chatReducer, []);

  const addUserMessage = (text: string) =>
    dispatch({ type: "ADD_USER_MESSAGE", text });

  const addBotResponse = (text: string) =>
    dispatch({ type: "ADD_BOT_RESPONSE", text });

  const addErrorMessage = (text: string) =>
    dispatch({ type: "ADD_ERROR_MESSAGE", text });

  const clearMessages = () => dispatch({ type: "CLEAR_MESSAGES" });

  return {
    messages,
    addUserMessage,
    addBotResponse,
    addErrorMessage,
    clearMessages,
  };
}
