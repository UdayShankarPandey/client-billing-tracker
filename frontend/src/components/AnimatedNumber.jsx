import React, { useEffect, useRef, useState } from 'react';

// Animates from 0 to `value` over `duration` (ms). Supports integers and floats.
export default function AnimatedNumber({ value = 0, duration = 900, format = (v) => v, decimals = 0 }) {
  const [display, setDisplay] = useState(() => format(Number(0).toFixed(decimals)));
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(0);
  const toRef = useRef(Number(value));

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    fromRef.current = 0;
    toRef.current = Number(value);
    startRef.current = null;

    const step = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = fromRef.current + (toRef.current - fromRef.current) * eased;
      setDisplay(format(current.toFixed(decimals)));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration, format, decimals]);

  return <span className="animated-number">{display}</span>;
}
