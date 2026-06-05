import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ORGANIZER_BASE } from "@/lib/constants";

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

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="bottola-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<OrganizerLayout><OrganizerDashboard /></OrganizerLayout>} />
            <Route path="/auth" element={<Navigate to="/" replace />} />

            <Route path="/join/:id" element={<PublicJoin />} />
            <Route path="/j/:code" element={<PublicJoin />} />

            <Route path={ORGANIZER_BASE} element={<Navigate to="/" replace />} />
            <Route path={`${ORGANIZER_BASE}/auth`} element={<Navigate to="/" replace />} />
            <Route path={`${ORGANIZER_BASE}/dashboard`} element={<OrganizerLayout><OrganizerDashboard /></OrganizerLayout>} />
            <Route path={`${ORGANIZER_BASE}/tournaments`} element={<OrganizerLayout><OrganizerTournamentsList /></OrganizerLayout>} />
            <Route path={`${ORGANIZER_BASE}/tournaments/new`} element={<OrganizerLayout><CreateTournamentWizard /></OrganizerLayout>} />
            <Route path={`${ORGANIZER_BASE}/matches`} element={<OrganizerLayout><OrganizerMatches /></OrganizerLayout>} />
            <Route path={`${ORGANIZER_BASE}/teams`} element={<OrganizerLayout><OrganizerTeams /></OrganizerLayout>} />
            <Route path={`${ORGANIZER_BASE}/settings`} element={<OrganizerLayout><OrganizerSettings /></OrganizerLayout>} />
            <Route path={`${ORGANIZER_BASE}/stats`} element={<OrganizerLayout><OrganizerStats /></OrganizerLayout>} />
            <Route path={`${ORGANIZER_BASE}/tournament/:id`} element={<OrganizerLayout><TournamentDetails /></OrganizerLayout>} />

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
