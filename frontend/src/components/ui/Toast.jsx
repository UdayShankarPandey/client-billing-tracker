import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ToastContext = createContext(null);

let idCounter = 1;

const toastIcons = {
  success: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  ),
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((toast) => {
    const id = idCounter++;
    const next = { id, createdAt: Date.now(), duration: 4200, ...toast };
    setToasts((t) => [...t, next]);
    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type || "info"}`}
            role="status"
            aria-live={t.type === "error" ? "assertive" : "polite"}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Escape') remove(t.id); }}
            onClick={() => remove(t.id)}
          >
            <div className="toast-icon">
              {toastIcons[t.type] || toastIcons.info}
            </div>
            <div className="toast-content">
              <div className="toast-title">{t.title || (t.type === "success" ? "Success" : t.type === "error" ? "Error" : t.type === "warning" ? "Warning" : "Info")}</div>
              {t.message && <div className="toast-message">{t.message}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");

  const { push, remove } = ctx;

  const show = useCallback((opts) => {
    const id = push(opts);
    const dur = opts.duration ?? 4200;
    setTimeout(() => remove(id), dur);
  }, [push, remove]);

  return { show };
};

export default ToastProvider;
