import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// In production, VITE_API_BASE_URL points to the deployed API server.
// In development it is empty and Vite's proxy handles /api requests.
if (import.meta.env.VITE_API_BASE_URL) {
  setBaseUrl(import.meta.env.VITE_API_BASE_URL);
}

setAuthTokenGetter(() => localStorage.getItem("india_cafe_admin_token"));

createRoot(document.getElementById("root")!).render(<App />);
