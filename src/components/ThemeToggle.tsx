import * as React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      aria-label="Toggle dark mode"
      onClick={toggleTheme}
      className="relative inline-flex h-7 w-14 items-center rounded-full border border-border/50 bg-muted/40 px-1 shadow-sm transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="absolute left-0.5 flex h-5 w-5 items-center justify-center">
        <Moon className={`h-3.5 w-3.5 ${theme === "dark" ? "text-muted-foreground" : "text-primary/50"}`} />
      </span>
      <span className="absolute right-0.5 flex h-5 w-5 items-center justify-center">
        <Sun className={`h-3.5 w-3.5 ${theme === "dark" ? "text-yellow-400/60" : "text-muted-foreground/50"}`} />
      </span>
      <span
        className={`absolute h-5 w-5 rounded-full bg-background shadow-sm transition-transform ${
          theme === "dark" ? "translate-x-7" : "translate-x-0.5"
        }`}
      />
    </button>
  );
};
