import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "./AppLayout";
import { useAccount } from "wagmi";
import { useConnect } from "wagmi";
import { DemoMode } from "@/components/DemoMode";
import {
  User,
  Briefcase,
  Zap,
  Code2,
  Shield,
  Activity,
  ChevronRight,
  Lock,
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

const LIVE_EVENTS = [
  { time: "00:02", event: "Match computed — 94% compatibility", hash: "0x7f3a..." },
  { time: "00:07", event: "Encrypted profile submitted", hash: "0x9b2c..." },
  { time: "00:14", event: "FHE circuit initialized", hash: "0x3d8e..." },
  { time: "00:21", event: "Blind rejection — no overlap", hash: "0x5c9f..." },
  { time: "00:33", event: "Salary range encrypted", hash: "0x1a9c..." },
  { time: "00:41", event: "Match computed — 78% compatibility", hash: "0x8a1b..." },
];

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

// Wallet connect gate screen
function WalletGate() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-primary" />
          <span className="font-bold text-lg uppercase tracking-widest" style={{ fontFamily: "Space Grotesk" }}>
            Cipher CV
          </span>
        </div>

        {/* Gate content */}
        <div className="border border-border bg-card p-8 space-y-6">
          <div className="space-y-2">
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
              Authentication Required
            </div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
              Connect Your Wallet
            </h1>
            <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
              Access to the Cipher CV protocol requires a Web3 wallet. Your identity remains encrypted — we only verify wallet ownership.
            </p>
          </div>

          {/* Animated hash display */}
          <div className="bg-black border border-border p-4 space-y-2">
            <div className="font-mono-cipher text-xs text-muted-foreground">Awaiting authentication...</div>
            <HashCycler />
            <div className="font-mono-cipher text-xs text-muted-foreground opacity-50">
              ⊕ FHE.verify(wallet_signature)
            </div>
          </div>

          {/* Connect button - direct wagmi injected connector */}
          <ConnectWalletButton />

          {/* Privacy note */}
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

        {/* Back to landing */}
        <Link
          to="/"
          className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          ← Back to Landing
        </Link>
      </motion.div>
    </div>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [walletHash] = useState(generateHash);
  const [eventIdx, setEventIdx] = useState(0);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setEventIdx(i => (i + 1) % LIVE_EVENTS.length);
    }, 2500);
    return () => clearInterval(t);
  }, []);

  // Show wallet gate if not connected
  if (!isConnected) {
    return <WalletGate />;
  }

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : walletHash.slice(0, 10) + "...";

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
              Cipher CV — Protocol Dashboard
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
              Welcome to the Black Box
            </h1>
            <div className="font-mono-cipher text-xs text-muted-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              {address} — Fhenix Testnet
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="encrypted-block text-xs px-3 py-1.5">
              SESSION: {walletHash.slice(0, 14)}...
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border">
          {[
            { label: "Privacy Score", value: "100%", sub: "Zero plaintext exposure" },
            { label: "Active Matches", value: "4", sub: "Encrypted pipeline" },
            { label: "Protocol Status", value: "Live", sub: "Fhenix Testnet" },
            { label: "FHE Operations", value: "12", sub: "This session" },
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
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                {stat.label}
              </div>
              <div className="font-mono-cipher text-xs text-muted-foreground mt-1 opacity-60">
                {stat.sub}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Navigation cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                path: "/app/candidate",
                icon: User,
                label: "Candidate Profile",
                desc: "Build your encrypted utility curve. Set salary range, skills, and experience — all encrypted before submission.",
                cta: "Build Profile →",
                accent: true,
              },
              {
                path: "/app/employer",
                icon: Briefcase,
                label: "Employer Dashboard",
                desc: "Post encrypted job specs. View matched candidates without revealing your budget or their identity.",
                cta: "Post Job →",
                accent: false,
              },
              {
                path: "/app/matches",
                icon: Zap,
                label: "Match Engine",
                desc: "Run the live FHE matching protocol. Configure encrypted inputs and observe blind computation in real time.",
                cta: "Run Engine →",
                accent: false,
              },
              {
                path: "/app/protocol",
                icon: Code2,
                label: "Protocol Explorer",
                desc: "Inspect the Fhenix smart contract architecture, FHE primitives, and Wave 2 deployment roadmap.",
                cta: "Explore →",
                accent: false,
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.path}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                >
                  <Link
                    to={card.path}
                    className={`block border p-6 space-y-3 group transition-all duration-100 hover:border-primary ${
                      card.accent ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-4 h-4 ${card.accent ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors"}`} />
                      <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <div className="font-mono-cipher text-xs uppercase tracking-widest text-foreground mb-1">
                        {card.label}
                      </div>
                      <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                    <div className={`font-mono-cipher text-xs ${card.accent ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors"}`}>
                      {card.cta}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Live activity feed */}
          <div className="space-y-4">
            <div className="border border-border bg-card">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
                  Live Protocol Feed
                </span>
                <Activity className="w-3 h-3 text-primary animate-pulse" />
              </div>
              <div className="p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                  {LIVE_EVENTS.slice(eventIdx, eventIdx + 4).concat(
                    LIVE_EVENTS.slice(0, Math.max(0, 4 - (LIVE_EVENTS.length - eventIdx)))
                  ).map((event, i) => (
                    <motion.div
                      key={`${eventIdx}-${i}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1 - i * 0.2, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="space-y-0.5"
                    >
                      <div className="font-mono-cipher text-xs text-foreground">{event.event}</div>
                      <div className="font-mono-cipher text-xs text-muted-foreground">
                        {event.hash} · {event.time}s ago
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Encryption status */}
            <div className="border border-border bg-card p-4 space-y-3">
              <div className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
                Encryption Status
              </div>
              {[
                { label: "FHE Circuit", status: "Active" },
                { label: "Key Material", status: "Ephemeral" },
                { label: "Plaintext Exposure", status: "Zero" },
                { label: "Chain", status: "Fhenix Testnet" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="font-mono-cipher text-xs text-muted-foreground">{item.label}</span>
                  <span className="font-mono-cipher text-xs text-primary">{item.status}</span>
                </div>
              ))}
            </div>

            {/* Current hash */}
            <div className="border border-border bg-card p-4 space-y-2">
              <div className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
                Active Computation
              </div>
              <HashCycler />
              <div className="font-mono-cipher text-xs text-muted-foreground">
                ⊕ FHE.gte(euint256, euint256)
              </div>
            </div>
          </div>
        </div>

        {/* Quick demo section */}
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