import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { format, isBefore, startOfDay, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SportCard from "@/components/SportCard";
import SlotCard from "@/components/SlotCard";
import { VenueGallery } from "@/components/VenueGallery";
import {
  Sport,
  SPORTS,
  TIME_SLOTS,
  SAMPLE_TURFS,
  Turf,
  TimeSlot,
} from "@/lib/constants";
import { MapPin, IndianRupee, ArrowRight, ArrowLeft, CheckCircle2, ImageIcon, Star, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ImportantNotice } from "@/components/ImportantNotice";
import { useAuth } from "@/hooks/useAuth";
import { getApiUrl } from "@/utils/apiConfig";


// Simulate some booked slots
const BOOKED_SLOTS: Record<string, string[]> = {
  [`t1-${format(new Date(), "yyyy-MM-dd")}`]: ["09:00", "15:00"],
};

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const initialSport = (searchParams.get("sport") as Sport) || null;

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(initialSport);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [phone, setPhone] = useState("");
  const [teamName, setTeamName] = useState("");
  const [bookingComplete, setBookingComplete] = useState(false);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeGalleryTurf, setActiveGalleryTurf] = useState<Turf | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const today = startOfDay(new Date());

  // Load Razorpay script on mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const [venues, setVenues] = useState<Turf[]>([]);
  const [slots, setSlots] = useState<Omit<TimeSlot, "id" | "isBooked">[]>([]);

  useEffect(() => {
    const savedVenues = localStorage.getItem("admin_venues");
    if (savedVenues) {
      const parsed = JSON.parse(savedVenues);
      // Filter out sample venues
      setVenues(parsed.filter((v: any) => !v.id.startsWith('t')));
    } else {
      setVenues([]);
    }

    const savedSlots = localStorage.getItem("admin_slots");
    if (savedSlots) {
      setSlots(JSON.parse(savedSlots));
    } else {
      setSlots(TIME_SLOTS);
    }
  }, []);

  const filteredTurfs = useMemo(
    () => {
      const filtered = selectedSport ? venues.filter((t) => t.sport === selectedSport && t.isActive) : [];
      console.log("Filtered Turfs for", selectedSport, ":", filtered);
      return filtered;
    },
    [selectedSport, venues]
  );

  const bookedStarts = useMemo(() => {
    if (!selectedTurf || !selectedDate) return [];
    const key = `${selectedTurf.id}-${format(selectedDate, "yyyy-MM-dd")}`;
    return BOOKED_SLOTS[key] || [];
  }, [selectedTurf, selectedDate]);

  const selectedSlot = TIME_SLOTS.find((s) => s.start === selectedSlotStart);

  const calculateTotalPrice = () => {
    if (!selectedTurf || !selectedSlot) return 0;
    return selectedSlot.type === "peak" ? selectedTurf.peakPrice : selectedTurf.normalPrice;
  };

  const handleNext = () => {
    if (currentStep === 1 && !selectedSport) {
      toast({ title: "Please select a sport", variant: "destructive" });
      return;
    }
    if (currentStep === 2 && !selectedDate) {
      toast({ title: "Please select a date", variant: "destructive" });
      return;
    }
    if (currentStep === 3 && !selectedTurf) {
      toast({ title: "Please select a venue", variant: "destructive" });
      return;
    }
    if (currentStep === 4 && !selectedSlotStart) {
      toast({ title: "Please select a time slot", variant: "destructive" });
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const openGallery = (e: React.MouseEvent, turf: Turf) => {
    e.stopPropagation();
    setActiveGalleryTurf(turf);
    setGalleryOpen(true);
  };

  const handleBook = async () => {
    if (!playerName.trim() || !phone.trim() || !teamName.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (phone.length < 10) {
      toast({ title: "Enter a valid phone number", variant: "destructive" });
      return;
    }

    const bookingId = `BK${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const totalAmount = calculateTotalPrice();

    const newBooking = {
      id: bookingId,
      userId: user?.id,
      turfId: selectedTurf?.id,
      turfName: selectedTurf?.name,
      sport: selectedSport,
      date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
      slot: selectedSlot,
      playerName,
      phone,
      teamName,
      status: "confirmed",
      paymentStatus: "paid",
      amount: totalAmount,
      bookedAt: new Date().toISOString(),
    };

    try {
      // Step 1: Create Razorpay order from backend
      const orderRes = await fetch(getApiUrl("/api/payments/create-order"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount }),
      });

      if (!orderRes.ok) {
        // Fallback: save locally and complete
        throw new Error("Order creation failed, using local save");
      }

      const { orderId, keyId } = await orderRes.json();

      // Step 2: Open Razorpay Checkout
      const razorpayOptions = {
        key: keyId,
        amount: totalAmount * 100,
        currency: "INR",
        name: "MS Turf Book",
        description: `${selectedTurf?.name} - ${selectedSlot?.label}`,
        order_id: orderId,
        prefill: {
          name: playerName,
          contact: phone,
          email: user?.email || "",
        },
        theme: { color: "#00f0ff" },
        handler: async (response: any) => {
          try {
            // Step 3: Verify payment on backend, which also saves to Supabase
            const verifyRes = await fetch(getApiUrl("/api/payments/verify"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingData: {
                  userId: user?.id,
                  turfId: selectedTurf?.id,
                  date: newBooking.date,
                  slot: selectedSlot,
                  playerName,
                  phone, // Added phone for voice reminder
                  teamName,
                  amount: totalAmount,
                },
              }),
            });

            if (verifyRes.ok) {
              // Save locally too
              const existing = JSON.parse(localStorage.getItem("bookings") || "[]");
              localStorage.setItem("bookings", JSON.stringify([...existing, newBooking]));
              import("@/lib/logger").then(({ logAction }) => {
                logAction("booking_created", `Booking ${bookingId} created by ${playerName}`, user?.id || "guest");
              });
              setBookingComplete(true);
            } else {
              toast({ title: "Payment verification failed", description: "Please contact support.", variant: "destructive" });
            }
          } catch (err) {
            console.error("Verification error:", err);
            toast({ title: "Something went wrong", variant: "destructive" });
          }
        },
        modal: {
          ondismiss: () => {
            toast({ title: "Payment cancelled", variant: "destructive" });
          },
        },
      };

      const rzp = new (window as any).Razorpay(razorpayOptions);
      rzp.open();
    } catch (err) {
      // Fallback if backend is not reachable — save locally
      console.error("Razorpay error:", err);
      const existing = JSON.parse(localStorage.getItem("bookings") || "[]");
      localStorage.setItem("bookings", JSON.stringify([...existing, newBooking]));
      import("@/lib/logger").then(({ logAction }) => {
        logAction("booking_created", `Booking ${bookingId} created by ${playerName}`, user?.id || "guest");
      });
      setBookingComplete(true);
    }
  };



  const resetBooking = () => {
    setCurrentStep(1);
    setSelectedSport(null);
    setSelectedDate(undefined);
    setSelectedTurf(null);
    setSelectedSlotStart(null);
    setShowConfirm(false);
    setPlayerName("");
    setPhone("");
    setTeamName("");
    setBookingComplete(false);
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="container py-8 max-w-4xl min-h-[80vh] flex flex-col">
      {/* Progress Header */}
      <div className="mb-12 flex items-center justify-between px-4 sm:px-12">
        {["Sport", "Date", "Venue", "Slot", "Review"].map((s, i) => (
          <div key={s} className="flex flex-col items-center gap-2 relative z-10">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-sm font-display font-black transition-all duration-500 border-2",
                i + 1 < currentStep
                  ? "bg-primary border-primary text-black shadow-neon"
                  : i + 1 === currentStep
                    ? "border-primary text-primary shadow-neon animate-pulse-glow"
                    : "border-muted text-muted-foreground bg-background"
              )}
            >
              {i + 1 < currentStep ? "✓" : i + 1}
            </div>
            <span className={cn(
              "hidden text-[10px] uppercase font-bold tracking-widest sm:block",
              i + 1 === currentStep ? "text-primary" : "text-muted-foreground"
            )}>
              {s}
            </span>
          </div>
        ))}
        {/* Progress Line */}
        <div className="absolute left-[10%] right-[10%] top-[45px] h-0.5 bg-muted -z-0 hidden sm:block">
          <div
            className="h-full bg-primary shadow-neon transition-all duration-500"
            style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {/* Step 1: Sport */}
          {currentStep === 1 && (
            <motion.section
              key="step1"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-foreground tracking-tight glow-text uppercase">
                  Select Your Sport
                </h2>
                <p className="text-muted-foreground">Choose the game you want to play today</p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {SPORTS.map((sport) => (
                  <SportCard
                    key={sport.value}
                    sport={sport}
                    selected={selectedSport === sport.value}
                    onSelect={(v) => {
                      setSelectedSport(v);
                      setTimeout(() => setCurrentStep(2), 300);
                    }}
                  />
                ))}
              </div>
            </motion.section>
          )}

          {/* Step 2: Date */}
          {currentStep === 2 && (
            <motion.section
              key="step2"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-foreground tracking-tight glow-text uppercase">
                  Pick a Date
                </h2>
                <p className="text-muted-foreground">Select when you want to hit the ground</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-full max-w-sm rounded-2xl border border-primary/20 bg-card p-6 shadow-neon neon-border">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => {
                      setSelectedDate(d);
                      if (d) setTimeout(() => setCurrentStep(3), 300);
                    }}
                    disabled={(date) => isBefore(date, today)}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex justify-start pt-8">
                <Button variant="ghost" size="lg" onClick={handleBack} className="text-muted-foreground">
                  <ArrowLeft className="mr-2 h-5 w-5" /> Back
                </Button>
              </div>
            </motion.section>
          )}

          {/* Step 3: Venue */}
          {currentStep === 3 && (
            <motion.section
              key="step3"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-foreground tracking-tight glow-text uppercase">
                  Choose Venue
                </h2>
                <p className="text-muted-foreground">Available turfs for {selectedSport} on {selectedDate && format(selectedDate, "MMM d")}</p>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {filteredTurfs.map((turf) => {
                    const sportImage = selectedSport === 'cricket' ? '/cricket_playing.png' : 
                                       selectedSport === 'football' ? '/football_playing.png' :
                                       selectedSport === 'badminton' ? '/badminton_playing.png' : '';

                    return (
                      <motion.div
                        key={turf.id}
                        layoutId={turf.id}
                        onClick={() => {
                          setSelectedTurf(turf);
                          setTimeout(() => setCurrentStep(4), 300);
                        }}
                        className={cn(
                          "group relative flex flex-col sm:flex-row overflow-hidden rounded-2xl border-2 transition-all duration-500 cursor-pointer",
                          selectedTurf?.id === turf.id
    
                            ? "border-primary bg-primary/5 shadow-neon"
                            : "border-border bg-card hover:border-primary/40"
                        )}
                      >
                        <div className="relative h-48 sm:h-auto sm:w-64 overflow-hidden">
                          <img
                            src={sportImage || `${turf.images[0]}?auto=format&fit=crop&w=600&q=80`}
                            alt={turf.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent sm:bg-gradient-to-r" />
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute bottom-3 left-3 bg-black/60 text-white backdrop-blur-md border-white/20 hover:bg-black/80"
                            onClick={(e) => {
                                e.stopPropagation();
                                const imagesWithSport = sportImage ? [sportImage, ...turf.images] : turf.images;
                                setActiveGalleryTurf({...turf, images: imagesWithSport});
                                setGalleryOpen(true);
                            }}
                          >
                            <ImageIcon className="mr-2 h-3.5 w-3.5" /> View Gallery
                          </Button>
                        </div>

                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-display text-xl font-black text-foreground">{turf.name}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            {turf.location}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary border border-primary/20">
                          <Star className="h-3 w-3 fill-primary" /> {turf.rating}
                        </div>
                      </div>

                      <p className="mt-4 text-sm text-muted-foreground line-clamp-2 italic leading-relaxed">
                        "{turf.description}"
                      </p>

                      <div className="mt-6 flex items-end justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Starting from</span>
                          <div className="flex items-center gap-1 text-2xl font-black text-primary">
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5 text-primary">
                              <IndianRupee className="h-4 w-4" />
                              <span className="text-xl font-black">{turf.normalPrice}</span>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">Normal</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-rose-500">
                              <IndianRupee className="h-3 w-3" />
                              <span className="text-base font-black">{turf.peakPrice}</span>
                              <span className="text-[10px] uppercase font-bold">Peak</span>
                            </div>
                          </div>
                          </div>
                        </div>
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                          selectedTurf?.id === turf.id ? "bg-primary text-black shadow-neon" : "bg-muted text-muted-foreground"
                        )}>
                          {selectedTurf?.id === turf.id ? <CheckCircle2 className="h-6 w-6" /> : <ArrowRight className="h-5 w-5" />}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              </div>
              <div className="flex justify-start pt-8">
                <Button variant="ghost" size="lg" onClick={handleBack} className="text-muted-foreground">
                  <ArrowLeft className="mr-2 h-5 w-5" /> Back
                </Button>
              </div>
            </motion.section>
          )}

          {/* Step 4: Slot */}
          {currentStep === 4 && (
            <motion.section
              key="step4"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-foreground tracking-tight glow-text uppercase">
                  Select Time Slot
                </h2>
                <p className="text-muted-foreground">{selectedTurf?.name} • Individual pricing per slot</p>
              </div>
              <div className="mx-auto grid max-w-lg grid-cols-1 gap-4">
                {slots.map((slot) => {
                  const booked = bookedStarts.includes(slot.start);
                  const totalPrice = slot.type === "peak" ? (selectedTurf?.peakPrice || 0) : (selectedTurf?.normalPrice || 0);
                  return (
                    <SlotCard
                      key={slot.start}
                      label={slot.label}
                      isBooked={booked}
                      isSelected={selectedSlotStart === slot.start}
                      onSelect={() => {
                        setSelectedSlotStart(slot.start);
                        setTimeout(() => setCurrentStep(5), 300);
                      }}
                      price={totalPrice}
                      type={slot.type}
                    />
                  );
                })}
              </div>
              <div className="flex justify-start pt-8">
                <Button variant="ghost" size="lg" onClick={handleBack} className="text-muted-foreground">
                  <ArrowLeft className="mr-2 h-5 w-5" /> Back
                </Button>
              </div>
            </motion.section>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && selectedTurf && selectedSlot && (
            <motion.section
              key="step5"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8 mx-auto max-w-2xl"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-foreground tracking-tight glow-text uppercase">
                  Check & Confirm
                </h2>
                <p className="text-muted-foreground">Final review of your booking details</p>
              </div>
              <div className="rounded-3xl border border-primary/20 bg-card p-8 shadow-neon neon-border space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Selected Venue</span>
                      <h3 className="text-xl font-bold text-foreground">{selectedTurf.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {selectedTurf.location}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Date & Sport</span>
                      <p className="text-base font-semibold text-foreground">
                        {format(selectedDate!, "EEEE, MMM d, yyyy")}
                      </p>
                      <Badge variant="outline" className="text-primary border-primary/20 uppercase text-[10px] font-black">{selectedSport}</Badge>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Chosen Slot</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <p className="text-lg font-bold text-foreground">{selectedSlot.label}</p>
                      </div>
                      <Badge className={cn(
                        "uppercase text-[10px] font-black",
                        selectedSlot.type === 'peak' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                      )}>
                        {selectedSlot.type} PRICING
                      </Badge>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-muted-foreground">Total Price</span>
                        <div className="text-3xl font-black text-primary flex items-center gap-1">
                          <IndianRupee className="h-6 w-6" /> {calculateTotalPrice()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <ImportantNotice />

                <div className="pt-4">
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full py-8 text-lg font-black uppercase tracking-widest shadow-neon-purple group"
                    onClick={() => setShowConfirm(true)}
                  >
                    Confirm & Proceed to Payment
                    <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-2" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-start">
                <Button variant="ghost" size="lg" onClick={handleBack} className="text-muted-foreground">
                  <ArrowLeft className="mr-2 h-5 w-5" /> Back to Slots
                </Button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* Gallery Modal */}
      <VenueGallery
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        images={activeGalleryTurf?.images || []}
        venueName={activeGalleryTurf?.name || ""}
      />

      {/* Confirm Registration Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md border-primary/20 shadow-neon">
          {!bookingComplete ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-black uppercase tracking-tight text-primary glow-text">
                  Complete Your Booking
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Almost there! We just need a few more details.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Player Full Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Rahul Sharma"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={100}
                    className="bg-muted/50 border-primary/10 focus:border-primary/40 focus:ring-0 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Team Name (Mandatory)</Label>
                  <Input
                    id="team"
                    placeholder="e.g. Warriors FC"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    maxLength={50}
                    className="bg-muted/50 border-primary/10 focus:border-primary/40 focus:ring-0 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Contact Mobile Number</Label>
                  <Input
                    id="phone"
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    maxLength={10}
                    className="bg-muted/50 border-primary/10 focus:border-primary/40 focus:ring-0 h-12"
                  />
                </div>
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex justify-between items-center">
                  <span className="font-bold text-sm text-foreground">Total Payable Amount</span>
                  <span className="text-2xl font-black text-primary">₹{calculateTotalPrice()}</span>
                </div>
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full h-14 text-base font-black uppercase tracking-widest shadow-neon-purple mt-4"
                  onClick={handleBook}
                >
                  Pay & Confirm Booking
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-6 py-10 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 border-2 border-primary shadow-neon"
              >
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="font-display text-2xl font-black text-foreground uppercase tracking-tight glow-text-white">
                  Slot Booked Successfully!
                </h3>
                <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
                  Your turf at <span className="font-bold text-primary">{selectedTurf?.name}</span> is reserved for you.
                </p>
              </div>
              <div className="w-full bg-muted/30 rounded-2xl p-4 border border-border space-y-3 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground uppercase font-bold tracking-tight">Booking ID</span>
                  <span className="text-foreground font-mono font-bold">#BK-{(Math.random() * 1000).toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground uppercase font-bold tracking-tight">Time & Date</span>
                  <span className="text-foreground font-bold">{format(selectedDate!, "MMM d")} • {selectedSlot?.label}</span>
                </div>
              </div>
              <div className="rounded-xl bg-accent/5 p-4 text-[10px] text-accent leading-relaxed border border-accent/20">
                🚀 Voice reminders: 30m before start & end of your slot.
              </div>
              <Button variant="hero" className="w-full h-12 font-black uppercase tracking-widest" onClick={resetBooking}>
                Book Another Slot
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingPage;

// Helper Badge component since it's used
const Badge = ({ children, className, variant = "default" }: { children: React.ReactNode, className?: string, variant?: "default" | "outline" }) => (
  <span className={cn(
    "px-2 py-0.5 rounded-full text-[10px] items-center inline-flex",
    variant === "outline" ? "border" : "bg-primary text-black",
    className
  )}>
    {children}
  </span>
);
