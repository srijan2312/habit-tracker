import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "./pages/Landing";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import NotFound from "./pages/NotFound";
import MonthlyTracker from "./pages/MonthlyTracker";

const queryClient = new QueryClient();

// Redirect authenticated users away from auth pages
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AuthRoute><Landing /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><SignUp /></AuthRoute>} />
      <Route path="/signin" element={<AuthRoute><SignIn /></AuthRoute>} />
      <Route path="/forgot-password" element={<AuthRoute><ForgotPassword onBack={() => window.history.back()} /></AuthRoute>} />
      {/* Allow reset-password for all users, not wrapped in AuthRoute */}
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/monthly-tracker" element={<ProtectedRoute><MonthlyTracker /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
