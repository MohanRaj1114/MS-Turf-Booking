import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Clock, Phone, AlertTriangle, IndianRupee, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Booking } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ImportantNotice } from "@/components/ImportantNotice";
import { useAuth } from "@/hooks/useAuth";
import { calculateRefund, RefundBreakdown } from "@/lib/booking-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [refundInfo, setRefundInfo] = useState<RefundBreakdown | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    const loadBookings = () => {
      const allBookings = JSON.parse(localStorage.getItem("bookings") || "[]");
      // Filter for current user
      const userBookings = allBookings.filter((b: any) => b.userId === user?.id);
      // Sort by bookedAt descending
      userBookings.sort((a: any, b: any) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());
      setBookings(userBookings);
    };

    if (user) loadBookings();
  }, [user]);

  const handleCancelClick = (booking: Booking) => {
    const slotStartDateTime = `${booking.date} ${booking.slot.start}`;
    const breakdown = calculateRefund(booking.bookedAt, slotStartDateTime, booking.amount);
    setSelectedBooking(booking);
    setRefundInfo(breakdown);
    setShowCancelDialog(true);
  };

  const confirmCancellation = () => {
    if (!selectedBooking) return;

    const allBookings = JSON.parse(localStorage.getItem("bookings") || "[]");
    const updatedBookings = allBookings.map((b: any) => {
      if (b.id === selectedBooking.id) {
        return { ...b, status: "cancelled", paymentStatus: "refunded", cancelledAt: new Date().toISOString(), refundInfo };
      }
      return b;
    });

    localStorage.setItem("bookings", JSON.stringify(updatedBookings));

    // Log the action
    import("@/lib/logger").then(({ logAction }) => {
      logAction("booking_cancelled", `Booking #${selectedBooking.id} cancelled. Refund info: ${refundInfo?.refundAmount}`, user?.id || "guest");
    });

    // Update local state
    setBookings(updatedBookings.filter((b: any) => b.userId === user?.id).sort((a: any, b: any) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime()));

    setShowCancelDialog(false);
    toast.success(`Booking #${selectedBooking.id} cancelled. Refund of ₹${refundInfo?.refundAmount} will be credited within 24 hours.`);
  };

  return (
    <div className="container py-8 pb-32 max-w-4xl">
      <h1 className="mb-8 text-center text-3xl font-bold text-foreground glow-text">
        My Bookings
      </h1>

      {bookings.length === 0 ? (
        <div className="mx-auto max-w-md text-center py-12 glass-card rounded-2xl border-primary/20">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground">No bookings found in your account.</p>
          <Link to="/book">
            <Button variant="accent" className="mt-6 shadow-neon-purple">
              Book Your First Slot
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((booking, i) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl border p-5 shadow-card transition-all duration-300 relative overflow-hidden ${booking.status === "cancelled"
                  ? "border-border bg-muted/30 grayscale opacity-80"
                  : "border-primary/20 bg-card hover:shadow-neon neon-border"
                  }`}
              >
                {booking.status === "cancelled" && (
                  <div className="absolute top-2 right-2 rotate-12 opacity-30 select-none">
                    <Badge variant="destructive" className="text-xs uppercase px-4 py-1 text-[10px] font-black border-2">CANCELLED</Badge>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {booking.turfName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] font-bold tracking-tight uppercase border-primary/30 text-primary capitalize">
                        {booking.sport}
                      </Badge>
                      <span className="text-xs text-muted-foreground">#{booking.id}</span>
                    </div>
                  </div>
                  <Badge
                    className={
                      booking.status === "confirmed"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }
                  >
                    {booking.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-primary/70" />
                    {booking.date ? (() => {
                      try {
                        return format(parseISO(booking.date), "MMM d, yyyy");
                      } catch (e) {
                        return booking.date;
                      }
                    })() : "N/A"}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary/70" />
                    {booking.slot?.label ? booking.slot.label.split('–')[0] : "N/A"}
                  </div>
                  <div className="flex items-center gap-2 text-primary font-bold col-span-2 text-xs uppercase tracking-widest">
                    <Info className="h-3.5 w-3.5" />
                    Team: {booking.teamName}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                    <MapPin className="h-4 w-4 text-primary/70" />
                    Booking ID: <span className="text-foreground font-mono">{booking.id}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="font-display font-bold text-lg text-primary">
                    ₹{booking.amount}
                  </div>
                  {booking.status === "confirmed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 text-xs px-3 h-8"
                      onClick={() => handleCancelClick(booking)}
                    >
                      Cancel Booking
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8">
            <ImportantNotice />
          </div>
        </div>
      )}

      {/* Cancellation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md border-primary/20 shadow-neon">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Cancellation
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to cancel your booking for <span className="font-bold text-foreground">{selectedBooking?.turfName}</span>?
            </DialogDescription>
          </DialogHeader>

          {refundInfo && (
            <div className="bg-muted/50 rounded-lg p-4 my-2 border border-border">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Refund Breakdown
              </h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Paid:</span>
                  <span className="text-foreground">₹{refundInfo.originalAmount}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Cancellation Fee ({refundInfo.finePercentage}%):</span>
                  <span>- ₹{refundInfo.fineAmount}</span>
                </div>
                <div className="flex justify-between font-bold text-primary pt-1.5 border-t border-border">
                  <span>Refund Amount:</span>
                  <span>₹{refundInfo.refundAmount}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 italic leading-tight">
                  Reason: {refundInfo.reason}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-md bg-accent/5 p-3 border border-accent/20">
            <p className="text-[11px] text-accent flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              Refund will be credited back to your original payment method within 24 hours.
            </p>
          </div>

          <DialogFooter className="flex-row gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowCancelDialog(false)}>
              Keep Booking
            </Button>
            <Button variant="destructive" className="flex-1" onClick={confirmCancellation}>
              Cancel & Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBookings;
