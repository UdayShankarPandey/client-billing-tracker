import React, { useEffect, useRef } from "react";
import "./Confetti.css";

const Confetti = ({ active = true, duration = 3000 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 50;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = Math.random() * 5 + 5;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 15;
        this.size = Math.random() * 4 + 2;
        this.color = [
          "hsl(267, 100%, 58%)",
          "hsl(278, 100%, 62%)",
          "hsl(290, 100%, 65%)",
          "hsl(267, 91%, 68%)",
          "hsl(278, 85%, 70%)",
        ][Math.floor(Math.random() * 5)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // gravity
        this.rotation += this.rotationSpeed;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
      }

      isOutOfBounds() {
        return this.y > canvas.height || this.x < -10 || this.x > canvas.width + 10;
      }
    }

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let animationFrameId;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.update();
        particle.draw();

        if (particle.isOutOfBounds()) {
          particles.splice(index, 1);
        }
      });

      if (elapsed < duration && particles.length > 0) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [active, duration]);

  if (!active) return null;

  return <canvas ref={canvasRef} className="confetti-canvas" />;
};

export default Confetti;
