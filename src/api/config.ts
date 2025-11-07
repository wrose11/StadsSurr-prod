// src/api/config.ts
console.log("API base:", import.meta.env.VITE_API_BASE);
const rawBase = import.meta.env.VITE_API_BASE || "";
const BASE = rawBase.replace(/\/+$/, ""); // remove trailing slashes

export async function apiFetch(path: string, options: RequestInit = {}) {
  const p = `/${String(path || "").replace(/^\/+/, "")}`; // ensure single leading slash
  const url = `${BASE}${p}`;
  
  // Get JWT token from localStorage
  const token = localStorage.getItem("auth_token");
  
  // Build headers with Authorization if token exists
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // Always include credentials for cross-site cookie support
  return fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });
}