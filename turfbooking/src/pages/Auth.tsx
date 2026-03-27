import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { Trophy, Target, Dumbbell, Timer, Star, Award, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const FloatingIcon = ({ icon: Icon, delay = 0, x = 0, y = 0 }: { icon: any, delay?: number, x?: number, y?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0.2, 0.5, 0.2],
      scale: [1, 1.2, 1],
      x: [x, x + 20, x],
      y: [y, y - 20, y]
    }}
    transition={{
      duration: 5,
      repeat: Infinity,
      delay,
      ease: "easeInOut"
    }}
    className="absolute text-primary/30 pointer-events-none"
    style={{ left: `${50 + x}%`, top: `${50 + y}%` }}
  >
    <Icon size={48} />
  </motion.div>
);

const passwordValidation = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: passwordValidation,
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  password: passwordValidation.optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
}).refine((data) => {
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

  const Auth = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const { login, signup, adminLogin, sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [signupData, setSignupData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  const from = location.state?.from?.pathname || "/home";

  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: loginErrors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const { register: registerSignup, handleSubmit: handleSubmitSignup, formState: { errors: signupErrors }, trigger: triggerSignup, watch: watchSignup } = useForm({
    resolver: zodResolver(signupSchema),
  });

  const { toast } = useToast();

  const toggleAuth = () => {
    setIsSignIn(!isSignIn);
  };

  const onLogin = async (data: any) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const onSignup = async (data: any) => {
    setLoading(true);
    try {
      if (!isOtpSent) {
        // Step 1: Send Mobile OTP
        const isValid = await triggerSignup(['name', 'email', 'mobile']);
        if (!isValid) return;

        const mobileSuccess = await sendOTP(data.mobile);
        
        if (mobileSuccess) {
          setSignupData(data);
          setIsOtpSent(true);
        }
      } else if (!isOtpVerified) {
        // Step 2: Verify Mobile OTP
        const mobileOk = await verifyOTP(signupData.mobile, otp);

        if (mobileOk) {
          setIsOtpVerified(true);
          toast({
            title: "Verification Complete!",
            description: "Please set your password to finalize your account.",
          });
        }
      } else {
        // Step 3: Final Signup
        const isValid = await triggerSignup(['password', 'confirmPassword']);
        if (!isValid) return;

        await signup({
          name: data.name,
          email: data.email,
          mobile: data.mobile,
          password: data.password,
        });
        setIsSignIn(true);
        // Reset states
        setIsOtpSent(false);
        setIsOtpVerified(false);
        setOtp("");
      }
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-transparent py-12 px-4 sm:px-6 lg:px-8">
      {/* Sports Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <FloatingIcon icon={Trophy} delay={0} x={-40} y={-30} />
        <FloatingIcon icon={Target} delay={1} x={35} y={-25} />
        <FloatingIcon icon={Dumbbell} delay={2} x={-30} y={30} />
        <FloatingIcon icon={Timer} delay={1.5} x={40} y={35} />
        <FloatingIcon icon={Star} delay={0.5} x={0} y={-45} />
        <FloatingIcon icon={Award} delay={2.5} x={-45} y={10} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="perspective-1000">
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignIn ? "signin" : "signup"}
              initial={{ rotateY: isSignIn ? -90 : 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: isSignIn ? 90 : -90, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <Card className="glass-card border-primary/20 shadow-neon">
                <CardHeader className="space-y-1">
                  <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shadow-neon">
                      <Trophy className="h-8 w-8 text-primary animate-float" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-center tracking-tight">
                    {isSignIn ? "Sign In to MS Turf Book" : "Create an Account"}
                  </CardTitle>
                  <CardDescription className="text-center">
                    {isSignIn
                      ? "Enter your credentials to manage your bookings"
                      : "Join our community of sports enthusiasts"}
                  </CardDescription>
                </CardHeader>

                {isSignIn ? (
                  <form onSubmit={handleSubmitLogin(onLogin)}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="m@example.com"
                          {...registerLogin("email")}
                          className={`bg-background/50 ${loginErrors.email ? 'border-destructive' : ''}`}
                        />
                        {loginErrors.email && <p className="text-xs text-destructive">{(loginErrors.email as any).message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            {...registerLogin("password")}
                            className={`bg-background/50 pr-10 ${loginErrors.password ? 'border-destructive' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {loginErrors.password && <p className="text-xs text-destructive">{(loginErrors.password as any).message}</p>}
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                      <Button type="submit" disabled={loading} className="w-full shadow-neon font-semibold text-base py-6">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
                      </Button>
                      <div className="text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <button type="button" onClick={toggleAuth} className="text-primary font-semibold hover:underline transition-all">
                          Create New Account
                        </button>
                      </div>
                    </CardFooter>
                  </form>
                ) : (
                  <form onSubmit={handleSubmitSignup(onSignup)}>
                    <CardContent className="space-y-4 py-2">
                      <div className="space-y-1">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <Input
                          id="signup-name"
                          placeholder="John Doe"
                          {...registerSignup("name")}
                          disabled={isOtpSent}
                          className={`bg-background/50 ${signupErrors.name ? 'border-destructive' : ''}`}
                        />
                        {signupErrors.name && <p className="text-[10px] text-destructive">{(signupErrors.name as any).message}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="johndoe@example.com"
                          {...registerSignup("email")}
                          disabled={isOtpSent}
                          className={`bg-background/50 ${signupErrors.email ? 'border-destructive' : ''}`}
                        />
                        {signupErrors.email && <p className="text-[10px] text-destructive">{(signupErrors.email as any).message}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="signup-mobile">Mobile Number</Label>
                        <Input
                          id="signup-mobile"
                          placeholder="9876543210"
                          {...registerSignup("mobile")}
                          disabled={isOtpSent}
                          className={`bg-background/50 ${signupErrors.mobile ? 'border-destructive' : ''}`}
                        />
                        {signupErrors.mobile && <p className="text-[10px] text-destructive">{(signupErrors.mobile as any).message}</p>}
                      </div>

                      {isOtpSent && !isOtpVerified && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4 py-4 border-y border-primary/10 my-4"
                        >
                          <div className="space-y-3 flex flex-col items-center">
                            <Label htmlFor="mobile-otp" className="text-xs self-start">Mobile OTP (Sent to {signupData?.mobile})</Label>
                            <InputOTP
                              maxLength={6}
                              value={otp}
                              onChange={(value) => setOtp(value)}
                              className="gap-2"
                            >
                              <InputOTPGroup className="gap-2">
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                  <InputOTPSlot
                                    key={index}
                                    index={index}
                                    className="bg-background/50 border-primary/20 w-12 h-14 text-xl shadow-neon transition-all focus:ring-primary/50"
                                  />
                                ))}
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                          <Button 
                            variant="link" 
                            type="button"
                            onClick={() => { setIsOtpSent(false); setIsOtpVerified(false); }} 
                            className="text-primary text-[10px] h-auto p-0"
                          >
                            Edit details or Change Number?
                          </Button>
                        </motion.div>
                      )}

                      {isOtpVerified && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-2 gap-3 pt-2"
                        >
                          <div className="space-y-1">
                            <Label htmlFor="signup-password">Password</Label>
                            <div className="relative">
                              <Input
                                id="signup-password"
                                type={showPassword ? "text" : "password"}
                                {...registerSignup("password")}
                                className={`bg-background/50 pr-8 ${signupErrors.password ? 'border-destructive' : ''}`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                            {signupErrors.password && <p className="text-[10px] text-destructive">{(signupErrors.password as any).message}</p>}
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="signup-confirm">Confirm</Label>
                            <div className="relative">
                              <Input
                                id="signup-confirm"
                                type={showConfirmPassword ? "text" : "password"}
                                {...registerSignup("confirmPassword")}
                                className={`bg-background/50 pr-8 ${signupErrors.confirmPassword ? 'border-destructive' : ''}`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                              >
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                            {signupErrors.confirmPassword && <p className="text-[10px] text-destructive">{(signupErrors.confirmPassword as any).message}</p>}
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                      <Button type="submit" disabled={loading} className="w-full shadow-neon font-semibold text-base py-6">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                          (!isOtpSent ? "Send OTP" : (!isOtpVerified ? "Verify OTP" : "Final Sign Up"))
                        }
                      </Button>
                      <div className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <button type="button" onClick={() => { toggleAuth(); setIsOtpSent(false); setIsOtpVerified(false); }} className="text-primary font-semibold hover:underline transition-all">
                          Sign In
                        </button>
                      </div>
                    </CardFooter>
                  </form>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Auth;
