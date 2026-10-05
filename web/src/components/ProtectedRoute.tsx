import { useAuthStore } from "@/store/store";
import { Navigate, Outlet } from "react-router-dom";
import { Terminal } from "lucide-react";
import { Badge } from "./ui/badge/badge";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--background)] p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center justify-center size-12 border border-[var(--color-green)] bg-[var(--surface)] text-[var(--color-green)] shadow-[var(--glow-green)]">
            <Terminal size={24} className="animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="SCANNING" className="text-[0.6rem] font-mono">
                INITIALIZING
              </Badge>
            </div>
            <p className="font-mono text-xs text-[var(--text-muted)] tracking-wider">
              AUTHENTICATING SESSION...
            </p>
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
