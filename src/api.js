const IS_LOCAL_HOST =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const DEFAULT_API_BASE_URL = IS_LOCAL_HOST
  ? "http://127.0.0.1:8001"
  : "https://habit-backend-v3gv.onrender.com";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

export function apiUrl(path) {
  return `${API_BASE_URL}/${String(path).replace(/^\/+/, "")}`;
}
