import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import DashboardPage from "@/pages/Dashboard";
import ProjectsPage from "@/pages/Projects";
import ProjectDetailPage from "@/pages/ProjectDetail";
import ClientDetailPage from "@/pages/ClientDetail";
import InvoicesPage from "@/pages/Invoices";
import AISubscriptionsPage from "@/pages/AISubscriptions";
import EmailAccountsPage from "@/pages/EmailAccounts";
import SettingsPage from "@/pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const router = createBrowserRouter(
  [
    {
      element: <AppShell />,
      children: [
        { path: "/", element: <DashboardPage /> },
        { path: "/projects", element: <ProjectsPage /> },
        { path: "/projects/:projectId", element: <ProjectDetailPage /> },
        { path: "/clients/:clientId", element: <ClientDetailPage /> },
        { path: "/invoices", element: <InvoicesPage /> },
        { path: "/ai-subscriptions", element: <AISubscriptionsPage /> },
        { path: "/email-accounts", element: <EmailAccountsPage /> },
        { path: "/settings", element: <SettingsPage /> },
      ],
    },
    { path: "*", element: <NotFound /> },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
