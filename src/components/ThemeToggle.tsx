import * as React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      aria-label="Toggle dark mode"
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-16 items-center rounded-full border border-border bg-muted/60 px-1 shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="absolute left-1 flex h-6 w-6 items-center justify-center">
        <Moon className={`h-4 w-4 ${theme === "dark" ? "text-muted-foreground" : "text-primary"}`} />
      </span>
      <span className="absolute right-1 flex h-6 w-6 items-center justify-center">
        <Sun className={`h-4 w-4 ${theme === "dark" ? "text-yellow-400" : "text-muted-foreground"}`} />
      </span>
      <span
        className={`absolute h-6 w-6 rounded-full bg-background shadow transition-transform ${
          theme === "dark" ? "translate-x-8" : "translate-x-1"
        }`}
      />
    </button>
  );
};
