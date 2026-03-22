import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Shield, Phone, Clock, MapPin, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { SPORTS } from "@/lib/constants";
import heroImage from "@/assets/hero-turf.jpg";
import { useRef, useEffect } from "react";
import { getApiUrl } from "@/utils/apiConfig";


const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

const features = [
  { icon: Shield, title: "Secure Booking", desc: "Instant slot locking with encrypted payment gateways" },
  { icon: Phone, title: "Smart Call Reminders", desc: "Receive an automated confirmation call 1 minute after booking & reminders before your slot starts" },
  { icon: Clock, title: "Real-time Availability", desc: "Check live slot status and book your preferred time instantly" },
  { icon: Calendar, title: "Flexible Scheduling", desc: "Plan your matches ahead with our intuitive calendar system" },
  { icon: CreditCard, title: "Instant Access", desc: "Digital booking receipts for quick verification at the turf" },
  { icon: MapPin, title: "Premium Venues", desc: "Curated list of top-rated turfs with stadium-grade lighting and pitches" },
];

const Card3D = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 12;
    const rotateY = (centerX - x) / 12;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-300 ease-out ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
};

import Hero from "@/components/Hero";

const Index = () => {
  useEffect(() => {
    fetch(getApiUrl("/api/health"))
      .then((res) => res.json())
      .then((data) => console.log("Backend response:", data))
      .catch((err) => console.error("Backend connection failed:", err));
  }, []);

  return (
    <div className="flex flex-col">
      <Hero />

      {/* Sports */}
      <section className="container py-20 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 h-40 w-40 rounded-full bg-primary/10 blur-[80px]" />
          <div className="absolute bottom-0 right-1/4 h-40 w-40 rounded-full bg-accent/10 blur-[80px]" />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12 text-center relative z-10"
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl glow-text">
            Choose Your Sport
          </h2>
          <p className="mt-3 text-muted-foreground">
            Select a sport and find the perfect turf near you
          </p>
        </motion.div>
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3 relative z-10">
          {SPORTS.map((sport, i) => (
            <motion.div
              key={sport.value}
              initial={{ opacity: 0, y: 30, rotateX: 15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
            >
              <Card3D>
                <Link to={`/book?sport=${sport.value}`}>
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/20 bg-card p-8 shadow-card transition-all hover:shadow-neon neon-border">
                    <span className="text-5xl animate-float" style={{ animationDelay: `${i * 0.5}s` }}>{sport.icon}</span>
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      {sport.label}
                    </h3>
                    <p className="text-sm text-muted-foreground text-center">
                      {sport.description}
                    </p>
                  </div>
                </Link>
              </Card3D>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-4xl font-bold text-foreground sm:text-5xl glow-text leading-tight">
              The MS Turf Experience
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Elevating local sports with professional-grade booking management and smart technology.
            </p>
          </motion.div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30, rotateY: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Card3D>
                  <div className="rounded-xl border border-border bg-card p-6 shadow-card hover:shadow-neon transition-shadow duration-300 neon-border h-full">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg gradient-hero shadow-neon">
                      <f.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </Card3D>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl rounded-2xl gradient-hero p-12 shadow-neon relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-50" />
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-accent/20 blur-[80px]" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-primary-foreground glow-text">
              Ready to Play?
            </h2>
            <p className="mt-3 text-primary-foreground/80">
              Book your next slot in under a minute.
            </p>
            <Link to="/book">
              <Button variant="accent" size="lg" className="mt-6 text-base px-8 py-6 shadow-neon-purple">
                Book Now
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 backdrop-blur">
        <div className="container text-center text-sm text-muted-foreground">
          © 2026 MS Turf Book. All rights reserved. Built for local communities.
        </div>
      </footer>
    </div>
  );
};

export default Index;
