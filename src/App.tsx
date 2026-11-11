import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import Admin from "@/pages/Admin";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "./pages/NotFound";
import FixFlipCalculatorPage from "@/fix-flip/FixFlipCalculatorPage";
import FixFlipDealsPage from "@/fix-flip/FixFlipDealsPage";
import FixFlipProjectManagerHub from "@/fix-flip/FixFlipProjectManagerHub";
import FixFlipProjectManagerPage from "@/fix-flip/FixFlipProjectManagerPage";
import Financing from "@/pages/Financing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/properties" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/calculator" element={<FixFlipCalculatorPage />} />
              <Route path="/deals" element={<FixFlipDealsPage />} />
              <Route path="/project-manager" element={<FixFlipProjectManagerHub />} />
              <Route path="/project-manager/:dealId" element={<FixFlipProjectManagerPage />} />
              <Route path="/financing" element={<Financing />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
