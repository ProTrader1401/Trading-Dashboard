import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("trading-dashboard-theme") as Theme) || "system";
    }
    return "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const updateTheme = (newTheme: Theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("trading-dashboard-theme", newTheme);
    }
    setTheme(newTheme);
  };

  return {
    theme,
    setTheme: updateTheme,
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}