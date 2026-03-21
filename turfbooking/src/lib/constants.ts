export type Sport = "cricket" | "football" | "badminton";

export interface Turf {
  id: string;
  name: string;
  sport: Sport;
  basePrice: number;
  normalPrice: number;
  peakPrice: number;
  location: string;
  images: string[];
  description: string;
  rating: number;
  isActive: boolean;
}

export interface TimeSlot {
  id: string;
  start: string; // "06:00"
  end: string;   // "09:00"
  label: string;
  isBooked: boolean;
  priceModifier: number; // premium added to base price
  type: "morning" | "afternoon" | "peak";
}

export interface Booking {
  id: string;
  turfId: string;
  turfName: string;
  sport: Sport;
  date: string;
  slot: TimeSlot;
  playerName: string;
  phone: string;
  teamName: string;
  status: "confirmed" | "completed" | "cancelled";
  paymentStatus: "paid" | "refunded" | "partial";
  amount: number;
  bookedAt: string; // ISO date string
}

export const SPORTS: { value: Sport; label: string; icon: string; description: string }[] = [
  { value: "cricket", label: "Cricket", icon: "🏏", description: "Book cricket nets & pitches" },
  { value: "football", label: "Football", icon: "⚽", description: "5-a-side & full pitch bookings" },
  { value: "badminton", label: "Badminton", icon: "🏸", description: "Indoor & outdoor courts" },
];

export const TIME_SLOTS: Omit<TimeSlot, "id" | "isBooked">[] = [
  { start: "06:00", end: "09:00", label: "6:00 AM – 9:00 AM", priceModifier: 0, type: "morning" },
  { start: "09:00", end: "12:00", label: "9:00 AM – 12:00 PM", priceModifier: 200, type: "afternoon" },
  { start: "12:00", end: "15:00", label: "12:00 PM – 3:00 PM", priceModifier: 100, type: "afternoon" },
  { start: "15:00", end: "18:00", label: "3:00 PM – 6:00 PM", priceModifier: 300, type: "peak" },
  { start: "18:00", end: "21:00", label: "6:00 PM – 9:00 PM", priceModifier: 500, type: "peak" },
];

export const SAMPLE_TURFS: Turf[] = [];
