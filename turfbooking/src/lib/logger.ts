export type LogAction =
    | "booking_created"
    | "booking_cancelled"
    | "venue_added"
    | "venue_updated"
    | "venue_deleted"
    | "price_updated"
    | "slot_type_changed"
    | "admin_login"
    | "admin_logout";

export interface SystemLog {
    id: string;
    action: LogAction;
    details: string;
    timestamp: string;
    performedBy: string;
}

export const logAction = (action: LogAction, details: string, performedBy: string = "system") => {
    const logs: SystemLog[] = JSON.parse(localStorage.getItem("system_logs") || "[]");
    const newLog: SystemLog = {
        id: `log_${Date.now()}`,
        action,
        details,
        timestamp: new Date().toISOString(),
        performedBy,
    };
    localStorage.setItem("system_logs", JSON.stringify([newLog, ...logs].slice(0, 500))); // Keep last 500
};

export const getLogs = (): SystemLog[] => {
    return JSON.parse(localStorage.getItem("system_logs") || "[]");
};
