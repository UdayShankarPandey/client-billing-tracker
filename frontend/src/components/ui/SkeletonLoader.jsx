import React from "react";
import "./SkeletonLoader.css";

const SkeletonBlock = ({ style, className = "" }) => (
  <div
    className={`skeleton-block ${className}`}
    style={{
      background: "linear-gradient(90deg, #e9e9e9 25%, #f5f5f5 50%, #e9e9e9 75%)",
      backgroundSize: "200% 100%",
      animation: "skeleton-anim 1.2s ease-in-out infinite",
      borderRadius: 6,
      height: 20,
      ...style,
    }}
  />
);

const SkeletonLoader = ({ lines = 3, style, compact = false, variant = "text" }) => {
  const items = Array.from({ length: lines });

  if (variant === "table") {
    return (
      <div className="skeleton-table" style={style}>
        {items.map((_, i) => (
          <div key={i} className="skeleton-table-row">
            <SkeletonBlock style={{ width: "8%", height: 16 }} />
            <SkeletonBlock style={{ width: "15%", height: 16 }} />
            <SkeletonBlock style={{ width: "20%", height: 16 }} />
            <SkeletonBlock style={{ width: "20%", height: 16 }} />
            <SkeletonBlock style={{ width: "15%", height: 16 }} />
            <SkeletonBlock style={{ width: "12%", height: 16 }} />
            <SkeletonBlock style={{ width: "10%", height: 16 }} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="skeleton-card" style={style}>
        <SkeletonBlock style={{ height: 200, marginBottom: 16, borderRadius: 8 }} />
        <SkeletonBlock style={{ width: "80%", marginBottom: 12 }} />
        <SkeletonBlock style={{ width: "90%", marginBottom: 12 }} />
        <SkeletonBlock style={{ width: "60%" }} />
      </div>
    );
  }

  return (
    <div className={`skeleton-loader ${compact ? "compact" : ""}`} style={style}>
      {items.map((_, i) => (
        <SkeletonBlock
          key={i}
          style={{ height: compact ? 14 : 18, marginBottom: i === items.length - 1 ? 0 : 10 }}
        />
      ))}
    </div>
  );
};

export default SkeletonLoader;
