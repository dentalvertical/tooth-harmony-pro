import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/features/auth/store";

// Feature pages
const LoginPage       = lazy(() => import("@/features/auth/components/LoginPage"));
const DashboardPage   = lazy(() => import("@/features/dashboard/components/DashboardPage"));
const PatientsPage    = lazy(() => import("@/features/patients/components/PatientsPage"));
const DentalChartPage = lazy(() => import("@/features/dental-chart/components/DentalChartPage"));
const CalendarPage    = lazy(() => import("@/features/appointments/components/CalendarPage"));
const FinancesPage    = lazy(() => import("@/features/finances/components/FinancesPage"));
const SettingsPage    = lazy(() => import("@/features/settings/components/SettingsPage"));
const NotFound        = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Завантаження...</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/patients" element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
          <Route path="/dental-chart" element={<ProtectedRoute><DentalChartPage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/finances" element={<ProtectedRoute><FinancesPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
