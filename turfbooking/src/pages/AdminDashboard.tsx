import { useState, useEffect } from "react";
import { SAMPLE_TURFS, Turf, TIME_SLOTS, TimeSlot } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, Save, X, ImageIcon, IndianRupee, Clock, LogOut, AlertCircle, RefreshCw, Users, CreditCard, LayoutDashboard, History, Calendar as CalendarIcon, CheckCircle, XCircle, Search, Filter, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay } from "date-fns";
import { Booking } from "@/lib/constants";
import { logAction } from "@/lib/logger";
import { getApiUrl } from "@/utils/apiConfig";


const AdminDashboard = () => {
    const { logout, user: adminUser } = useAuth();
    const [venues, setVenues] = useState<Turf[]>([]);
    const [slots, setSlots] = useState<Omit<TimeSlot, "id" | "isBooked">[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [editingVenue, setEditingVenue] = useState<Partial<Turf> | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [timeFilter, setTimeFilter] = useState("all");

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [backendStats, setBackendStats] = useState({
        totalAmount: 0,
        dailyCollection: 0,
        refundAmount: 0,
        totalRefunded: 0
    });

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch backend financial stats
            try {
                const statsRes = await fetch(getApiUrl("/api/payments/stats"));
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setBackendStats(statsData);
                }
            } catch (err) {
                console.error("Failed to fetch backend stats:", err);
            }

            // 2. Fetch Venues from Backend
            try {
                const venuesRes = await fetch(getApiUrl("/api/turfs"));
                if (venuesRes.ok) {
                    const data = await venuesRes.json();
                    if (data.length > 0) {
                        setVenues(data);
                        localStorage.setItem("admin_venues", JSON.stringify(data));
                    } else {
                        // Fallback to localStorage if DB is empty
                        const saved = JSON.parse(localStorage.getItem("admin_venues") || "[]");
                        setVenues(saved.filter((v: any) => !v.id.startsWith('t')));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch venues from backend:", err);
                const saved = JSON.parse(localStorage.getItem("admin_venues") || "[]");
                setVenues(saved.filter((v: any) => !v.id.startsWith('t')));
            }

            // 3. Fetch Bookings from Backend
            try {
                const bookingsRes = await fetch(getApiUrl("/api/bookings"));
                if (bookingsRes.ok) {
                    const data = await bookingsRes.json();
                    // Map snake_case from DB to camelCase for frontend
                    const mapped = data.map((b: any) => ({
                        ...b,
                        date: b.booking_date,
                        playerName: b.player_name,
                        teamName: b.team_name,
                        slot: typeof b.slot === 'string' ? JSON.parse(b.slot) : b.slot,
                        bookedAt: b.created_at
                    }));
                    setBookings(mapped);
                    localStorage.setItem("bookings", JSON.stringify(mapped));
                }
            } catch (err) {
                console.error("Failed to fetch bookings from backend:", err);
                const local = JSON.parse(localStorage.getItem("bookings") || "[]");
                setBookings(local);
            }

            const savedSlots = localStorage.getItem("admin_slots");
            if (savedSlots) {
                setSlots(JSON.parse(savedSlots));
            } else {
                setSlots(TIME_SLOTS);
            }

        } catch (err) {
            console.error("Admin data load error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const saveVenues = (updatedVenues: Turf[]) => {
        setVenues(updatedVenues);
        localStorage.setItem("admin_venues", JSON.stringify(updatedVenues));
    };

    const handleAddVenue = async () => {
        if (!editingVenue?.name || !editingVenue?.sport || !editingVenue?.normalPrice || !editingVenue?.peakPrice) {
            toast.error("Please fill in basic venue details and prices");
            return;
        }

        const newVenue: Turf = {
            id: editingVenue.id || `v${Date.now()}`,
            name: editingVenue.name || "",
            sport: editingVenue.sport as any || "cricket",
            basePrice: Number(editingVenue.normalPrice), // backward compatibility
            normalPrice: Number(editingVenue.normalPrice),
            peakPrice: Number(editingVenue.peakPrice),
            location: editingVenue.location || "",
            images: (editingVenue.images && editingVenue.images.length > 0) ? editingVenue.images : [
                editingVenue.sport === 'cricket' ? '/cricket_playing.png' :
                editingVenue.sport === 'football' ? '/football_playing.png' :
                editingVenue.sport === 'badminton' ? '/badminton_playing.png' : 
                "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e"
            ],
            description: editingVenue.description || "",
            rating: editingVenue.rating || 4.5,
            isActive: editingVenue.isActive !== undefined ? editingVenue.isActive : true
        };

        // Save to Backend
        try {
            const res = await fetch(getApiUrl("/api/turfs"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newVenue)
            });
            if (!res.ok) throw new Error("Failed to save to database");
            toast.success("Syncing with database...");
        } catch (err) {
            console.error("Backend sync failed:", err);
            toast.warning("Saved locally. Backend sync failed.");
        }

        let updated;
        if (venues.find(v => v.id === newVenue.id)) {
            updated = venues.map(v => v.id === newVenue.id ? newVenue : v);
            toast.success("Venue updated successfully");
        } else {
            updated = [...venues, newVenue];
            toast.success("Venue added successfully");
        }

        saveVenues(updated);
        logAction(editingVenue.id ? "venue_updated" : "venue_added", `Venue ${newVenue.name} ${editingVenue.id ? "updated" : "added"}`, adminUser?.id);
        setIsAdding(false);
        setEditingVenue(null);
    };

    const toggleVenueStatus = (id: string) => {
        const updated = venues.map(v => v.id === id ? { ...v, isActive: !v.isActive } : v);
        saveVenues(updated);
        const venue = venues.find(v => v.id === id);
        logAction("venue_added", `Venue ${venue?.name} status toggled`, adminUser?.id);
        toast.info(`Venue ${venue?.isActive ? 'deactivated' : 'activated'}`);
    };

    const handleDeleteVenue = (id: string) => {
        if (confirm("Are you sure you want to delete this venue? This will effectively deactivate it for new bookings but preserve history.")) {
            const updated = venues.map(v => v.id === id ? { ...v, isActive: false } : v);
            saveVenues(updated);
            logAction("venue_deleted", `Venue ID ${id} soft-deleted/deactivated`, adminUser?.id);
            toast.success("Venue deactivated");
        }
    };

    const handleUpdatePrice = (index: number, newModifier: number) => {
        const updatedSlots = [...slots];
        const oldVal = updatedSlots[index].priceModifier;
        updatedSlots[index].priceModifier = newModifier;
        setSlots(updatedSlots);
        localStorage.setItem("admin_slots", JSON.stringify(updatedSlots));
        logAction("price_updated", `Slot ${updatedSlots[index].label} modifier changed from ${oldVal} to ${newModifier}`, adminUser?.id);
        toast.success("Price rule updated");
    };

    const toggleSlotType = (index: number) => {
        const updatedSlots = [...slots];
        const newType = updatedSlots[index].type === "peak" ? "afternoon" : "peak";
        updatedSlots[index].type = newType;
        setSlots(updatedSlots);
        localStorage.setItem("admin_slots", JSON.stringify(updatedSlots));
        logAction("slot_type_changed", `Slot ${updatedSlots[index].label} type changed to ${newType}`, adminUser?.id);
        toast.info(`Slot changed to ${newType}`);
    };

    const filteredBookings = bookings.filter(b => {
        const matchesSearch = b.playerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             b.teamName.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;

        const bookingDate = new Date(b.date);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        if (timeFilter === "today") return isSameDay(bookingDate, today);
        if (timeFilter === "tomorrow") return isSameDay(bookingDate, tomorrow);
        if (timeFilter === "future") return bookingDate > today;
        
        return true;
    });

    const stats = {
        totalBookings: bookings.length,
        activeBookings: bookings.filter(b => b.status === 'confirmed').length,
        refundsToday: bookings.filter(b => b.status === 'cancelled' && isSameDay(new Date(b.bookedAt), new Date())).length,
        refundAmount: backendStats.refundAmount > 0 ? backendStats.refundAmount : (bookings.reduce((acc, b) => {
            if (b.status === 'cancelled') return acc + (b.amount * 0.7);
            return acc;
        }, 0)),
        totalRevenue: backendStats.totalAmount > 0 ? backendStats.totalAmount : (bookings.filter(b => b.status !== 'cancelled').reduce((acc, b) => acc + b.amount, 0)),
        dailyCollection: backendStats.dailyCollection > 0 ? backendStats.dailyCollection : (bookings.filter(b => b.status !== 'cancelled' && isSameDay(new Date(b.bookedAt), new Date())).reduce((acc, b) => acc + b.amount, 0))
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/20" />
                    <div className="absolute top-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin shadow-neon" />
                </div>
                <p className="text-sm font-black uppercase tracking-[0.2em] animate-pulse glow-text">Initializing Admin Portal...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full glass-card border-destructive/20 p-8 text-center space-y-6"
                >
                    <div className="mx-auto h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20 shadow-neon-purple">
                        <AlertCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-destructive">Dashboard Error</h2>
                        <p className="text-muted-foreground text-sm font-medium">Something went wrong. Please try again.</p>
                    </div>
                    <Button variant="hero" onClick={loadData} className="w-full flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4" /> Retry Connection
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="container py-8 max-w-6xl space-y-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-neon">
                        <LayoutDashboard className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black glow-text-white uppercase tracking-tighter leading-none">Admin Portal</h1>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Management Console • v2.0</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-card px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Admin: {adminUser?.name?.split(' ')[0]}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive h-10 w-10">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-8">
                <TabsList className="bg-muted/30 p-1 rounded-2xl border border-white/5 h-16 w-full sm:w-auto grid grid-cols-4 gap-2">
                    <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase tracking-widest text-[10px] gap-2">
                        <LayoutDashboard className="h-3.5 w-3.5" /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="bookings" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase tracking-widest text-[10px] gap-2">
                        <History className="h-3.5 w-3.5" /> Bookings
                    </TabsTrigger>
                    <TabsTrigger value="venues" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase tracking-widest text-[10px] gap-2">
                        <ImageIcon className="h-3.5 w-3.5" /> Venues
                    </TabsTrigger>
                    <TabsTrigger value="pricing" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase tracking-widest text-[10px] gap-2">
                        <CreditCard className="h-3.5 w-3.5" /> Pricing
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Total Bookings", val: stats.totalBookings, icon: History, color: "text-blue-500", bg: "bg-blue-500/10" },
                            { label: "Today's Collection", val: `₹${stats.dailyCollection}`, icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                            { label: "Refund Amount", val: `₹${stats.refundAmount}`, icon: Ban, color: "text-rose-500", bg: "bg-rose-500/10" },
                            { label: "Total Revenue", val: `₹${stats.totalRevenue}`, icon: IndianRupee, color: "text-primary", bg: "bg-primary/10" },
                            { label: "Tomorrow's Bookings", val: bookings.filter(b => isSameDay(new Date(b.date), new Date(new Date().setDate(new Date().getDate() + 1)))).length, icon: CalendarIcon, color: "text-amber-500", bg: "bg-amber-500/10" },
                        ].map((s, i) => (
                            <Card key={i} className="glass-card overflow-hidden group">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border border-white/5 transition-transform group-hover:scale-110", s.bg)}>
                                            <s.icon className={cn("h-5 w-5", s.color)} />
                                        </div>
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{s.label}</h4>
                                    <p className="text-2xl font-black text-foreground tracking-tighter">{s.val}</p>
                                </CardContent>
                                <div className="h-1 w-full bg-muted/20 relative overflow-hidden">
                                    <div className={cn("absolute inset-0 h-full w-2/3 opacity-30", s.bg.replace('/10', ''))} />
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Refund Summary Report Widget */}
                        <Card className="glass-card border-rose-500/20">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-widest">Daily Refund Summary</CardTitle>
                                    <CardDescription className="text-xs">Analytics for {format(new Date(), "MMM d, yyyy")}</CardDescription>
                                </div>
                                <Badge variant="outline" className="text-rose-500 border-rose-500/20 uppercase text-[10px] font-black">Report</Badge>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Total Refunded</span>
                                        <span className="text-xl font-black text-foreground tracking-tighter">₹{stats.refundAmount}</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Refund Rate</span>
                                        <span className="text-xl font-black text-foreground tracking-tighter">
                                            {stats.totalBookings > 0 ? ((stats.refundsToday / stats.totalBookings) * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Ban className="h-4 w-4 text-rose-500" />
                                        <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">
                                            System Policy: 70% refund applied for daily cancellations as per management rules.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent System Activity Logs */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <History className="h-4 w-4 text-primary" /> System Audit Logs
                                </CardTitle>
                                <CardDescription className="text-xs">Security & Action tracking</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                    {JSON.parse(localStorage.getItem("system_logs") || "[]").map((log: any) => (
                                        <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <History className="h-3 w-3 text-primary" />
                                            </div>
                                            <div className="flex-1 space-y-0.5">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[10px] font-black text-foreground uppercase tracking-tight">{log.action.replace('_', ' ')}</p>
                                                    <span className="text-[8px] font-bold text-muted-foreground shrink-0">{format(new Date(log.timestamp), "HH:mm")}</span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground leading-tight">{log.details}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {JSON.parse(localStorage.getItem("system_logs") || "[]").length === 0 && (
                                        <div className="text-center py-8">
                                            <History className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Log System Initialized</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="bookings" className="animate-in fade-in slide-in-from-bottom-2">
                    <Card className="glass-card border-white/5 overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Booked Slots Overview</h2>
                                <p className="text-xs text-muted-foreground">Total records: {bookings.length}</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search Team/Player..." 
                                        className="pl-9 h-9 w-[200px] bg-muted/20 border-white/10 text-xs" 
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <select 
                                    className="bg-muted/20 border border-white/10 rounded-md px-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary/40"
                                    value={timeFilter}
                                    onChange={(e) => setTimeFilter(e.target.value)}
                                >
                                    <option value="all" className="bg-black">All Bookings</option>
                                    <option value="today" className="bg-black">Today</option>
                                    <option value="tomorrow" className="bg-black">Tomorrow</option>
                                    <option value="future" className="bg-black">Upcoming</option>
                                </select>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-white/5">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Player & Team</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Contact</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Venue & Sport</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Date & Slot</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Status</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest h-12 text-right">Payment</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBookings.map((booking) => (
                                        <TableRow key={booking.id} className="border-white/5 hover:bg-white/5">
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black tracking-tight text-foreground leading-none">{booking.playerName}</p>
                                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{booking.teamName}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs font-mono font-bold text-muted-foreground">{booking.phone}</TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-foreground leading-none">{booking.turfName}</p>
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase">{booking.sport}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-foreground leading-none">{format(new Date(booking.date), "MMM d, yyyy")}</p>
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase">{booking.slot.label.split('–')[0]}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "text-[9px] font-black px-2 uppercase",
                                                    booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        booking.status === 'cancelled' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'
                                                )}>
                                                    {booking.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="space-y-1 text-right">
                                                    <p className="text-sm font-black text-primary leading-none">₹{booking.amount}</p>
                                                    <p className={cn(
                                                        "text-[9px] font-black uppercase",
                                                        booking.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-rose-500'
                                                    )}>{booking.paymentStatus}</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {bookings.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48 text-center">
                                                <History className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                                                <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">No booking records found</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="venues" className="animate-in fade-in slide-in-from-bottom-2">
                    <div className="space-y-8">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Venue Management</h2>
                                <p className="text-xs text-muted-foreground">Manage active turfs and availability</p>
                            </div>
                            <Button variant="hero" onClick={() => { setIsAdding(true); setEditingVenue({}); }} className="shadow-neon-purple">
                                <Plus className="mr-2 h-4 w-4" /> Register New Venue
                            </Button>
                        </div>

                        <AnimatePresence>
                            {isAdding && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="glass-card border-primary/40 p-6 rounded-2xl mb-8 space-y-4"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-primary">{editingVenue?.id ? "Edit Venue Configuration" : "New Venue Configuration"}</h3>
                                        <Button variant="ghost" size="icon" onClick={() => { setIsAdding(false); setEditingVenue(null); }}><X className="h-4 w-4" /></Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Venue Name</Label>
                                            <Input value={editingVenue?.name || ""} onChange={e => setEditingVenue({ ...editingVenue, name: e.target.value })} className="bg-muted/20" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Sport Category</Label>
                                            <select
                                                className="w-full bg-muted/20 border-white/10 rounded-md h-10 px-3 text-sm font-bold"
                                                value={editingVenue?.sport || ""}
                                                onChange={e => setEditingVenue({ ...editingVenue, sport: e.target.value as any })}
                                            >
                                                <option value="" className="bg-black">Select Sport</option>
                                                <option value="cricket" className="bg-black">Cricket</option>
                                                <option value="football" className="bg-black">Football</option>
                                                <option value="badminton" className="bg-black">Badminton</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Normal Price (₹)</Label>
                                            <Input type="number" value={editingVenue?.normalPrice || ""} onChange={e => setEditingVenue({ ...editingVenue, normalPrice: Number(e.target.value) })} className="bg-muted/20" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Peak Price (₹)</Label>
                                            <Input type="number" value={editingVenue?.peakPrice || ""} onChange={e => setEditingVenue({ ...editingVenue, peakPrice: Number(e.target.value) })} className="bg-muted/20" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Location Tag</Label>
                                            <Input value={editingVenue?.location || ""} onChange={e => setEditingVenue({ ...editingVenue, location: e.target.value })} className="bg-muted/20" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Public Description</Label>
                                        <Textarea value={editingVenue?.description || ""} onChange={e => setEditingVenue({ ...editingVenue, description: e.target.value })} className="bg-muted/20 h-24" />
                                    </div>
                                    <Button className="w-full shadow-neon-purple h-12 uppercase font-black tracking-[0.2em]" onClick={handleAddVenue}>
                                        {editingVenue?.id ? "Update Venue Details" : "Authorize Register"}
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {venues.map((venue) => (
                                <Card key={venue.id} className={cn(
                                    "bg-card/30 border-white/5 hover:border-primary/20 transition-all overflow-hidden group",
                                    !venue.isActive && "opacity-60 grayscale scale-[0.98]"
                                )}>
                                    <CardContent className="p-0 flex h-40">
                                        <div className="relative w-40 overflow-hidden shrink-0 border-r border-white/5">
                                            <img src={`${venue.images[0]}?auto=format&fit=crop&w=300&q=80`} className="h-full w-full object-cover transition-transform group-hover:scale-110" alt="" />
                                            {!venue.isActive && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                    <Ban className="h-8 w-8 text-rose-500" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 p-5 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-lg font-black uppercase text-foreground leading-none">{venue.name}</h3>
                                                        <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">{venue.sport} • {venue.location}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => { setIsAdding(true); setEditingVenue(venue); }}>
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => toggleVenueStatus(venue.id)}>
                                                            <RefreshCw className={cn("h-4 w-4", !venue.isActive && "text-emerald-500")} />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteVenue(venue.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1 text-emerald-500">
                                                        <IndianRupee className="h-3 w-3" />
                                                        <span className="text-sm font-black tracking-tighter">{venue.normalPrice}</span>
                                                        <span className="text-[8px] font-bold uppercase">Normal</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-rose-500">
                                                        <IndianRupee className="h-3 w-3" />
                                                        <span className="text-sm font-black tracking-tighter">{venue.peakPrice}</span>
                                                        <span className="text-[8px] font-bold uppercase">Peak</span>
                                                    </div>
                                                </div>
                                                <Badge className={cn(
                                                    "text-[8px] font-black uppercase px-2 py-0.5",
                                                    venue.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                                )}>
                                                    {venue.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="pricing" className="animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Price Management</h2>
                                <p className="text-xs text-muted-foreground">Global rules for slot premiums based on time types</p>
                            </div>
                            <Card className="glass-card border-white/5">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <CreditCard className="h-4 w-4 text-primary" />
                                        </div>
                                        <CardTitle className="text-sm font-black uppercase tracking-widest">Pricing Rules Engine</CardTitle>
                                    </div>
                                    <CardDescription className="text-xs">Update values to apply across all venues immediately</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {slots.map((slot, i) => (
                                        <div key={slot.start} className="space-y-2 pt-4 border-t border-white/5 first:pt-0 first:border-0">
                                            <div className="flex justify-between items-center bg-muted/20 px-3 py-2 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Clock className="h-4 w-4 text-primary" />
                                                    <span className="text-xs font-black uppercase tracking-tight">{slot.label}</span>
                                                </div>
                                                <Badge 
                                                    onClick={() => toggleSlotType(i)}
                                                    className={cn(
                                                        "px-2 py-0.5 uppercase text-[9px] font-black cursor-pointer hover:scale-105 transition-transform",
                                                        slot.type === 'peak' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    )}
                                                >
                                                    {slot.type}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 pl-7">
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Current Premium</Label>
                                                    <div className="relative group/price">
                                                        <IndianRupee className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-primary" />
                                                        <Input
                                                            type="number"
                                                            defaultValue={slot.priceModifier}
                                                            onBlur={(e) => handleUpdatePrice(i, Number(e.target.value))}
                                                            className="h-9 pl-9 text-xs font-bold bg-muted/10 border-white/10 focus:border-primary/40 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-end pb-1">
                                                    <p className="text-[9px] text-muted-foreground leading-tight italic">
                                                        Rules: Updates only affect new booking calls.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6 pt-12">
                            <div className="glass-card border-primary/20 p-8 rounded-2xl relative overflow-hidden group">
                                <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4">Pricing Strategy Matrix</h4>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-foreground uppercase tracking-tight">Per-Venue Control</p>
                                            <p className="text-[11px] text-muted-foreground mt-1">Base prices are defined in the Venues tab for each turf individually.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                                            <Ban className="h-4 w-4 text-rose-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-foreground uppercase tracking-tight">Slot Based Premiums</p>
                                            <p className="text-[11px] text-muted-foreground mt-1">Time slots (Morning/Peak) apply the same premium across all venues for consistency.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 p-4 rounded-xl bg-muted/20 border border-white/5">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-2">Policy Note</p>
                                    <p className="text-[11px] font-bold text-foreground leading-relaxed italic">
                                        "All price changes are logged in the audit trail. Deleting a venue deactivates it, ensuring that past financial records remain accurate."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminDashboard;
