import * as React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      aria-label="Toggle dark mode"
      onClick={toggleTheme}
      className="rounded-full p-2 transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-yellow-400" />
      ) : (
        <Moon className="h-5 w-5 text-primary" />
      )}
    </button>
  );
};
