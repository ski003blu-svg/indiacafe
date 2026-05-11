/**
 * Returns the full URL for an API path.
 *
 * - Development: path is relative (e.g. "/api/orders") — Vite proxies it to port 8080.
 * - Production:  VITE_API_BASE_URL is prepended (e.g. "https://api.indiacafe.com").
 *
 * Usage:
 *   fetch(apiUrl("/api/orders/by-email?email=..."))
 */
const _base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

export function apiUrl(path: string): string {
  return _base + path;
}
