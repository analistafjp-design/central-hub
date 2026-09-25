import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ConfiguracaoPendente from "./pages/ConfiguracaoPendente";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { setupAutoUpdate } from "./pwa";
import "./index.css";

setupAutoUpdate();

function Root() {
  if (!isSupabaseConfigured) {
    return <ConfiguracaoPendente />;
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          <App />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
