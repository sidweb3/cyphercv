import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "./AppLayout";
import { useAccount } from "wagmi";
import { useConnect } from "wagmi";
import { DemoMode } from "@/components/DemoMode";
import { PrivacyScore } from "@/components/PrivacyScore";
import { ActivityFeed } from "@/components/ActivityFeed";
import { FHECircuit } from "@/components/FHECircuit";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  User,
  Briefcase,
  Zap,
  Code2,
  Shield,
  ChevronRight,
  Lock,
  BarChart2,
  FileText,
  Bell,
  TrendingUp,
  Ghost,
  Calendar,
  Vote,
  Key,
  Search,
} from "lucide-react";
import { generateHash } from "@/lib/demoData";

function HashCycler() {
  const hashes = [
    "0x7f3a9b2c4e1d8f5a",
    "0x9b2c4e1d8f5a7f3a",
    "0x3d8e2f1a9c7b4e6d",
    "0x5c9f2e8a1b4d7e3c",
    "0x1a9c7b4e6d3d8e2f",
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % hashes.length), 700);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.span key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono-cipher text-xs text-primary">
      {hashes[idx]}
    </motion.span>
  );
}

function ConnectWalletButton() {
  const { connect, connectors, isPending } = useConnect();
  const handleConnect = () => {
    const injectedConnector = connectors.find(c => c.id === 'injected') || connectors[0];
    if (injectedConnector) connect({ connector: injectedConnector });
  };
  return (
    <button
      onClick={handleConnect}
      disabled={isPending}
      className="w-full font-mono-cipher text-sm bg-primary text-primary-foreground py-4 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 font-bold disabled:opacity-60"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet to Enter →'}
    </button>
  );
}

function WalletGate() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-primary" />
          <span className="font-bold text-lg uppercase tracking-widest" style={{ fontFamily: "Space Grotesk" }}>
            Cipher CV
          </span>
        </div>
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
          <div className="bg-black border border-border p-4 space-y-2">
            <div className="font-mono-cipher text-xs text-muted-foreground">Awaiting authentication...</div>
            <HashCycler />
            <div className="font-mono-cipher text-xs text-muted-foreground opacity-50">
              ⊕ FHE.verify(wallet_signature)
            </div>
          </div>
          <ConnectWalletButton />
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
        <Link to="/" className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          ← Back to Landing
        </Link>
      </motion.div>
    </div>
  );
}

// ─── Quick Action Card ────────────────────────────────────────────────────────
function QuickActionCard({ path, icon: Icon, label, desc, cta, accent, badge }: {
  path: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  cta: string;
  accent?: boolean;
  badge?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link
        to={path}
        className={`block border p-6 space-y-3 group transition-all duration-100 hover:border-primary ${
          accent ? "border-primary bg-primary/5" : "border-border bg-card"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors"}`} />
            {badge && (
              <span className="font-mono-cipher border border-primary text-primary px-1.5 py-0.5" style={{ fontSize: "9px" }}>
                {badge}
              </span>
            )}
          </div>
          <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div>
          <div className="font-mono-cipher text-xs uppercase tracking-widest text-foreground mb-1">{label}</div>
          <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{desc}</p>
        </div>
        <div className={`font-mono-cipher text-xs ${accent ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors"}`}>
          {cta}
        </div>
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [walletHash] = useState(generateHash);
  const [showDemo, setShowDemo] = useState(false);
  const [circuitRunning, setCircuitRunning] = useState(false);

  const stats = useQuery(api.matches.getProtocolStats);
  const candidateMatches = useQuery(
    api.matches.getCandidateMatches,
    address ? { walletAddress: address } : "skip"
  );
  const candidateProfile = useQuery(
    api.profiles.getCandidateProfile,
    address ? { walletAddress: address } : "skip"
  );
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    address ? { walletAddress: address } : "skip"
  );

  if (!isConnected) return <WalletGate />;

  const activeMatches = candidateMatches?.length ?? 0;
  const matchedCount = candidateMatches?.filter(m => m.status === "matched").length ?? 0;
  const fheOps = stats ? stats.totalRequests * 3 : 0;
  const hasProfile = !!candidateProfile?.submitted;

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6"
        >
          <div className="space-y-1">
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
              Cipher CV — Protocol Dashboard — Wave 2
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
              Welcome to the Black Box
            </h1>
            <div className="font-mono-cipher text-xs text-muted-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              {address} — Fhenix Testnet
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(unreadCount ?? 0) > 0 && (
              <div className="flex items-center gap-2 border border-primary/30 bg-primary/5 px-3 py-1.5">
                <Bell className="w-3 h-3 text-primary" />
                <span className="font-mono-cipher text-xs text-primary">{unreadCount} new alerts</span>
              </div>
            )}
            <div className="encrypted-block text-xs px-3 py-1.5">
              SESSION: {walletHash.slice(0, 14)}...
            </div>
          </div>
        </motion.div>

        {/* Onboarding checklist if no profile */}
        {!hasProfile && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-primary/40 bg-primary/5 p-5 space-y-3"
          >
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Getting Started</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { step: "01", label: "Build Profile", desc: "Encrypt your salary range and skills", done: hasProfile, path: "/app/candidate" },
                { step: "02", label: "Run Matching", desc: "Find compatible employers via FHE", done: activeMatches > 0, path: "/app/matches" },
                { step: "03", label: "Consent Reveal", desc: "Sign mutual consent to reveal salary", done: matchedCount > 0, path: "/app/candidate" },
              ].map(item => (
                <Link key={item.step} to={item.path} className="flex items-start gap-3 p-3 border border-border hover:border-primary transition-colors group">
                  <div className={`w-6 h-6 border flex items-center justify-center shrink-0 font-mono-cipher text-xs ${item.done ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
                    {item.done ? "✓" : item.step}
                  </div>
                  <div>
                    <div className="font-mono-cipher text-xs text-foreground group-hover:text-primary transition-colors">{item.label}</div>
                    <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>{item.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border">
          {[
            { label: "Privacy Score", value: "100%", sub: "Zero plaintext exposure" },
            { label: "Active Matches", value: String(activeMatches), sub: "Encrypted pipeline" },
            { label: "Protocol Status", value: "Wave 2", sub: "Smart Contract Layer" },
            { label: "FHE Operations", value: String(fheOps), sub: "Total computed" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`p-5 ${i < 3 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}
            >
              <div className="text-xl font-bold text-foreground mb-0.5" style={{ fontFamily: "Space Grotesk" }}>
                {stat.value}
              </div>
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</div>
              <div className="font-mono-cipher text-xs text-muted-foreground mt-1 opacity-60">{stat.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Navigation cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <QuickActionCard
              path="/app/candidate"
              icon={User}
              label="Candidate Profile"
              desc="Build your encrypted utility curve. Set salary range, skills, and experience — all encrypted before submission."
              cta="Build Profile →"
              accent={!hasProfile}
              badge={!hasProfile ? "START HERE" : undefined}
            />
            <QuickActionCard
              path="/app/employer"
              icon={Briefcase}
              label="Employer Dashboard"
              desc="Post encrypted job specs. View matched candidates without revealing your budget or their identity."
              cta="Post Job →"
            />
            <QuickActionCard
              path="/app/matches"
              icon={Zap}
              label="Match Engine"
              desc="Run the live FHE matching protocol. Batch tournament, skill matrix, and live activity feed."
              cta="Run Engine →"
              badge={activeMatches > 0 ? `${activeMatches} matches` : undefined}
            />
            <QuickActionCard
              path="/app/vault"
              icon={Key}
              label="ZK Vault"
              desc="Manage your encrypted credentials. Export, revoke, and audit your on-chain commitments."
              cta="Open Vault →"
            />
            <QuickActionCard
              path="/app/analytics"
              icon={BarChart2}
              label="Analytics"
              desc="Privacy-preserving protocol analytics. Match rates, skill demand, salary distributions — all computed blind."
              cta="View Analytics →"
            />
            <QuickActionCard
              path="/app/governance"
              icon={Vote}
              label="Governance"
              desc="Vote on protocol parameters, upgrades, and treasury decisions. All votes encrypted on Fhenix."
              cta="Vote →"
            />
            <QuickActionCard
              path="/app/protocol"
              icon={Code2}
              label="Protocol Explorer"
              desc="Inspect the Fhenix smart contract architecture, FHE primitives, and Wave 2 deployment roadmap."
              cta="Explore →"
            />
            <QuickActionCard
              path="/app/whitepaper"
              icon={FileText}
              label="Whitepaper"
              desc="Full technical specification. FHE primer, protocol design, matching algorithm, and privacy guarantees."
              cta="Read →"
            />
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <ActivityFeed maxItems={6} />
            <div className="border border-border bg-card p-4 space-y-3">
              <div className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">Protocol Stats</div>
              {[
                { label: "Profiles", value: stats ? String(stats.totalCandidates) : "—" },
                { label: "Job Postings", value: stats ? String(stats.totalJobs) : "—" },
                { label: "Total Matches", value: stats ? String(stats.totalMatches) : "—" },
                { label: "FHE Ops", value: stats ? String(stats.totalRequests * 3) : "—" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="font-mono-cipher text-xs text-muted-foreground">{item.label}</span>
                  <span className="font-mono-cipher text-xs text-foreground">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Stealth features quick access */}
            <div className="border border-border bg-card p-4 space-y-3">
              <div className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">Stealth Features</div>
              {[
                { icon: Ghost, label: "Stealth Mode", path: "/app/candidate", desc: "Employer blocklist active" },
                { icon: TrendingUp, label: "Counter-Offer", path: "/app/candidate", desc: "Salary negotiation tool" },
                { icon: Calendar, label: "Interview Insurance", path: "/app/candidate", desc: "Guaranteed interviews" },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.label} to={item.path} className="flex items-center gap-3 group hover:text-primary transition-colors">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono-cipher text-xs text-foreground group-hover:text-primary transition-colors">{item.label}</div>
                      <div className="font-mono-cipher text-muted-foreground truncate" style={{ fontSize: "10px" }}>{item.desc}</div>
                    </div>
                    <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Privacy Score */}
        <PrivacyScore walletConnected={isConnected} />

        {/* FHE Circuit */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">FHE Circuit Visualizer</div>
            <button
              onClick={() => { setCircuitRunning(true); setTimeout(() => setCircuitRunning(false), 3000); }}
              className="font-mono-cipher text-xs border border-border text-muted-foreground px-3 py-1.5 hover:border-primary hover:text-foreground transition-all duration-100"
            >
              Execute Circuit →
            </button>
          </div>
          <FHECircuit running={circuitRunning} />
        </div>

        {/* Quick demo */}
        <div className="border border-border">
          <button
            onClick={() => setShowDemo(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 border-b border-border hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-mono-cipher text-xs uppercase tracking-widest text-foreground">
                Quick Demo — Run FHE Matching Now
              </span>
            </div>
            <motion.div animate={{ rotate: showDemo ? 90 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showDemo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <DemoMode />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}