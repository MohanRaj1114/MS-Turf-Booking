import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRef } from "react";

const TiltCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-200 ease-out ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
};

const Landing = () => {
  const sports = [
    {
      id: "cricket",
      name: "Cricket",
      description: "Elite Cricket Grounds",
      image: "/anime_cricket_v2.png",
      color: "from-blue-500/20 to-blue-900/40",
      accent: "text-blue-400",
    },
    {
      id: "badminton",
      name: "Badminton",
      description: "Pro Badminton Courts",
      image: "/anime_badminton_v2.png",
      color: "from-purple-500/20 to-purple-900/40",
      accent: "text-purple-400",
    },
    {
      id: "football",
      name: "Football",
      description: "Grand Football Arenas",
      image: "/anime_football_v2.png",
      color: "from-green-500/20 to-green-900/40",
      accent: "text-green-400",
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0a] overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
      </div>

      <div className="container relative z-10 flex flex-col items-center justify-center min-h-screen py-12 px-6">
        {/* Header Logo Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 flex flex-col items-center gap-4"
        >
          <img src="/logo.png" alt="Logo" className="h-16 w-16 object-contain animate-float" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic text-center">
            MS Turf <span className="text-primary italic">Book</span>
          </h1>
        </motion.div>

        {/* 3D Sports Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mb-16">
          {sports.map((sport, index) => (
            <motion.div
              key={sport.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <TiltCard>
                <Link to="/auth" className="block group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm shadow-2xl transition-all hover:border-primary/50">
                  {/* Card Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${sport.color} opacity-40 group-hover:opacity-60 transition-opacity`} />
                  
                  {/* Anime Character Image */}
                  <img 
                    src={sport.image} 
                    alt={sport.name} 
                    className="absolute inset-0 h-full w-full object-cover mix-blend-screen opacity-80 group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Card Content Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col gap-2">
                    <span className={`text-sm font-bold tracking-[0.3em] uppercase ${sport.accent}`}>
                      {sport.name}
                    </span>
                    <h3 className="text-2xl font-bold text-white tracking-tight leading-none mb-2">
                      {sport.description}
                    </h3>
                    <div className="mt-4 flex items-center gap-2 group/btn">
                        <span className="h-[2px] w-8 bg-white/20 group-hover:w-12 group-hover:bg-primary transition-all" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Explore</span>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        {/* Start Button Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <Link to="/auth">
            <Button size="lg" className="h-16 px-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xl uppercase tracking-widest shadow-[0_10px_40px_rgba(var(--primary),0.3)] transition-all hover:scale-105 active:scale-95 group">
              Get Started
              <motion.span
                className="ml-2 inline-block"
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                →
              </motion.span>
            </Button>
          </Link>
          <p className="text-white/40 font-medium text-sm tracking-widest uppercase">
            Experience the future of turf booking
          </p>
        </motion.div>
      </div>

      {/* Decorative Scanlines/Noise */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

export default Landing;
