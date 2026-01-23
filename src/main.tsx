import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { registerSW } from "virtual:pwa-register";

registerSW({
  onNeedRefresh() {
    // keep silent; app still works without prompt
  },
  onOfflineReady() {
    // keep silent
  },
});

createRoot(document.getElementById("root")!).render(<App />);
