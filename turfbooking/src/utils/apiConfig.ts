const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://ms-turf-booking-ehnj.vercel.app";

export const getApiUrl = (path: string) => {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
};
