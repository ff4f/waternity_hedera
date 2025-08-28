import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import AgentDashboard from './pages/agent-dashboard';
import OperatorDashboard from './pages/operator-dashboard';
import LandingPage from './pages/landing-page';
import InvestorDashboard from './pages/investor-dashboard';
import WellDetailView from './pages/well-detail-view';
import AuditPage from './pages/audit';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/agent-dashboard" element={<AgentDashboard />} />
        <Route path="/operator-dashboard" element={<OperatorDashboard />} />
        <Route path="/landing-page" element={<LandingPage />} />
        <Route path="/investor-dashboard" element={<InvestorDashboard />} />
        <Route path="/well-detail-view" element={<WellDetailView />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;