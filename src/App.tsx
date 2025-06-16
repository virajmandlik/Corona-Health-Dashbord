
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import GlobalOverview from "@/pages/GlobalOverview";
import CountryAnalytics from "@/pages/CountryAnalytics";
import LiveTracking from "@/pages/LiveTracking";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <div className="dark">
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/global" element={<GlobalOverview />} />
            <Route path="/analytics" element={<CountryAnalytics />} />
            <Route path="/tracking" element={<LiveTracking />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </QueryClientProvider>
    </div>
  );
}

export default App;
