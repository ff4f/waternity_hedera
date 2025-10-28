import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "components/pages/NotFound";
import AgentDashboard from './components/pages/agent-dashboard';
import OperatorDashboard from './components/pages/operator-dashboard';
import LandingPage from './components/pages/landing-page';
import InvestorDashboard from './components/pages/investor-dashboard';
import WellDetailView from './components/pages/well-detail-view';
import AuditPage from './components/pages/audit';
import DemoPage from './pages/demo';
import ApiDocsPage from './pages/api-docs';

const Routes = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Loading...</div>;
  }

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
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/api/docs" element={<ApiDocsPage />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;