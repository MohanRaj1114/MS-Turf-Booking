import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Book Now", path: "/book" },
    { label: "My Bookings", path: "/bookings" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 glass">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="MS Turf Book Logo"
            className="h-10 w-10 object-contain drop-shadow-lg"
          />
          <span className="font-display text-xl font-bold text-foreground">
            MS Turf Book
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={location.pathname === item.path ? "default" : "ghost"}
                size="sm"
                className={location.pathname === item.path ? "shadow-neon" : ""}
              >
                {item.label}
              </Button>
            </Link>
          ))}
          {!isAuthenticated ? (
            <>
              <Link to="/auth">
                <Button variant="link" size="sm" className="text-foreground hover:text-primary transition-colors">
                  Log In
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="ml-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
                  Sign Up
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4 ml-2">
              <span className="text-sm font-medium text-muted-foreground hidden lg:inline-block">
                Hi, {user?.name.split(' ')[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={logout} className="hover:text-destructive">
                Logout
              </Button>
              <Link to="/book">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
                  Book Now
                </Button>
              </Link>
            </div>
          )}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </Button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-primary/10 glass md:hidden"
          >
            <div className="container flex flex-col gap-2 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                >
                  <Button
                    variant={location.pathname === item.path ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
              {!isAuthenticated ? (
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    Sign In
                  </Button>
                </Link>
              ) : (
                <>
                  <div className="px-4 py-2 border-b border-primary/10">
                    <p className="text-sm font-medium text-foreground">Hi, {user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive"
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              )}
              <Link to="/book" onClick={() => setMobileOpen(false)}>
                <Button variant="accent" className="w-full shadow-neon-purple">
                  Book a Slot
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
