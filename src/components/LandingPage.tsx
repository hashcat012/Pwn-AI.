import Navbar from "./Navbar";
import Hero from "./Hero";
import Features from "./Features";

export default function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen relative z-10">
      <Navbar onGetStarted={onGetStarted} />
      <main>
        <Hero onGetStarted={onGetStarted} />
        <Features />
        
        {/* About Section */}
        <section id="about" className="py-32 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
                The intersection of <br /> art and intelligence.
              </h2>
              <p className="text-xl text-white/50 leading-relaxed mb-8">
                We believe that AI should be as beautiful as it is powerful. Pwn AI is crafted with an obsession for detail, ensuring every interaction feels fluid and every response feels human.
              </p>
              <div className="flex items-center gap-4">
                <div className="h-[1px] w-12 bg-white/20" />
                <span className="text-sm font-bold uppercase tracking-widest text-white/40">Our Philosophy</span>
              </div>
            </div>
            <div className="aspect-square glass rounded-[4rem] flex items-center justify-center p-12">
               <div className="w-full h-full rounded-[3rem] bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center">
               </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 text-center">
          <div className="max-w-4xl mx-auto glass p-16 md:p-24 rounded-[4rem] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 relative z-10">
              Ready to pwn the future?
            </h2>
            <p className="text-xl text-white/50 mb-12 relative z-10">
              Join thousands of developers building the next generation of AI.
            </p>
            <button 
              onClick={onGetStarted}
              className="bg-white text-black px-12 py-5 rounded-full font-bold text-xl hover:bg-white/90 transition-all hover:scale-105 relative z-10"
            >
              Get Started Now
            </button>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:row items-center justify-between gap-8">
          <div className="text-xl font-bold tracking-tighter">Pwn AI.</div>
          <div className="flex items-center gap-8 text-sm text-white/40 font-medium">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
          </div>
          <div className="text-sm text-white/20">
            © 2024 Pwn AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
