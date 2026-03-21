import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldAlert, ShieldCheck, Lock, User } from "lucide-react";
import { motion } from "framer-motion";

const AdminLogin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { adminLogin, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            await adminLogin(username, password);
            navigate("/admin");
        } catch (err: any) {
            setError("Invalid admin credentials");
        }
    };

    return (
        <div className="container min-h-[80vh] flex items-center justify-center py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <Card className="border-primary/20 bg-background/50 backdrop-blur-xl shadow-neon neon-border overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-accent" />
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                            <ShieldCheck className="h-8 w-8 text-primary shadow-neon" />
                        </div>
                        <CardTitle className="text-3xl font-black uppercase tracking-tighter glow-text">Admin Portal</CardTitle>
                        <CardDescription className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest pt-1">
                            restricted access • authorization required
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">Admin ID</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                                        <Input
                                            id="username"
                                            placeholder="Username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="pl-10 bg-muted/30 border-primary/10 focus:border-primary/40 h-12"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">Access Key</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 bg-muted/30 border-primary/10 focus:border-primary/40 h-12"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg flex items-center gap-2 text-destructive text-sm font-bold"
                                >
                                    <ShieldAlert className="h-4 w-4 shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            <Button
                                type="submit"
                                variant="hero"
                                className="w-full h-14 text-base font-black uppercase tracking-widest shadow-neon-purple mt-2"
                                disabled={isLoading}
                            >
                                {isLoading ? "Validating..." : "Execute Login"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
