import React from "react";
import { Link, useLocation } from "react-router-dom";
import { PERMISSIONS, readStoredUser, userHasPermission } from "../utils/rbac";
import "./sidebar.css"; // 👈 IMPORTANT

const menuItems = [
  { label: "Dashboard", path: "/", icon: "dashboard", permission: PERMISSIONS.VIEW_DASHBOARD },
  { label: "Clients", path: "/clients", icon: "clients", permission: PERMISSIONS.VIEW_CLIENTS },
  { label: "Projects", path: "/projects", icon: "projects", permission: PERMISSIONS.VIEW_PROJECTS },
  { label: "Work Logs", path: "/work-logs", icon: "worklogs", permission: PERMISSIONS.VIEW_WORK_LOGS },
  { label: "Invoices", path: "/invoices", icon: "invoices", permission: PERMISSIONS.VIEW_INVOICES },
  { label: "Payments", path: "/payments", icon: "payments", permission: PERMISSIONS.VIEW_PAYMENTS },
  { label: "Expenses", path: "/expenses", icon: "expenses", permission: PERMISSIONS.VIEW_EXPENSES },
  { label: "Users", path: "/users", icon: "users", permission: PERMISSIONS.MANAGE_USERS },
];

const Sidebar = ({ isOpen, isCollapsed, onClose }) => {
  const location = useLocation();
  const user = readStoredUser();
  const visibleItems = menuItems.filter((item) =>
    userHasPermission(item.permission, user)
  );

  const renderIcon = (name) => {
    const common = {
      width: 20,
      height: 20,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
    };

    switch (name) {
      case "dashboard":
        return (
          <svg {...common} aria-hidden>
            <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        );
      case "clients":
        return (
          <svg {...common} aria-hidden>
            <path d="M9 11c2.209 0 4-1.791 4-4s-1.791-4-4-4-4 1.791-4 4 1.791 4 4 4z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M17 13c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 20c0-2.761 2.239-5 5-5h8c2.761 0 5 2.239 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 19c1.105 0 2 .895 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case "projects":
        return (
          <svg {...common} aria-hidden>
            <path d="M3 7h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M5 21V7h14v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case "worklogs":
        return (
          <svg {...common} aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case "invoices":
        return (
          <svg {...common} aria-hidden>
            <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 14h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M7 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case "payments":
        return (
          <svg {...common} aria-hidden>
            <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        );
      case "expenses":
        return (
          <svg {...common} aria-hidden>
            <path d="M3 8h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M7 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case "users":
        return (
          <svg {...common} aria-hidden>
            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 20c0-3.314 2.686-6 6-6h8c3.314 0 6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`sidebar fixed left-16 top-4 z-40 flex h-[calc(100vh-4rem)] flex-col transition-all duration-300 ease-out
          ${isCollapsed ? "w-18" : "w-64"}
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        aria-label="Main navigation"
      >
        <nav className="mt-20 flex flex-1 flex-col gap-1.5 px-3 pb-6 lg:mt-4">
          {visibleItems.map((item) => {
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                data-tour={item.icon}
                className={`nav-item flex h-11 items-center rounded-xl px-3 text-sm font-medium transition-all
                  ${isCollapsed ? "justify-center" : "gap-3"}
                  ${active ? "nav-active" : ""}`}
              >
                <span className="shrink-0">{renderIcon(item.icon)}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-4 pb-4 text-xs text-blue-600 dark:text-blue-400">
          Built by{" "}
          <a
            href="https://github.com/UdayShankarPandey"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-700 dark:text-blue-300 hover:underline"
          >
            Uday Shankar Pandey
          </a>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
