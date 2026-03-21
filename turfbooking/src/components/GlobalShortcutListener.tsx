import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const GlobalShortcutListener = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Prevent shortcut if user is typing in an input, textarea, or contentEditable element
            const activeElement = document.activeElement;
            const isTyping =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement ||
                (activeElement instanceof HTMLElement && activeElement.isContentEditable);

            if (isTyping) return;

            // Check for Ctrl + S or Ctrl + Alt + A (Admin Login)
            const isCtrlS = event.ctrlKey && event.key.toLowerCase() === "s";
            const isCtrlAltA = event.ctrlKey && event.altKey && event.key.toLowerCase() === "a";

            if (isCtrlS || isCtrlAltA) {
                event.preventDefault();
                navigate("/admin/login");
                return;
            }

            // Check for Ctrl + M (User Dashboard / Home)
            const isCtrlM = event.ctrlKey && event.key.toLowerCase() === "m";

            if (isCtrlM) {
                event.preventDefault();
                if (isAuthenticated) {
                    navigate("/");
                } else {
                    navigate("/auth");
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [navigate, isAuthenticated]);

    return null;
};
