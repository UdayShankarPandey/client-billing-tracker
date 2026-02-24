import React, { useState, useEffect } from "react";
import Confetti from "./Confetti";
import "./WelcomeBackModal.css";

const WelcomeBackModal = ({ user, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [greeting, setGreeting] = useState("");

  // Get time-based greeting
  useEffect(() => {
    const hour = new Date().getHours();
    let greetingText = "Welcome back";
    
    if (hour >= 5 && hour < 12) {
      greetingText = "Good morning";
    } else if (hour >= 12 && hour < 17) {
      greetingText = "Good afternoon";
    } else if (hour >= 17 && hour < 21) {
      greetingText = "Good evening";
    } else {
      greetingText = "Good night";
    }
    
    setGreeting(greetingText);
  }, []);

  useEffect(() => {
    // Small delay to trigger animation
    const timer = setTimeout(() => setShowContent(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-close after 3.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for fade out animation
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  const userName = user?.name || user?.email?.split("@")[0] || "User";
  const userAvatar = user?.avatar || user?.profilePicture;
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <Confetti active={showContent} duration={3000} />
      <div className={`welcome-modal-overlay ${showContent ? "show" : ""}`} />
      <div className={`welcome-modal ${showContent ? "show" : ""}`}>
        {/* Animated background gradient */}
        <div className="welcome-modal-gradient"></div>

        {/* Animated stars/sparkles */}
        <div className="welcome-sparkle welcome-sparkle-1"></div>
        <div className="welcome-sparkle welcome-sparkle-2"></div>
        <div className="welcome-sparkle welcome-sparkle-3"></div>
        <div className="welcome-sparkle welcome-sparkle-4"></div>

        {/* Content */}
        <div className="welcome-modal-content">
          {/* User Avatar */}
          <div className="welcome-avatar-wrapper">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="welcome-avatar-image" />
            ) : (
              <div className="welcome-avatar-initials">{initials}</div>
            )}
          </div>

          <div className="welcome-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>

          <h1 className="welcome-modal-title">{greeting}!</h1>
          <p className="welcome-modal-subtitle">
            Welcome back, <span className="welcome-user-name">{userName}</span>
          </p>

          <div className="welcome-modal-message">
            <p>You're all set to continue</p>
          </div>

          {/* Progress indicator */}
          <div className="welcome-progress-bar">
            <div className="welcome-progress-fill"></div>
          </div>
        </div>

        {/* Close button */}
        <button
          className="welcome-modal-close"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onComplete, 300);
          }}
          aria-label="Close welcome modal"
          title="Close"
        >
          ✕
        </button>
      </div>
    </>
  );
};

export default WelcomeBackModal;
