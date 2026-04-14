import { motion } from "framer-motion";
import { Zap, Shield, Cpu, Globe } from "lucide-react";

const features = [
  {
    title: "Lightning Fast",
    description: "Optimized for speed. Get responses in milliseconds with our edge-powered infrastructure.",
    icon: Zap,
  },
  {
    title: "Secure by Default",
    description: "Your data is encrypted and stored securely with Supabase. Privacy is our priority.",
    icon: Shield,
  },
  {
    title: "Advanced Models",
    description: "Access the world's most powerful AI models through a single, unified interface.",
    icon: Cpu,
  },
  {
    title: "Global Scale",
    description: "Deploy your AI agents globally with zero configuration. Scale as you grow.",
    icon: Globe,
  },
];

export default function Features() {
  return (
    <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-24">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Built for the future.</h2>
        <p className="text-xl text-white/50 max-w-2xl mx-auto">
          Everything you need to build, deploy, and scale AI applications with ease.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -10 }}
            className="glass p-8 rounded-3xl group cursor-default"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
              <feature.icon className="w-6 h-6 text-white/80" />
            </div>
            <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
            <p className="text-white/50 leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
