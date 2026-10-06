import { useAuthStore } from "@/store/store";
import { Navigate, Outlet } from "react-router-dom";
import { Terminal } from "lucide-react";
import { Badge } from "./ui/badge/badge";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-(--background) p-6 select-none">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm w-full border border-(--border) bg-(--surface) p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
          <div className="flex items-center justify-center size-20 sm:size-24 border-2 border-green bg-(--surface-raised) text-(--text-primary) shadow-(--glow-green)">
            <Terminal size={42} className="animate-pulse stroke-[2.5]" />
          </div>

          <div className="space-y-3 w-full">
            <div className="flex items-center justify-center gap-2">
              <Badge
                variant="SCANNING"
                className="text-xs sm:text-sm px-3 py-1 font-mono tracking-widest"
              >
                INITIALIZING
              </Badge>
            </div>

            <h2 className="font-mono text-base sm:text-lg font-bold tracking-[0.2em] text-(--text-secondary)">
              CODE RAG
            </h2>

            <p className="font-mono text-xs text-(--text-muted) tracking-wider">
              AUTHENTICATING SESSION...
            </p>

            <div className="mt-4 h-1 w-full bg-(--surface-raised) border border-(--border) overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 w-1/3 bg-green shadow-(--glow-green) animate-[pulse_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
