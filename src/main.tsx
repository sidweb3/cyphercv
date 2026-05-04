import '@rainbow-me/rainbowkit/styles.css';
import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '@/lib/wagmi';
import "./index.css";
import "./types/global.d.ts";

const queryClient = new QueryClient();

const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const CandidatePage = lazy(() => import("./pages/app/CandidatePage.tsx"));
const EmployerPage = lazy(() => import("./pages/app/EmployerPage.tsx"));
const MatchesPage = lazy(() => import("./pages/app/MatchesPage.tsx"));
const ProtocolPage = lazy(() => import("./pages/app/ProtocolPage.tsx"));
const DashboardPage = lazy(() => import("./pages/app/DashboardPage.tsx"));
const WhitepaperPage = lazy(() => import("./pages/app/WhitepaperPage.tsx"));
const AnalyticsPage = lazy(() => import("./pages/app/AnalyticsPage.tsx"));
const ProofExplorerPage = lazy(() => import("./pages/app/ProofExplorerPage.tsx"));
const VaultPage = lazy(() => import("./pages/app/VaultPage.tsx"));
const GovernancePage = lazy(() => import("./pages/app/GovernancePage.tsx"));
const DownloadPage = lazy(() => import("./pages/DownloadPage.tsx"));
const DeploymentGuide = lazy(() => import("./pages/DeploymentGuide.tsx"));
const SDKPage = lazy(() => import("./pages/app/SDKPage.tsx"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="font-mono-cipher text-xs text-muted-foreground animate-pulse">Loading...</div>
    </div>
  );
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VlyToolbar />
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#ff4d00',
            accentColorForeground: '#0a0a0a',
            borderRadius: 'none',
            fontStack: 'system',
          })}
        >
          <InstrumentationProvider>
            <ConvexAuthProvider client={convex}>
              <BrowserRouter>
                <RouteSyncer />
                <Suspense fallback={<RouteLoading />}>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<AuthPage redirectAfterAuth="/" />} />
                    <Route path="/app" element={<DashboardPage />} />
                    <Route path="/app/candidate" element={<CandidatePage />} />
                    <Route path="/app/employer" element={<EmployerPage />} />
                    <Route path="/app/matches" element={<MatchesPage />} />
                    <Route path="/app/protocol" element={<ProtocolPage />} />
                    <Route path="/app/whitepaper" element={<WhitepaperPage />} />
                    <Route path="/app/analytics" element={<AnalyticsPage />} />
                    <Route path="/app/proofs" element={<ProofExplorerPage />} />
                    <Route path="/app/vault" element={<VaultPage />} />
                    <Route path="/app/governance" element={<GovernancePage />} />
                    <Route path="/app/sdk" element={<SDKPage />} />
                    <Route path="/download" element={<DownloadPage />} />
                    <Route path="/deploy" element={<DeploymentGuide />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
              <Toaster />
            </ConvexAuthProvider>
          </InstrumentationProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);