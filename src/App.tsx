import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import DashboardPage from "@/pages/Dashboard";
import AccountVaultPage from "@/pages/AccountVault";
import ProjectsPage from "@/pages/Projects";
import ProjectDetailPage from "@/pages/ProjectDetail";
import ClientDetailPage from "@/pages/ClientDetail";
import BillingPage from "@/pages/Billing";
import AISubscriptionsPage from "@/pages/AISubscriptions";
import EmailAccountsPage from "@/pages/EmailAccounts";
import SettingsPage from "@/pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/account-vault" element={<AccountVaultPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/clients/:clientId" element={<ClientDetailPage />} />
            <Route path="/services" element={<BillingPage />} />
            <Route path="/ai-subscriptions" element={<AISubscriptionsPage />} />
            <Route path="/email-accounts" element={<EmailAccountsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
