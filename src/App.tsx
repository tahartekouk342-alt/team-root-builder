import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ORGANIZER_BASE } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

import OrganizerDashboard from "./pages/OrganizerDashboard";
import OrganizerTournamentsList from "./pages/OrganizerTournamentsList";
import OrganizerMatches from "./pages/OrganizerMatches";
import OrganizerTeams from "./pages/OrganizerTeams";
import OrganizerSettings from "./pages/OrganizerSettings";
import TournamentDetails from "./pages/TournamentDetails";
import CreateTournamentWizard from "./pages/CreateTournamentWizard";
import PublicJoin from "./pages/PublicJoin";
import OrganizerStats from "./pages/OrganizerStats";
import { OrganizerLayout } from "./components/organizer/OrganizerLayout";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="bottola-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RequireAuth><OrganizerLayout><OrganizerDashboard /></OrganizerLayout></RequireAuth>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/join/:id" element={<PublicJoin />} />
            <Route path="/j/:code" element={<PublicJoin />} />

            <Route path={ORGANIZER_BASE} element={<Navigate to="/" replace />} />
            <Route path={`${ORGANIZER_BASE}/auth`} element={<Navigate to="/auth" replace />} />
            <Route path={`${ORGANIZER_BASE}/dashboard`} element={<RequireAuth><OrganizerLayout><OrganizerDashboard /></OrganizerLayout></RequireAuth>} />
            <Route path={`${ORGANIZER_BASE}/tournaments`} element={<RequireAuth><OrganizerLayout><OrganizerTournamentsList /></OrganizerLayout></RequireAuth>} />
            <Route path={`${ORGANIZER_BASE}/tournaments/new`} element={<RequireAuth><OrganizerLayout><CreateTournamentWizard /></OrganizerLayout></RequireAuth>} />
            <Route path={`${ORGANIZER_BASE}/matches`} element={<RequireAuth><OrganizerLayout><OrganizerMatches /></OrganizerLayout></RequireAuth>} />
            <Route path={`${ORGANIZER_BASE}/teams`} element={<RequireAuth><OrganizerLayout><OrganizerTeams /></OrganizerLayout></RequireAuth>} />
            <Route path={`${ORGANIZER_BASE}/settings`} element={<RequireAuth><OrganizerLayout><OrganizerSettings /></OrganizerLayout></RequireAuth>} />
            <Route path={`${ORGANIZER_BASE}/stats`} element={<RequireAuth><OrganizerLayout><OrganizerStats /></OrganizerLayout></RequireAuth>} />
            <Route path={`${ORGANIZER_BASE}/tournament/:id`} element={<RequireAuth><OrganizerLayout><TournamentDetails /></OrganizerLayout></RequireAuth>} />

            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/tournaments-feed" element={<Navigate to="/" replace />} />
            <Route path="/following" element={<Navigate to="/" replace />} />
            <Route path="/notifications" element={<Navigate to="/" replace />} />
            <Route path="/news-feed" element={<Navigate to="/" replace />} />
            <Route path="/settings" element={<Navigate to={`${ORGANIZER_BASE}/settings`} replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
