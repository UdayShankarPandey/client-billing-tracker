import React from "react";

const DefaultIcon = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="10" r="3.2" stroke="#9aa4b2" strokeWidth="1.2" fill="none" />
    <path d="M4 20c1.5-4 6-6 8-6s6.5 2 8 6" stroke="#c3cbd6" strokeWidth="1.2" fill="none" />
  </svg>
);

const EmptyState = ({ title = "No items", description = "Nothing to show here.", actionLabel, onAction, icon }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-inner">
        <div className="empty-icon">{icon || <DefaultIcon />}</div>
        <h3 className="empty-title">{title}</h3>
        <p className="empty-description">{description}</p>
        {actionLabel && (
          <button className="btn-primary" onClick={onAction} style={{ marginTop: 12 }}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
