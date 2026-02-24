import React from "react";

const ToggleButton = ({ onClick, ariaLabel, children, className = "", active = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-300
        ${active
          ? "border-slate-400/50 bg-slate-300/25 text-slate-900 dark:border-slate-500/60 dark:bg-slate-700/55 dark:text-slate-100"
          : "border-slate-300/70 bg-white/80 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700/85"}
        ${className}`}
    >
      {children}
    </button>
  );
};

export default ToggleButton;
