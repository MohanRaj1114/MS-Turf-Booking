import { motion } from "framer-motion";
import { Clock, Lock, CheckCircle } from "lucide-react";

interface SlotCardProps {
  label: string;
  isBooked: boolean;
  isSelected: boolean;
  onSelect: () => void;
  price?: number;
  type?: string;
}

const SlotCard = ({ label, isBooked, isSelected, onSelect, price, type }: SlotCardProps) => {
  const getBadgeColor = () => {
    switch (type) {
      case "morning": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "afternoon": return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "peak": return "text-rose-400 bg-rose-400/10 border-rose-400/20";
      default: return "text-primary bg-primary/10 border-primary/20";
    }
  }

  return (
    <motion.button
      whileHover={!isBooked ? { scale: 1.02, x: 5 } : {}}
      whileTap={!isBooked ? { scale: 0.98 } : {}}
      disabled={isBooked}
      onClick={onSelect}
      className={`flex items-center gap-4 rounded-xl border px-5 py-4 transition-all duration-300 ${isSelected
          ? "border-primary bg-primary/10 shadow-neon scale-[1.02]"
          : isBooked
            ? "border-border bg-muted/30 opacity-60 cursor-not-allowed"
            : "border-primary/20 bg-card hover:border-primary/60 hover:shadow-neon neon-border"
        }`}
    >
      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-primary text-black' : 'bg-muted text-muted-foreground'}`}>
        <Clock className="h-5 w-5" />
      </div>

      <div className="flex flex-col items-start gap-0.5">
        <span className="font-display text-sm font-bold tracking-tight">{label}</span>
        {type && (
          <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded border inline-block ${getBadgeColor()}`}>
            {type}
          </span>
        )}
      </div>

      <div className="ml-auto flex flex-col items-end gap-1">
        {price !== undefined && !isBooked && (
          <span className="text-sm font-bold text-primary font-mono">₹{price}</span>
        )}
        <div className="text-xs">
          {isBooked ? (
            <span className="text-destructive font-bold uppercase tracking-widest text-[10px]">Booked</span>
          ) : isSelected ? (
            <CheckCircle className="h-4 w-4 text-primary" />
          ) : (
            <span className="text-primary/40 text-[10px] uppercase font-bold tracking-widest">Available</span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

export default SlotCard;
