const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/$/, "");

if (!import.meta.env.VITE_API_BASE_URL && window.location.hostname !== 'localhost') {
    console.warn("⚠️ VITE_API_BASE_URL is missing. Falling back to current origin:", window.location.origin);
}

export const getApiUrl = (path: string) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
};
