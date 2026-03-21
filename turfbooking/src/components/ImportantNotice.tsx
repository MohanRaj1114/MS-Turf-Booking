import { AlertCircle, Clock, IndianRupee, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const ImportantNotice = () => {
    return (
        <Card className="border-accent/40 bg-accent/5 shadow-neon-purple overflow-hidden">
            <div className="bg-accent/10 px-4 py-2 flex items-center gap-2 border-b border-accent/20">
                <AlertCircle className="h-4 w-4 text-accent" />
                <span className="font-display text-sm font-bold text-accent uppercase tracking-wider">
                    Important Notice & Rules
                </span>
            </div>
            <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 mt-0.5 text-primary" />
                    <p className="text-sm text-foreground/80">
                        Slots can be cancelled within <span className="text-primary font-bold">1 hour</span> after booking for a full refund.
                    </p>
                </div>
                <div className="flex items-start gap-3">
                    <IndianRupee className="h-4 w-4 mt-0.5 text-primary" />
                    <p className="text-sm text-foreground/80">
                        After 1 hour of booking, <span className="text-accent font-bold">30%</span> of the amount will be charged as a cancellation fee.
                    </p>
                </div>
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-destructive" />
                    <p className="text-sm text-foreground/80">
                        Cancelling at or near the slot start time will result in a <span className="text-destructive font-bold">50% deduction</span>.
                    </p>
                </div>
                <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                        Refunds will be credited to your account within 24 hours. All logs are maintained for transparency.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
