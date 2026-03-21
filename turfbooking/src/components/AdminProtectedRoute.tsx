import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin shadow-neon" />
            </div>
        );
    }

    if (!isAuthenticated || user?.role !== "admin") {
        return <Navigate to="/admin/login" replace />;
    }

    return <>{children}</>;
};
