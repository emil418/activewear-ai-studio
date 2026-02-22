import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import MotionAlive from "./pages/modules/MotionAlive";
import AthleteID from "./pages/modules/AthleteID";
import DynamicVTO from "./pages/modules/DynamicVTO";
import FitEvolve from "./pages/modules/FitEvolve";
import CollectionForge from "./pages/modules/CollectionForge";
import CampaignFlow from "./pages/modules/CampaignFlow";
import LogoPlacement from "./pages/modules/LogoPlacement";
import Library from "./pages/Library";
import Analytics from "./pages/Analytics";
import Team from "./pages/Team";
import Billing from "./pages/Billing";
import BrandSettings from "./pages/BrandSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="motion-alive" element={<MotionAlive />} />
            <Route path="athlete-id" element={<AthleteID />} />
            <Route path="dynamic-vto" element={<DynamicVTO />} />
            <Route path="fit-evolve" element={<FitEvolve />} />
            <Route path="collection-forge" element={<CollectionForge />} />
            <Route path="campaign-flow" element={<CampaignFlow />} />
            <Route path="logo-placement" element={<LogoPlacement />} />
            <Route path="library" element={<Library />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="team" element={<Team />} />
            <Route path="billing" element={<Billing />} />
            <Route path="settings" element={<BrandSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
