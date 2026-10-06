import * as React from "react";
import { useTheme, type ThemeType } from "@/hooks/useTheme";
import { Button } from "./ui/button/button";
import { Typography } from "./ui/typography/typography";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showDropdown?: boolean;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme, cycleTheme, options, currentThemeOption } =
    useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={cn("relative inline-block text-left", className)}
      ref={dropdownRef}
    >
      <Button
        variant="OUTLINE"
        size="SM"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-7 px-2 sm:px-2.5 text-[0.62rem] gap-1.5 border-(--border) hover:border-(--border-active)"
        aria-label="Toggle Sci-Fi Theme"
      >
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{
            backgroundColor: currentThemeOption.color,
            boxShadow: `0 0 6px ${currentThemeOption.color}`,
          }}
        />
        <Palette size={12} className="text-(--text-muted)" />
        <span className="hidden sm:inline tracking-widest text-(--text-secondary) font-mono">
          {currentThemeOption.label}
        </span>
      </Button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-44 z-50 bg-(--surface-raised) border border-(--border) shadow-xl p-1 font-mono"
          style={{
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.6)",
          }}
        >
          <div className="px-2 py-1 border-b border-(--border) mb-1 flex items-center justify-between">
            <Typography
              variant="CAPTION"
              className="text-[0.6rem] font-bold tracking-widest"
            >
              SYSTEM THEME
            </Typography>
            <button
              onClick={cycleTheme}
              className="text-[0.55rem] text-(--text-primary) hover:underline tracking-wider uppercase cursor-pointer"
            >
              NEXT ›
            </button>
          </div>

          <div className="flex flex-col gap-0.5">
            {options.map((opt) => {
              const isActive = opt.id === theme;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id as ThemeType);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between w-full px-2 py-1.5 text-left text-[0.68rem] transition-colors cursor-pointer",
                    isActive
                      ? "bg-(--surface) text-(--text-primary) border-l-2 border-green"
                      : "text-(--text-secondary) hover:bg-(--surface) hover:text-(--text-primary)",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 inline-block rounded-none shrink-0"
                      style={{
                        backgroundColor: opt.color,
                        boxShadow: isActive ? `0 0 6px ${opt.color}` : "none",
                      }}
                    />
                    <span className="font-mono tracking-wider">
                      {opt.label}
                    </span>
                  </div>
                  {isActive && (
                    <Check
                      size={12}
                      className="text-(--text-primary) shrink-0"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeToggle;
