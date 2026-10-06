import type { ChatMessage } from "@/types/message.type";
import { useReducer } from "react";

type ChatAction =
  | { type: "ADD_USER_MESSAGE"; text: string }
  | { type: "START_BOT_MESSAGE"; id: string }
  | { type: "APPEND_BOT_CHUNK"; id: string; chunk: string }
  | { type: "SET_BOT_SOURCES"; id: string; sources: string[] }
  | { type: "SET_BOT_ERROR"; id: string; errorText: string }
  | { type: "ADD_ERROR_MESSAGE"; text: string }
  | { type: "CLEAR_MESSAGES" };

function chatReducer(state: ChatMessage[], action: ChatAction): ChatMessage[] {
  switch (action.type) {
    case "ADD_USER_MESSAGE":
      return [
        ...state,
        { id: crypto.randomUUID(), text: action.text, isUser: true },
      ];
    case "START_BOT_MESSAGE":
      return [...state, { id: action.id, text: "", isUser: false }];
    case "APPEND_BOT_CHUNK":
      return state.map((msg) =>
        msg.id === action.id ? { ...msg, text: msg.text + action.chunk } : msg,
      );
    case "SET_BOT_SOURCES":
      return state.map((msg) =>
        msg.id === action.id ? { ...msg, sources: action.sources } : msg,
      );
    case "SET_BOT_ERROR":
      return state.map((msg) =>
        msg.id === action.id
          ? { ...msg, text: action.errorText, isError: true }
          : msg,
      );
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

  const addErrorMessage = (text: string) =>
    dispatch({ type: "ADD_ERROR_MESSAGE", text });

  const setBotError = (id: string, errorText: string) =>
    dispatch({ type: "SET_BOT_ERROR", id, errorText });

  const clearMessages = () => dispatch({ type: "CLEAR_MESSAGES" });

  const startBotMessage = (id: string) =>
    dispatch({ type: "START_BOT_MESSAGE", id });
  const appendBotChunk = (id: string, chunk: string) =>
    dispatch({ type: "APPEND_BOT_CHUNK", id, chunk });
  const setBotSources = (id: string, sources: string[]) =>
    dispatch({ type: "SET_BOT_SOURCES", id, sources });

  return {
    messages,
    startBotMessage,
    appendBotChunk,
    setBotSources,
    setBotError,
    addUserMessage,
    addErrorMessage,
    clearMessages,
  };
}
