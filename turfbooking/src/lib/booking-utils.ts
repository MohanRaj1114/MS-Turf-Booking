import { differenceInMinutes, parseISO } from "date-fns";

export interface RefundBreakdown {
    originalAmount: number;
    refundAmount: number;
    fineAmount: number;
    finePercentage: number;
    reason: string;
}

/**
 * Calculates refund based on the project prompt rules:
 * 1. Cancel within 1h of booking -> 100% refund (assumed from prompt context)
 * 2. Cancel after 1h of booking -> 30% fine (70% refund)
 * 3. Cancel close to slot start -> 50% fine (50% refund)
 * 
 * Note: If slot is already started, refund might be 0, but prompt says 50% "at slot start time".
 */
export const calculateRefund = (
    bookedAt: string,
    slotStartTime: string, // format: "YYYY-MM-DD HH:mm"
    amount: number
): RefundBreakdown => {
    const now = new Date();
    const bookingTime = parseISO(bookedAt);
    const startTime = parseISO(slotStartTime);

    const minsSinceBooking = differenceInMinutes(now, bookingTime);
    const minsToSlotStart = differenceInMinutes(startTime, now);

    // Near slot start (within 2 hours or after start)
    if (minsToSlotStart <= 120) {
        return {
            originalAmount: amount,
            refundAmount: amount * 0.5,
            fineAmount: amount * 0.5,
            finePercentage: 50,
            reason: "Cancellation close to or at slot start time."
        };
    }

    // After 1 hour of booking
    if (minsSinceBooking > 60) {
        return {
            originalAmount: amount,
            refundAmount: amount * 0.7,
            fineAmount: amount * 0.3,
            finePercentage: 30,
            reason: "Cancellation after 1 hour from booking time."
        };
    }

    // Within 1 hour of booking
    return {
        originalAmount: amount,
        refundAmount: amount,
        fineAmount: 0,
        finePercentage: 0,
        reason: "Cancellation within 1 hour of booking."
    };
};
