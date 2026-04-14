import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const stars: { x: number; y: number; size: number; speed: number }[] = [];
    const starCount = 200;

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.5 + 0.1,
      });
    }

    let scrollY = window.scrollY;

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    const handleResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "white";

      stars.forEach((star) => {
        // Subtle idle movement + scroll reaction
        const yPos = (star.y + scrollY * star.speed * 0.5) % h;
        const xPos = star.x;

        ctx.beginPath();
        ctx.arc(xPos, yPos, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Idle movement
        star.y += star.speed * 0.2;
        if (star.y > h) star.y = 0;
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: "transparent" }}
    />
  );
}
