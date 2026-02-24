import React from "react";
import { useTheme } from "../../context/ThemeContext";
import ToggleButton from "./ToggleButton";
import { useToast } from "./Toast";

const ThemeToggle = () => {
  const { theme, toggleDark } = useTheme();
  const { show } = useToast();
  const isDark = theme.mode === "dark";

  const handleToggle = () => {
    toggleDark();
    show({
      type: "info",
      message: isDark ? "Theme changed to light mode" : "Theme changed to dark mode",
      duration: 2200,
    });
  };

  return (
    <ToggleButton onClick={handleToggle} ariaLabel="Toggle theme" active={isDark}>
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )}
    </ToggleButton>
  );
};

export default ThemeToggle;
