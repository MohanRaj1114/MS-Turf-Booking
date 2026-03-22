import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { getApiUrl } from "@/utils/apiConfig";


interface User {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role?: "user" | "admin";
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    adminLogin: (username: string, password: string) => Promise<void>;
    signup: (data: SignupData) => Promise<void>;
    sendOTP: (mobile: string) => Promise<boolean>;
    verifyOTP: (mobile: string, otp: string) => Promise<boolean>;
    logout: () => void;
}

interface SignupData {
    name: string;
    email: string;
    mobile: string;
    password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem("auth_user");
        const token = localStorage.getItem("auth_token");

        if (savedUser && token) {
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/users/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            setUser(data.user);
            localStorage.setItem("auth_user", JSON.stringify(data.user));
            localStorage.setItem("auth_token", "api_token_" + Date.now());
            toast.success("Successfully logged in!");
        } catch (error: any) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const adminLogin = async (username: string, password: string) => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (username === "mohan" && password === "Mohan140806") {
            const adminData: User = {
                id: "admin-1",
                name: "Mohan Raj",
                email: "admin@msturfbook.com",
                mobile: "7904095892",
                role: "admin",
            };
            setUser(adminData);
            localStorage.setItem("auth_user", JSON.stringify(adminData));
            localStorage.setItem("auth_token", "admin_sectet_" + Date.now());
            toast.success("Admin access granted!");
        } else {
            throw new Error("Invalid admin credentials");
        }
        setIsLoading(false);
    };

    const signup = async (data: SignupData) => {
        setIsLoading(true);
        try {
            const res = await fetch(getApiUrl('/api/users'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const resData = await res.json();

            if (!res.ok) {
                let errorMessage = resData.error || 'Registration failed';
                if (errorMessage.includes('duplicate key value violates unique constraint "users_email_key"')) {
                    errorMessage = "Email already registered.";
                }
                throw new Error(errorMessage);
            }

            toast.success("Registration successful! Please login.");
        } catch (error: any) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const sendOTP = async (mobile: string) => {
        try {
            const res = await fetch(getApiUrl('/api/users/send-otp'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success("OTP sent successfully!");
            return true;
        } catch (error: any) {
            toast.error(error.message || "Failed to send OTP");
            return false;
        }
    };

    const verifyOTP = async (mobile: string, otp: string) => {
        try {
            const res = await fetch(getApiUrl('/api/users/verify-otp'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, otp })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success("Mobile OTP verified!");
            return true;
        } catch (error: any) {
            toast.error(error.message || "Invalid Mobile OTP");
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_token");
        toast.info("Logged out successfully.");
        window.location.replace("/");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                adminLogin,
                signup,
                sendOTP,
                verifyOTP,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
