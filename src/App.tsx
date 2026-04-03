import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { InfluencerModeProvider } from "@/hooks/useInfluencerMode";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import Create from "./pages/Create";
import Library from "./pages/Library";
import Billing from "./pages/Billing";
import BrandSettings from "./pages/BrandSettings";
import AthleteLibrary from "./pages/AthleteLibrary";
import GarmentLibrary from "./pages/GarmentLibrary";
import EnvironmentLibrary from "./pages/EnvironmentLibrary";
import Templates from "./pages/Templates";
import CampaignPack from "./pages/CampaignPack";
import History from "./pages/History";
import AdminPanel from "./pages/AdminPanel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <InfluencerModeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<DashboardHome />} />
                <Route path="create" element={<Create />} />
                <Route path="library" element={<Library />} />
                <Route path="athletes" element={<AthleteLibrary />} />
                <Route path="garments" element={<GarmentLibrary />} />
                <Route path="environments" element={<EnvironmentLibrary />} />
                <Route path="templates" element={<Templates />} />
                <Route path="campaigns" element={<CampaignPack />} />
                <Route path="history" element={<History />} />
                <Route path="billing" element={<Billing />} />
                <Route path="settings" element={<BrandSettings />} />
                <Route path="admin" element={<AdminPanel />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </InfluencerModeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
