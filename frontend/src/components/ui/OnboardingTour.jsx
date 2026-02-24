import React, { useState, useEffect, useRef, useMemo } from "react";
import "./OnboardingTour.css";

const OnboardingTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, position: "bottom" });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const tooltipRef = useRef(null);

  // Detect mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Memoize steps array to only recreate when isMobile changes
  const steps = useMemo(() => [
    {
      title: "Welcome to Billing Tracker",
      description: isMobile 
        ? "Manage your clients, projects, and invoices all in one place. You can access everything from the menu."
        : "Manage your clients, projects, and invoices all in one place. Let's take a quick tour!",
      target: isMobile ? "[data-tour='dashboard']" : ".app-sidebar",
      position: "bottom",
    },
    {
      title: "Dashboard",
      description: "Get a quick overview of your business metrics, recent invoices, and pending payments.",
      target: "[data-tour='dashboard']",
      position: "bottom",
    },
    {
      title: "Clients",
      description: "Manage all your clients and their information in one centralized location.",
      target: "[data-tour='clients']",
      position: "bottom",
    },
    {
      title: "Projects",
      description: "Track projects you're working on with your clients.",
      target: "[data-tour='projects']",
      position: "bottom",
    },
    {
      title: "Work Logs",
      description: "Track time spent on projects and automatically generate billing records.",
      target: "[data-tour='worklogs']",
      position: "bottom",
    },
    {
      title: "Invoices",
      description: "Create, send, and track invoices. Monitor payment status in real-time.",
      target: "[data-tour='invoices']",
      position: "bottom",
    },
    {
      title: "Payments",
      description: "Record and track payments from your clients. Keep your cash flow organized.",
      target: "[data-tour='payments']",
      position: "bottom",
    },
    {
      title: "You're all set!",
      description: "You're ready to use Billing Tracker. Dismiss this tour anytime by clicking outside or pressing Escape.",
      target: null,
      position: "center",
    },
  ], [isMobile]);

  const step = steps[currentStep];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleComplete();
      } else if (e.key === "ArrowRight" && currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else if (e.key === "ArrowLeft" && currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep]);

  // Calculate and track tooltip position
  useEffect(() => {
    const calculateTooltipPosition = () => {
      const targetElement = step.target ? document.querySelector(step.target) : null;
      
      if (!targetElement) {
        setTooltipPos({ top: "50%", left: "50%", position: "center" });
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Check if element is actually visible on screen
      const isElementVisible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < viewportHeight && rect.right > 0 && rect.left < viewportWidth;
      
      // If element is not visible (e.g., sidebar collapsed), show centered tooltip instead
      if (!isElementVisible) {
        setTooltipPos({ top: "50%", left: "50%", position: "center" });
        return;
      }

      // Make tooltip width responsive based on viewport size
      const tooltipWidth = viewportWidth < 480 ? Math.min(280, viewportWidth - 32) : 360;
      const tooltipHeight = viewportWidth < 480 ? 180 : 200;
      const gap = viewportWidth < 480 ? 12 : 24;

      let top = 0;
      let left = 0;
      let position = step.position || "bottom";

      const positions = [
        position,
        ...(position !== "right" ? ["right"] : []),
        ...(position !== "left" ? ["left"] : []),
        ...(position !== "bottom" ? ["bottom"] : []),
        ...(position !== "top" ? ["top"] : []),
      ];

      let positioned = false;

      for (const pos of positions) {
        if (pos === "right") {
          // Skip right positioning on very small mobile screens
          if (viewportWidth < 480) continue;
          if (rect.right + gap + tooltipWidth < viewportWidth) {
            left = rect.right + gap;
            top = rect.top + Math.max(8, Math.min(rect.height / 2 - tooltipHeight / 2, viewportHeight - tooltipHeight - 8));
            position = "right";
            positioned = true;
            break;
          }
        } else if (pos === "left") {
          // Skip left positioning on very small mobile screens
          if (viewportWidth < 480) continue;
          if (rect.left - gap - tooltipWidth > 0) {
            left = rect.left - gap - tooltipWidth;
            top = rect.top + Math.max(8, Math.min(rect.height / 2 - tooltipHeight / 2, viewportHeight - tooltipHeight - 8));
            position = "left";
            positioned = true;
            break;
          }
        } else if (pos === "bottom") {
          if (rect.bottom + gap + tooltipHeight < viewportHeight) {
            top = rect.bottom + gap;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            position = "bottom";
            positioned = true;
            break;
          }
        } else if (pos === "top") {
          if (rect.top - gap - tooltipHeight > 0) {
            top = rect.top - gap - tooltipHeight;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            position = "top";
            positioned = true;
            break;
          }
        }
      }

      if (!positioned) {
        top = viewportHeight / 2 - tooltipHeight / 2;
        left = viewportWidth / 2 - tooltipWidth / 2;
        position = "center";
      }

      // Mobile-specific constraints for left positioning
      const minLeft = viewportWidth < 480 ? 16 : 320; // 16px padding on mobile, sidebar clearance on desktop
      left = Math.max(minLeft, Math.min(left, viewportWidth - tooltipWidth - 16));
      top = Math.max(8, Math.min(top, viewportHeight - tooltipHeight - 8));

      setTooltipPos({ top, left, position });
    };

    // Call immediately when step changes
    calculateTooltipPosition();

    // Add listeners for scroll, resize, and visibility changes
    window.addEventListener("scroll", calculateTooltipPosition, { passive: true });
    window.addEventListener("resize", calculateTooltipPosition, { passive: true });
    
    // Watch for layout changes (sidebar toggle, etc.)
    const observer = new MutationObserver(calculateTooltipPosition);
    observer.observe(document.body, { 
      attributes: true, 
      subtree: true, 
      attributeFilter: ['class', 'style'] 
    });
    
    return () => {
      window.removeEventListener("scroll", calculateTooltipPosition);
      window.removeEventListener("resize", calculateTooltipPosition);
      observer.disconnect();
    };
  }, [currentStep, steps]);


  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onComplete) onComplete();
      // Save that tour has been completed
      localStorage.setItem("tour-completed", "true");
    }, 300);
  };

  if (!isVisible) return null;

  const targetElement = step.target ? document.querySelector(step.target) : null;
  const isLastStep = currentStep === steps.length - 1;
  
  // Check if target element is actually visible on screen
  let isElementVisible = false;
  if (targetElement) {
    const rect = targetElement.getBoundingClientRect();
    isElementVisible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
  }

  return (
    <>
      {/* Overlay */}
      <div className={`onboarding-overlay ${isVisible ? "show" : ""}`} onClick={handleComplete} />

      {/* Spotlight - Only show if element is visible */}
      {targetElement && isElementVisible && (
        <div className="onboarding-spotlight">
          {(() => {
            const rect = targetElement.getBoundingClientRect();
            return (
              <svg
                className="onboarding-spotlight-svg"
                style={{
                  left: rect.left - 12,
                  top: rect.top - 12,
                  width: rect.width + 24,
                  height: rect.height + 24,
                }}
              >
                <defs>
                  <mask id="spotlight-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x="12"
                      y="12"
                      width={rect.width}
                      height={rect.height}
                      rx="12"
                      fill="black"
                    />
                  </mask>
                  <filter id="spotlight-glow">
                    <feGaussianBlur stdDeviation="9" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="neon-glow">
                    <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Shadow overlay */}
                <rect
                  width="100%"
                  height="100%"
                  fill="rgba(0,0,0,0.94)"
                  mask="url(#spotlight-mask)"
                />
                {/* Highlight fill inside the box */}
                <rect
                  x="12"
                  y="12"
                  width={rect.width}
                  height={rect.height}
                  rx="12"
                  fill="rgba(102, 126, 234, 0.15)"
                  className="onboarding-spotlight-fill"
                />
                {/* Outer intense neon glow border */}
                <rect
                  x="12"
                  y="12"
                  width={rect.width}
                  height={rect.height}
                  rx="12"
                  fill="none"
                  stroke="rgba(102, 126, 234, 1)"
                  strokeWidth="6"
                  className="onboarding-spotlight-border-outer"
                  filter="url(#neon-glow)"
                  opacity="0.9"
                />
                {/* Primary neon border */}
                <rect
                  x="12"
                  y="12"
                  width={rect.width}
                  height={rect.height}
                  rx="12"
                  fill="none"
                  stroke="rgba(102, 126, 234, 1)"
                  strokeWidth="3"
                  className="onboarding-spotlight-border-primary"
                  filter="url(#spotlight-glow)"
                />
                {/* Inner bright border */}
                <rect
                  x="12"
                  y="12"
                  width={rect.width}
                  height={rect.height}
                  rx="12"
                  fill="none"
                  stroke="rgba(102, 126, 234, 0.7)"
                  strokeWidth="2"
                  className="onboarding-spotlight-border-inner"
                />
                {/* Solid neon border */}
                <rect
                  x="12"
                  y="12"
                  width={rect.width}
                  height={rect.height}
                  rx="12"
                  fill="none"
                  stroke="rgba(102, 126, 234, 1)"
                  strokeWidth="2"
                  className="onboarding-spotlight-border-solid"
                  strokeDasharray="4"
                  opacity="0.85"
                />
              </svg>
            );
          })()}
        </div>
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`onboarding-tooltip ${tooltipPos.position} ${isVisible ? "show" : ""}`}
        style={{
          top: tooltipPos.position === "center" ? "50%" : typeof tooltipPos.top === "number" ? `${tooltipPos.top}px` : tooltipPos.top,
          left: tooltipPos.position === "center" ? "50%" : typeof tooltipPos.left === "number" ? `${tooltipPos.left}px` : tooltipPos.left,
        }}
      >
        <div className="onboarding-tooltip-content">
          <div className="onboarding-tooltip-header">
            <h3 className="onboarding-tooltip-title">{step.title}</h3>
            <button
              className="onboarding-tooltip-close"
              onClick={handleComplete}
              aria-label="Close tour"
            >
              ✕
            </button>
          </div>
          <p className="onboarding-tooltip-description">{step.description}</p>

          <div className="onboarding-tooltip-footer">
            <div className="onboarding-tooltip-progress">
              {currentStep + 1} / {steps.length}
            </div>
            <div className="onboarding-tooltip-actions">
              <button
                className="onboarding-btn onboarding-btn-secondary"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Back
              </button>
              {!isLastStep && (
                <button
                  className="onboarding-btn onboarding-btn-primary"
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  Next
                </button>
              )}
              {isLastStep && (
                <button
                  className="onboarding-btn onboarding-btn-primary"
                  onClick={handleComplete}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;
