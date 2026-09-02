import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  // false: auth cross-origin (GitHub Pages) memakai Bearer header dari localStorage;
  // same-origin (preview Emergent) tetap mengirim cookie secara default.
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("session_token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export const fmtIDR = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0);

export const fmtDate = (s) => {
  if (!s) return "-";
  try {
    return new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return s; }
};
