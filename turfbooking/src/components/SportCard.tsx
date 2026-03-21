import { motion } from "framer-motion";
import { Sport, SPORTS } from "@/lib/constants";
import { useRef } from "react";

interface SportCardProps {
  sport: typeof SPORTS[number];
  selected: boolean;
  onSelect: (sport: Sport) => void;
}

const SportCard = ({ sport, selected, onSelect }: SportCardProps) => {
  const ref = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 15;
    const rotateY = (centerX - x) / 15;
    el.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`;
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(600px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
  };

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(sport.value)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`flex flex-col items-center gap-3 rounded-xl border p-6 transition-all duration-300 ${
        selected
          ? "border-primary bg-primary/10 shadow-neon neon-border"
          : "border-border bg-card shadow-card hover:shadow-neon neon-border"
      }`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <span className="text-4xl animate-float">{sport.icon}</span>
      <h3 className="font-display text-lg font-semibold text-foreground">
        {sport.label}
      </h3>
      <p className="text-sm text-muted-foreground">{sport.description}</p>
    </motion.button>
  );
};

export default SportCard;
