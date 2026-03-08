import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { API_URL } from "@/config/api";
import { Suspense, lazy, useEffect } from "react";
import { Loader2 } from "lucide-react";

import Landing from "./pages/Landing";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MonthlyTracker = lazy(() => import("./pages/MonthlyTracker"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const JoinChallenge = lazy(() => import("./pages/JoinChallenge"));
const InvitePage = lazy(() => import("./pages/InvitePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const JournalPage = lazy(() => import("./pages/JournalPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const Feedback = lazy(() => import("./pages/Feedback"));

const queryClient = new QueryClient();

// Redirect authenticated users away from auth pages
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Don't redirect if user is in password reset mode
  if (sessionStorage.getItem('in_password_reset') === 'true') {
    return <>{children}</>;
  }
  
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const pageLoader = (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  return (
    <Suspense fallback={pageLoader}>
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
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/invite" element={<ProtectedRoute><InvitePage /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
        <Route path="/join/:code" element={<ProtectedRoute><JoinChallenge /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => {
  useEffect(() => {
    const controller = new AbortController();

    const warmUp = async () => {
      try {
        await fetch(`${API_URL}/`, { signal: controller.signal });
      } catch {
        // Ignore warm-up errors
      }
    };

    warmUp();
    return () => controller.abort();
  }, []);

  return (
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
};

export default App;
