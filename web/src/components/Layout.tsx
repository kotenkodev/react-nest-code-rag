import Logo from "./Logo";
import { Button } from "./ui/button/button";
import { ThemeToggle } from "./ThemeToggle";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/store";
import { Outlet, useNavigate } from "react-router-dom";

export default function Layout() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearUser();
    navigate("/login");
  };

  return (
    <div className="flex h-screen max-h-screen flex-col overflow-hidden bg-[var(--background)]">
      <header className="flex h-14 sm:h-16 shrink-0 items-center border-b border-[var(--border)] bg-[var(--surface)] px-3 sm:px-5 z-10">
        <Logo />
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {user?.email && (
            <span className="hidden text-[0.8rem] text-[var(--text-muted)] sm:inline-block max-w-[160px] md:max-w-[240px] truncate font-mono">
              {user.email}
            </span>
          )}
          <Button
            variant="GHOST"
            size="SM"
            onClick={handleLogout}
            aria-label="Log out"
            className="p-1.5 sm:px-2.5"
          >
            <LogOut size={13} className="shrink-0" />
            <span className="hidden xs:inline text-[0.62rem]">LOGOUT</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}
