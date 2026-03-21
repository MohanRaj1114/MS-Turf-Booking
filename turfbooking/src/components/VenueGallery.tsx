import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VenueGalleryProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[];
    venueName: string;
}

export const VenueGallery = ({ isOpen, onClose, images, venueName }: VenueGalleryProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (!images || images.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-primary/20">
                <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent">
                    <DialogTitle className="text-white font-display text-xl">{venueName} - Gallery</DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4 text-white hover:bg-white/20"
                        onClick={onClose}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </DialogHeader>

                <div className="relative aspect-video flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={currentIndex}
                            src={`${images[currentIndex]}?auto=format&fit=crop&w=1200&q=80`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.3 }}
                            className="w-full h-full object-cover"
                            alt={`${venueName} view ${currentIndex + 1}`}
                        />
                    </AnimatePresence>

                    {images.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 rounded-full"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    prevImage();
                                }}
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 rounded-full"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    nextImage();
                                }}
                            >
                                <ChevronRight className="h-8 w-8" />
                            </Button>
                        </>
                    )}

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 w-6 rounded-full transition-all duration-300 ${idx === currentIndex ? "bg-primary shadow-neon" : "bg-white/30"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
