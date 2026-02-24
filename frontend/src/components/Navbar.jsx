import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import useAsyncAction from "../utils/useAsyncAction";
import ThemeToggle from "./ui/ThemeToggle";
import ToggleButton from "./ui/ToggleButton";
import brandLogo from "../assets/billing-logo.png";

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const Navbar = ({ onMenuToggle, onSidebarCollapse, isSidebarCollapsed, onLogout, user }) => {
  const { run, loading } = useAsyncAction();
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => user || readStoredUser());
  const profileRef = useRef(null);

  const handleLogout = () => {
    if (!onLogout) return;
    run(async () => {
      await onLogout();
    });
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    setCurrentUser(user || readStoredUser());
  }, [user]);

  useEffect(() => {
    const syncUser = () => setCurrentUser(readStoredUser());
    window.addEventListener("storage", syncUser);
    window.addEventListener("user-updated", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("user-updated", syncUser);
    };
  }, []);

  const userName =
    (currentUser && currentUser.name) ||
    (typeof window !== "undefined" && window.__APP_USER && window.__APP_USER.name) ||
    "User";
  const initial = (userName && userName.charAt(0)) || "U";
  const avatarSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='100%' height='100%' rx='40' fill='%23d9e2ec'/><text x='50%' y='54%' font-size='34' fill='%231f2937' font-family='system-ui, -apple-system, Segoe UI, sans-serif' text-anchor='middle' dominant-baseline='middle'>${initial}</text></svg>`;
  const avatarSrc = (currentUser && currentUser.avatar) || `data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`;

  return (
    <nav className="sticky top-4 z-50 flex w-full items-center justify-between rounded-2xl bg-white/80 px-3 py-2 shadow-lg backdrop-blur-xl dark:bg-slate-900/70 sm:px-4 sm:py-3 lg:px-6 lg:py-3 lg:ml-6 lg:pr-12 lg:w-[calc(100%-4rem)]">
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
        <div className="lg:hidden">
          <ToggleButton onClick={onMenuToggle} ariaLabel="Open sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </ToggleButton>
        </div>
        <div className="hidden lg:block">
          <ToggleButton onClick={onSidebarCollapse} ariaLabel="Collapse sidebar" active={isSidebarCollapsed}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className={`transition-transform duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`}
              aria-hidden
            >
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </ToggleButton>
        </div>
        <Link to="/" className="group flex items-center gap-1.5 sm:gap-2 md:gap-2.5">
          <img
            src={brandLogo}
            alt="Billing Tracker logo"
            className="h-8 w-auto shrink-0 object-contain align-middle sm:h-10 md:h-12 lg:h-14"
            loading="lazy"
          />
          <span className="brand-animated-gradient text-lg font-extrabold tracking-[0.02em] drop-shadow-[0_0_10px_rgba(37,99,235,0.25)] transition-all duration-300 group-hover:drop-shadow-[0_0_14px_rgba(79,70,229,0.35)] sm:text-xl md:text-2xl lg:text-3xl">
            Billing Tracker
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <div ref={profileRef} className="relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded-2xl bg-slate-100/70 px-3 py-2 text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-200/70 hover:shadow-md dark:bg-slate-800/65 dark:text-slate-200 dark:hover:bg-slate-700/70"
            onClick={() => setOpen((s) => !s)}
            aria-expanded={open}
            aria-haspopup="true"
          >
            <span className="hidden text-sm font-medium sm:block">{userName}</span>
            <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full shadow-sm">
              <img src={avatarSrc} alt="Profile" className="h-full w-full object-cover" />
            </span>
          </button>
          {open && (
            <div className="absolute right-0 mt-3 w-44 rounded-xl bg-white/90 p-2 shadow-xl backdrop-blur-sm dark:bg-slate-800/90">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-all duration-150 hover:bg-slate-100/60 dark:text-slate-200 dark:hover:bg-slate-700/50"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition-all duration-150 hover:bg-rose-50/60 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                {loading ? "Logging out..." : "Logout"}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
