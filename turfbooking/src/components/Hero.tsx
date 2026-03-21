import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-turf.jpg";

const Hero = () => {
    return (
        <section className="relative w-full min-h-[85vh] flex items-center overflow-hidden">
            {/* Global background handles the turf image and gradient */}
            <div className="absolute inset-0 z-0 bg-transparent" />

            <div className="container relative z-10 px-4 md:px-6">
                <div className="max-w-3xl space-y-8">
                    {/* Status Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                            </span>
                            <span className="text-xs font-medium tracking-wide uppercase text-foreground/80">
                                Live Slot Availability
                            </span>
                        </div>
                    </motion.div>

                    {/* Main Hero Text */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="space-y-4"
                    >
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] text-left">
                            Book Your <span className="text-primary italic">Turf</span> <br />
                            in Seconds
                        </h1>

                        {/* Subtitle Text */}
                        <p className="max-w-xl text-lg md:text-xl text-muted-foreground text-left leading-relaxed">
                            Cricket, Football, or Badminton — find and book the best turfs near you
                            with real-time availability and instant confirmation.
                        </p>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-wrap items-center gap-4"
                    >
                        <Link to="/book">
                            <Button
                                size="lg"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 py-7 rounded-lg text-lg shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                            >
                                Book Now
                            </Button>
                        </Link>
                        <Link to="/book">
                            <Button
                                variant="outline"
                                size="lg"
                                className="border-2 border-foreground/20 bg-transparent text-foreground font-bold px-10 py-7 rounded-lg text-lg hover:bg-white/5 transition-all hover:scale-105 active:scale-95"
                            >
                                Explore Venues
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Responsive adjustments for background - subtle pulse/glow for night stadium look */}
            <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        </section>
    );
};

export default Hero;
