import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA with auto-update
if ("serviceWorker" in navigator) {
  let reloadedForVersion = sessionStorage.getItem("ph_sw_reloaded_version");

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`/sw.js?v=${Date.now()}`, { updateViaCache: "none" }).then((reg) => {
      reg.update();
      // Check for updates often so users pick up the latest release quickly
      setInterval(() => reg.update(), 15 * 1000);
    }).catch((err) => {
      console.log("SW registration failed:", err);
    });
  });

  // Listen for SW update messages and reload
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "SW_UPDATED" && reloadedForVersion !== event.data.version) {
      sessionStorage.setItem("ph_sw_reloaded_version", event.data.version);
      reloadedForVersion = event.data.version;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
