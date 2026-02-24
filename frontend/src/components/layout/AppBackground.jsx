import React, { useEffect, useRef } from "react";

const AppBackground = () => {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let rafId = null;
    let nextX = window.innerWidth * 0.5;
    let nextY = window.innerHeight * 0.35;

    const paint = () => {
      rafId = null;
      root.style.setProperty("--cursor-x", `${nextX}px`);
      root.style.setProperty("--cursor-y", `${nextY}px`);
      root.dataset.cursorActive = "true";
    };

    const onMove = (event) => {
      nextX = event.clientX;
      nextY = event.clientY;
      if (!rafId) rafId = window.requestAnimationFrame(paint);
    };

    const onLeave = () => {
      root.dataset.cursorActive = "false";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="app-ambient-bg pointer-events-none fixed inset-0 overflow-hidden"
      data-cursor-active="false"
      aria-hidden
    >
      <div className="app-ambient-gradient absolute inset-0" />
      <div className="app-ambient-cursor absolute inset-0" />
      <div className="app-ambient-blob app-ambient-blob-a absolute -left-28 -top-32 h-[34rem] w-[34rem] rounded-full" />
      <div className="app-ambient-blob app-ambient-blob-b absolute -right-24 top-[20%] h-[28rem] w-[28rem] rounded-full" />
      <div className="app-ambient-blob app-ambient-blob-c absolute left-[34%] bottom-[-10rem] h-[30rem] w-[30rem] rounded-full" />
      <div className="app-ambient-particles absolute inset-0" />
    </div>
  );
};

export default AppBackground;
