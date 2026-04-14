import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Hero({ onGetStarted }: { onGetStarted: () => void }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance animations
      gsap.from(titleRef.current, {
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out",
        delay: 0.2
      });

      gsap.from(subtitleRef.current, {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.5
      });

      gsap.from(ctaRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        delay: 0.8
      });

      gsap.from(visualRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 1.5,
        ease: "power4.out",
        delay: 0.4
      });

      // Floating animation for the visual element
      gsap.to(visualRef.current, {
        y: -20,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // Scroll animations
      gsap.to(visualRef.current, {
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true
        },
        y: 150,
        rotateX: 20,
        scale: 1.1,
        opacity: 0.5
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 text-center max-w-4xl">
        <h1 ref={titleRef} className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 text-gradient">
          Intelligence, <br /> Redefined.
        </h1>
        <p ref={subtitleRef} className="text-xl md:text-2xl text-white/50 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
          Pwn AI is the next generation of artificial intelligence. Minimalist by design, powerful by nature.
        </p>
        <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onGetStarted}
            className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-white/90 transition-all hover:scale-105 active:scale-95"
          >
            Start Building
          </button>
          <button className="w-full sm:w-auto glass px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all">
            View Documentation
          </button>
        </div>
      </div>

      {/* Hero Visual */}
      <div className="mt-24 perspective-1000 w-full max-w-5xl">
        <div ref={visualRef} className="relative w-full aspect-video rounded-3xl overflow-hidden glass border-white/20 shadow-2xl shadow-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
