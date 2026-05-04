import { useState } from "react";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { WalletButton } from "@/components/WalletButton";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useAccount, useConnect } from "wagmi";
import {
  User,
  Briefcase,
  Zap,
  Code2,
  ChevronLeft,
  ChevronRight,
  Home,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  BarChart2,
  Key,
  Vote,
  Search,
  Lock,
  Shield,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Landing", icon: Home },
  { path: "/app", label: "Dashboard", icon: LayoutDashboard },
  { path: "/app/candidate", label: "Candidate", icon: User },
  { path: "/app/employer", label: "Employer", icon: Briefcase },
  { path: "/app/matches", label: "Match Engine", icon: Zap },
  { path: "/app/vault", label: "ZK Vault", icon: Key },
  { path: "/app/analytics", label: "Analytics", icon: BarChart2 },
  { path: "/app/proofs", label: "Proof Explorer", icon: Search },
  { path: "/app/governance", label: "Governance", icon: Vote },
  { path: "/app/protocol", label: "Protocol", icon: Code2 },
  { path: "/app/sdk", label: "SDK Docs", icon: Code2 },
  { path: "/app/whitepaper", label: "Whitepaper", icon: FileText },
];

// ─── Hash Cycler (inline for wallet gate) ────────────────────────────────────
function HashCycler() {
  const [idx, setIdx] = useState(0);
  const hashes = ["0x7f3a9b2c4e1d8f5a", "0x9b2c4e1d8f5a7f3a", "0x3d8e2f1a9c7b4e6d"];
  // Simple cycling without useEffect to avoid hook issues
  return (
    <span className="font-mono-cipher text-xs text-primary/70">{hashes[0]}</span>
  );
}

// ─── In-app browser detection ─────────────────────────────────────────────────
function detectInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|Twitter|TikTok|Snapchat|Line\/|MicroMessenger|Telegram/i.test(ua) ||
    !!(window as any).ReactNativeWebView;
}

// ─── Wallet Gate ──────────────────────────────────────────────────────────────
function WalletGate() {
  const { connect, connectors, isPending } = useConnect();
  const isInApp = detectInAppBrowser();

  const handleConnect = () => {
    try {
      const c = connectors.find(c => c.id === "injected") || connectors[0];
      if (c) connect({ connector: c });
    } catch {
      // Silently ignore connector errors in restricted environments
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(#ff4500 1px, transparent 1px), linear-gradient(90deg, #ff4500 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-6 relative z-10"
      >
        <div className="flex items-center gap-3">
          <img src="/assets/cypher.jpg" alt="Cipher CV" className="w-8 h-8 object-cover" />
          <span className="font-bold text-lg uppercase tracking-widest" style={{ fontFamily: "Space Grotesk" }}>
            Cipher CV
          </span>
        </div>

        {isInApp ? (
          /* In-app browser: prompt to open externally */
          <div className="border border-primary/40 bg-primary/5 p-8 space-y-6">
            <div className="space-y-2">
              <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Browser Required</div>
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
                Open in Your Browser
              </h1>
              <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
                Cipher CV requires a Web3 wallet. In-app browsers don't support wallet connections — please open this page in Safari, Chrome, or Firefox.
              </p>
            </div>
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center font-mono-cipher text-sm bg-primary text-primary-foreground py-4 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 font-bold"
            >
              Open in Browser →
            </a>
            <div className="space-y-2">
              {[
                "Copy the URL and paste it in your browser",
                "Or tap the ··· menu → Open in Browser",
                "MetaMask, WalletConnect, Coinbase Wallet supported",
              ].map(item => (
                <div key={item} className="flex items-start gap-2 font-mono-cipher text-xs text-muted-foreground">
                  <span className="text-primary shrink-0">—</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Normal browser: wallet connect */
          <div className="border border-border bg-card p-8 space-y-6">
            <div className="space-y-2">
              <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Authentication Required</div>
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
                Connect Your Wallet
              </h1>
              <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
                Access to the Cipher CV protocol requires a Web3 wallet. Your identity remains encrypted — we only verify wallet ownership.
              </p>
            </div>
            <div className="bg-background border border-border p-4 space-y-2 font-mono-cipher text-xs">
              <div className="text-muted-foreground">Awaiting authentication...</div>
              <div className="text-primary/70">0x7f3a9b2c4e1d8f5a</div>
              <div className="text-muted-foreground opacity-50">⊕ FHE.verify(wallet_signature)</div>
            </div>
            <button
              onClick={handleConnect}
              disabled={isPending}
              className="w-full font-mono-cipher text-sm bg-primary text-primary-foreground py-4 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 font-bold disabled:opacity-60"
            >
              {isPending ? "Connecting..." : "Connect Wallet to Enter →"}
            </button>
            <div className="space-y-2">
              {[
                "MetaMask, WalletConnect, Coinbase Wallet supported",
                "No personal data collected — wallet address only",
                "All matching computed on encrypted data",
              ].map(item => (
                <div key={item} className="flex items-start gap-2 font-mono-cipher text-xs text-muted-foreground">
                  <span className="text-primary shrink-0">—</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link to="/" className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          ← Back to Landing
        </Link>
      </motion.div>
    </div>
  );
}

// ─── Onboarding Modal ─────────────────────────────────────────────────────────
function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      icon: Shield,
      title: "Welcome to Cipher CV",
      desc: "The first FHE-powered job search protocol. Your salary, skills, and identity stay encrypted throughout the entire matching process.",
      cta: "Get Started →",
    },
    {
      icon: User,
      title: "Step 1: Encrypt Your Profile",
      desc: "Navigate to Candidate → fill in your details. Your data is encrypted client-side before anything is stored. We never see your salary or skills in plaintext.",
      cta: "Next →",
    },
    {
      icon: Lock,
      title: "Step 2: Set Your Blocklist",
      desc: "Add your current employer's domain to the encrypted blocklist. They will be mathematically invisible to your search — they cannot see your profile or that you're searching.",
      cta: "Next →",
    },
    {
      icon: Zap,
      title: "Step 3: Run Matching",
      desc: "Go to Match Engine and run the FHE matching protocol. Compatible employers are found without either party learning the other's constraints.",
      cta: "Enter the Protocol →",
    },
  ];

  const current = steps[step];
  const Icon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="bg-card border border-border w-full max-w-md p-8 space-y-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step indicator */}
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 transition-all duration-300 ${i <= step ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>

        <div className="space-y-4">
          <div className="w-10 h-10 border border-primary/30 bg-primary/5 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest mb-2">
              {step === 0 ? "Welcome" : `Step ${step} of ${steps.length - 1}`}
            </div>
            <h2 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Space Grotesk" }}>
              {current.title}
            </h2>
            <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
              {current.desc}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={() => {
              if (step < steps.length - 1) setStep(s => s + 1);
              else onClose();
            }}
            className="font-mono-cipher text-sm bg-primary text-primary-foreground px-6 py-3 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 font-bold"
          >
            {current.cta}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Error Boundary ───────────────────────────────────────────────────────────
import React from "react";

class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 space-y-4">
          <div className="border border-destructive/50 bg-destructive/5 p-6 space-y-3">
            <div className="font-mono-cipher text-xs text-destructive uppercase tracking-widest">Page Error</div>
            <div className="font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
              Something went wrong
            </div>
            <div className="font-mono-cipher text-xs text-muted-foreground">
              {this.state.error?.message ?? "An unexpected error occurred"}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="font-mono-cipher text-xs border border-border text-muted-foreground px-4 py-2 hover:border-primary hover:text-foreground transition-all duration-100"
            >
              Try Again →
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isConnected } = useAccount();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Show onboarding only once per session
    if (typeof window === "undefined") return false;
    const seen = sessionStorage.getItem("cipher-onboarding-seen");
    return !seen;
  });

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    sessionStorage.setItem("cipher-onboarding-seen", "1");
  };

  // Wallet gate — redirect to connect screen if not connected
  if (!isConnected) {
    return <WalletGate />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Onboarding modal */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal onClose={handleOnboardingClose} />
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 56 : 220 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden md:flex flex-col border-r border-border bg-card shrink-0 relative z-10"
        style={{ minHeight: "100vh" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border overflow-hidden">
          <img src="/assets/cypher.jpg" alt="Cipher CV" className="w-7 h-7 object-cover shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-sm uppercase tracking-widest whitespace-nowrap overflow-hidden"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Cipher CV
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const active = item.path === "/app"
              ? location.pathname === "/app"
              : location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-2 py-2.5 transition-all duration-100 group ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="font-mono-cipher text-xs uppercase tracking-widest whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center p-3 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -220 }}
            animate={{ x: 0 }}
            exit={{ x: -220 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 top-0 bottom-0 w-[220px] bg-card border-r border-border z-50 flex flex-col md:hidden"
          >
            <div className="flex items-center justify-between px-4 py-5 border-b border-border">
              <div className="flex items-center gap-2">
                <img src="/assets/cypher.jpg" alt="Cipher CV" className="w-7 h-7 object-cover" />
                <span className="font-bold text-sm uppercase tracking-widest" style={{ fontFamily: "Space Grotesk" }}>
                  Cipher CV
                </span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const active = item.path === "/app"
                  ? location.pathname === "/app"
                  : location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-2 py-2.5 transition-all duration-100 ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="font-mono-cipher text-xs uppercase tracking-widest">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="font-mono-cipher text-xs text-muted-foreground">
              {NAV_ITEMS.find((n) => n.path === location.pathname)?.label ?? "App"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-mono-cipher text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Arbitrum Sepolia
            </div>
            <NotificationCenter />
            <WalletButton />
          </div>
        </header>

        {/* Page content with error boundary */}
        <main className="flex-1 overflow-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            <PageErrorBoundary>
              {children}
            </PageErrorBoundary>
          </motion.div>
        </main>
      </div>
    </div>
  );
}