import { useState, useCallback } from "react";

export type ToastVariant = "STATUS" | "WARNING" | "CRITICAL" | "INFO";

export interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

let listeners: Array<(toasts: ToastItem[]) => void> = [];
let memoryToasts: ToastItem[] = [];

function notify() {
  listeners.forEach((listener) => listener(memoryToasts));
}

export function toast(item: Omit<ToastItem, "id">) {
  const newToast: ToastItem = {
    ...item,
    id: crypto.randomUUID(),
  };
  memoryToasts = [...memoryToasts, newToast];
  notify();

  setTimeout(() => {
    memoryToasts = memoryToasts.filter((t) => t.id !== newToast.id);
    notify();
  }, 4000);
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>(memoryToasts);

  const subscribe = useCallback(() => {
    const listener = (newToasts: ToastItem[]) => setToasts([...newToasts]);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return { toasts, toast, subscribe };
}
