import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA with auto-update
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // Check for updates every 60 seconds
      setInterval(() => reg.update(), 60 * 1000);
    }).catch((err) => {
      console.log("SW registration failed:", err);
    });
  });

  // Listen for SW update messages and reload
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "SW_UPDATED") {
      window.location.reload();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
