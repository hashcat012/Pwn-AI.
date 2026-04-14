import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";

export default function Navbar({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass px-6 py-3 rounded-full flex items-center gap-8"
      >
        <a href="/" className="text-lg font-bold tracking-tighter">Pwn AI.</a>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/60">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <button 
          onClick={onGetStarted}
          className="bg-white text-black px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors"
        >
          Get Started
        </button>
      </motion.div>
    </nav>
  );
}
