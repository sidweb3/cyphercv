import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "./AppLayout";
import { useAccount, useConnect } from "wagmi";
import { DemoMode } from "@/components/DemoMode";
import { PrivacyScore } from "@/components/PrivacyScore";
import { ActivityFeed } from "@/components/ActivityFeed";
import { FHECircuit } from "@/components/FHECircuit";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  User, Briefcase, Zap, Code2, Shield, ChevronRight, Lock,
  BarChart2, FileText, Bell, TrendingUp, Ghost, Calendar,
  Vote, Key, Activity, Cpu, Globe, ArrowUpRight, Terminal,
  Package, Eye, EyeOff, Coins, Users, Link2, CheckCircle,
  Plus, X, Settings,
} from "lucide-react";
import { generateHash } from "@/lib/demoData";
import { toast } from "sonner";

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    const duration = 1200;
    const step = (end - start) / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display.toLocaleString()}{suffix}</span>;
}

// ─── Hash Cycler ─────────────────────────────────────────────────────────────
function HashCycler({ short = false }: { short?: boolean }) {
  const hashes = [
    "0x7f3a9b2c4e1d8f5a6b3c2d1e",
    "0x9b2c4e1d8f5a7f3a2b4c6d8e",
    "0x3d8e2f1a9c7b4e6d5f2a1b3c",
    "0x5c9f2e8a1b4d7e3c6a2f9b1d",
    "0x1a9c7b4e6d3d8e2f5c7a9b2e",
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % hashes.length), 800);
    return () => clearInterval(t);
  }, []);
  const h = hashes[idx];
  return (
    <motion.span key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="font-mono-cipher text-primary">
      {short ? h.slice(0, 14) + "..." : h}
    </motion.span>
  );
}

// ─── Live Ticker ──────────────────────────────────────────────────────────────
const TICKER_EVENTS = [
  "FHE.gte(salary_a, budget_b) → ebool",
  "FHE.and(exp_match, skill_match) → ebool",
  "MATCH_COMPUTED: 0x7f3a...8f5a",
  "CONSENT_SIGNED: candidate 0x9b2c...7f3a",
  "SALARY_REVEALED: mutual consent confirmed",
  "STEALTH_CHECK: blocklist_hash verified",
  "BATCH_MATCH: 12 pairs processed",
  "VAULT_COMMIT: credential hash stored",
  "GOVERNANCE_VOTE: proposal #7 encrypted",
  "PROFILE_ENCRYPTED: 3 vectors committed",
];

function LiveTicker() {
  const [events, setEvents] = useState<{ id: number; text: string; time: string }[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    const addEvent = () => {
      const text = TICKER_EVENTS[Math.floor(Math.random() * TICKER_EVENTS.length)];
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      setEvents(prev => [{ id: counterRef.current++, text, time }, ...prev].slice(0, 8));
    };
    addEvent();
    const t = setInterval(addEvent, 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <motion.div className="w-2 h-2 bg-primary rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">Live FHE Operations</span>
        </div>
        <span className="font-mono-cipher text-xs text-primary border border-primary/30 px-2 py-0.5">LIVE</span>
      </div>
      <div className="divide-y divide-border/50">
        <AnimatePresence initial={false}>
          {events.map((ev, i) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -12, height: 0 }}
              animate={{ opacity: 1 - i * 0.1, x: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <span className="font-mono-cipher text-muted-foreground/40 shrink-0" style={{ fontSize: "9px" }}>{ev.time}</span>
              <span className={`font-mono-cipher text-xs truncate ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>{ev.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data, color = "#ff4500" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 80; const H = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.8" />
      <circle cx={parseFloat(pts.split(" ").pop()!.split(",")[0])} cy={parseFloat(pts.split(" ").pop()!.split(",")[1])} r="2.5" fill={color} />
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, trend, sparkData, delay = 0 }: {
  label: string; value: string | number; sub: string; trend?: string; sparkData?: number[]; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="border border-border bg-card p-5 group hover:border-primary/50 transition-all duration-200 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-colors duration-200" />
      <div className="flex items-start justify-between mb-3">
        <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">{label}</div>
        {sparkData && <Sparkline data={sparkData} />}
      </div>
      <div className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "Space Grotesk" }}>
        {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
      </div>
      <div className="flex items-center justify-between">
        <div className="font-mono-cipher text-xs text-muted-foreground opacity-60">{sub}</div>
        {trend && (
          <div className="flex items-center gap-1 font-mono-cipher text-xs text-primary">
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Action Card ──────────────────────────────────────────────────────────────
function ActionCard({ path, icon: Icon, label, desc, cta, accent, badge, delay = 0 }: {
  path: string; icon: React.ElementType; label: string; desc: string; cta: string;
  accent?: boolean; badge?: string; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}>
      <Link
        to={path}
        className={`block border p-5 space-y-3 group transition-all duration-150 hover:border-primary hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 ${
          accent ? "border-primary bg-primary/5" : "border-border bg-card"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 border flex items-center justify-center transition-all duration-150 ${
              accent ? "border-primary bg-primary/10" : "border-border group-hover:border-primary group-hover:bg-primary/5"
            }`}>
              <Icon className={`w-3.5 h-3.5 ${accent ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors"}`} />
            </div>
            {badge && (
              <span className="font-mono-cipher border border-primary text-primary px-1.5 py-0.5" style={{ fontSize: "9px" }}>
                {badge}
              </span>
            )}
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
        </div>
        <div>
          <div className="font-mono-cipher text-xs uppercase tracking-widest text-foreground mb-1.5 group-hover:text-primary transition-colors">{label}</div>
          <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed" style={{ fontSize: "11px" }}>{desc}</p>
        </div>
        <div className={`font-mono-cipher text-xs ${accent ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary transition-colors"}`}>
          {cta}
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Network Status Panel ─────────────────────────────────────────────────────
function NetworkStatusPanel() {
  const [blockNum, setBlockNum] = useState(18_432_891);
  const [gasPrice, setGasPrice] = useState(0.12);
  const [latency, setLatency] = useState(42);

  useEffect(() => {
    const t = setInterval(() => {
      setBlockNum(n => n + Math.floor(Math.random() * 3));
      setGasPrice(g => Math.max(0.05, g + (Math.random() - 0.5) * 0.02));
      setLatency(l => Math.max(20, l + Math.floor((Math.random() - 0.5) * 10)));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Globe className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">Network</span>
        <span className="ml-auto font-mono-cipher text-xs text-primary border border-primary/30 px-1.5 py-0.5">Arb Sepolia</span>
      </div>
      <div className="space-y-2">
        {[
          { label: "Block", value: blockNum.toLocaleString(), live: true },
          { label: "Gas", value: `${gasPrice.toFixed(3)} gwei`, live: false },
          { label: "Latency", value: `${latency}ms`, live: false },
          { label: "FHE Node", value: "Online", live: true },
          { label: "CoFHE SDK", value: "v0.3.0", live: false },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="font-mono-cipher text-xs text-muted-foreground">{item.label}</span>
            <div className="flex items-center gap-1.5">
              {item.live && <motion.span className="w-1 h-1 bg-primary rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />}
              <span className="font-mono-cipher text-xs text-foreground">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Terminal Panel ───────────────────────────────────────────────────────────
function TerminalPanel() {
  const lines = [
    { text: "$ cipher-cv connect --network arbitrum-sepolia", color: "text-muted-foreground" },
    { text: "✓ Connected to Arbitrum Sepolia (Chain ID: 421614)", color: "text-primary" },
    { text: "✓ CoFHE SDK initialized — v0.3.0", color: "text-primary" },
    { text: "✓ 8 contracts loaded from registry", color: "text-primary" },
    { text: "$ cipher-cv profile --encrypt", color: "text-muted-foreground" },
    { text: "  Encrypting salary range... [████████] done", color: "text-foreground/60" },
    { text: "  Encrypting experience... [████████] done", color: "text-foreground/60" },
    { text: "  Committing to chain... txHash: 0x7f3a...", color: "text-foreground/60" },
    { text: "✓ Profile committed — hash: 0x9b2c4e1d...", color: "text-primary" },
  ];
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= lines.length) return;
    const t = setTimeout(() => setVisible(v => v + 1), 350);
    return () => clearTimeout(t);
  }, [visible, lines.length]);

  return (
    <div className="border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Terminal</span>
        <div className="ml-auto flex gap-1.5">
          {["bg-destructive/60", "bg-primary/60", "bg-primary/30"].map((c, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${c}`} />
          ))}
        </div>
      </div>
      <div className="p-4 space-y-1 min-h-[180px]">
        {lines.slice(0, visible).map((line, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
            <span className={`font-mono-cipher text-xs ${line.color}`}>{line.text}</span>
          </motion.div>
        ))}
        {visible < lines.length && (
          <motion.span className="font-mono-cipher text-xs text-primary" animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>
            █
          </motion.span>
        )}
      </div>
    </div>
  );
}

// ─── Wallet Gate ──────────────────────────────────────────────────────────────
function WalletGate() {
  const { connect, connectors, isPending } = useConnect();
  const handleConnect = () => {
    const c = connectors.find(c => c.id === "injected") || connectors[0];
    if (c) connect({ connector: c });
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
            <HashCycler />
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
            {["MetaMask, WalletConnect, Coinbase Wallet supported", "No personal data collected — wallet address only", "All matching computed on encrypted data"].map(item => (
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

// ─── Token Balance Widget ─────────────────────────────────────────────────────
function TokenBalanceWidget({ address }: { address: string }) {
  const tokenBalance = useQuery(api.wave3.getTokenBalance, { walletAddress: address });
  const claimReward = useMutation(api.wave3.claimTokenReward);
  const stakeTokens = useMutation(api.wave3.stakeTokens);
  const [claiming, setClaiming] = useState(false);
  const [staking, setStaking] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");
  const [showStake, setShowStake] = useState(false);

  const balance = tokenBalance?.balance ?? 0;
  const staked = tokenBalance?.stakedBalance ?? 0;
  const score = tokenBalance?.participationScore ?? 0;

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await claimReward({ walletAddress: address, rewardAmount: 50, reason: "daily_participation" });
      toast.success("Claimed 50 CIPHER tokens");
    } catch {
      toast.error("Claim failed");
    } finally {
      setClaiming(false);
    }
  };

  const handleStake = async () => {
    const amount = parseInt(stakeAmount);
    if (!amount || amount <= 0 || amount > balance) {
      toast.error("Invalid stake amount");
      return;
    }
    setStaking(true);
    try {
      await stakeTokens({ walletAddress: address, amount });
      toast.success(`Staked ${amount} CIPHER tokens`);
      setStakeAmount("");
      setShowStake(false);
    } catch (e: any) {
      toast.error(e.message ?? "Stake failed");
    } finally {
      setStaking(false);
    }
  };

  return (
    <div className="border border-border bg-card">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">CIPHER Token</span>
          <span className="font-mono-cipher text-xs text-primary border border-primary/30 px-1.5 py-0.5">Wave 3</span>
        </div>
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="font-mono-cipher text-xs bg-primary text-primary-foreground px-3 py-1.5 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 disabled:opacity-50"
        >
          {claiming ? "Claiming..." : "Claim Daily →"}
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-0 border border-border">
          {[
            { label: "Balance", value: balance.toLocaleString(), unit: "CIPHER" },
            { label: "Staked", value: staked.toLocaleString(), unit: "CIPHER" },
            { label: "Score", value: String(score), unit: "pts" },
          ].map((item, i) => (
            <div key={item.label} className={`p-4 text-center ${i < 2 ? "border-r border-border" : ""}`}>
              <div className="text-xl font-bold text-foreground mb-0.5" style={{ fontFamily: "Space Grotesk" }}>
                {item.value}
              </div>
              <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
                {item.label} ({item.unit})
              </div>
            </div>
          ))}
        </div>

        {!showStake ? (
          <button
            onClick={() => setShowStake(true)}
            disabled={balance === 0}
            className="font-mono-cipher text-xs border border-border text-muted-foreground px-4 py-2 hover:border-primary hover:text-foreground transition-all duration-100 disabled:opacity-40 flex items-center gap-2"
          >
            <Lock className="w-3 h-3" />
            Stake Tokens for Governance Weight
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
            <input
              type="number"
              value={stakeAmount}
              onChange={e => setStakeAmount(e.target.value)}
              placeholder={`Max: ${balance}`}
              className="flex-1 bg-background border border-border px-3 py-2 font-mono-cipher text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <button
              onClick={handleStake}
              disabled={staking}
              className="font-mono-cipher text-xs bg-primary text-primary-foreground px-4 py-2 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 disabled:opacity-50"
            >
              {staking ? "..." : "Stake"}
            </button>
            <button
              onClick={() => setShowStake(false)}
              className="font-mono-cipher text-xs border border-border text-muted-foreground px-3 py-2 hover:border-primary hover:text-foreground transition-all duration-100"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}

        <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
          Staked tokens increase your governance voting weight. Claim daily rewards for protocol participation.
        </div>
      </div>
    </div>
  );
}

// ─── Referral Widget ──────────────────────────────────────────────────────────
function ReferralWidget({ address }: { address: string }) {
  const referrals = useQuery(api.wave3.getReferrals, { walletAddress: address }) ?? [];
  const submitReferral = useMutation(api.wave3.submitReferral);
  const [refereeWallet, setRefereeWallet] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const wallet = refereeWallet.trim();
    if (!wallet || !wallet.startsWith("0x") || wallet.length < 10) {
      toast.error("Enter a valid wallet address");
      return;
    }
    setSubmitting(true);
    try {
      await submitReferral({
        referrerWallet: address,
        refereeWallet: wallet,
        rewardHash: generateHash(),
      });
      toast.success("Referral submitted — 100 CIPHER pending");
      setRefereeWallet("");
    } catch (e: any) {
      toast.error(e.message ?? "Referral failed");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmed = referrals.filter(r => r.status === "confirmed" || r.status === "paid").length;
  const pending = referrals.filter(r => r.status === "pending").length;

  return (
    <div className="border border-border bg-card">
      <div className="px-6 py-4 border-b border-border flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">Referral Program</span>
        <span className="ml-auto font-mono-cipher text-xs text-muted-foreground">{referrals.length} total</span>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-0 border border-border">
          <div className="p-4 text-center border-r border-border">
            <div className="text-xl font-bold text-primary mb-0.5" style={{ fontFamily: "Space Grotesk" }}>{confirmed}</div>
            <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>Confirmed</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-xl font-bold text-foreground mb-0.5" style={{ fontFamily: "Space Grotesk" }}>{pending}</div>
            <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>Pending</div>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            value={refereeWallet}
            onChange={e => setRefereeWallet(e.target.value)}
            placeholder="0x... referee wallet address"
            className="flex-1 bg-background border border-border px-3 py-2 font-mono-cipher text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="font-mono-cipher text-xs bg-primary text-primary-foreground px-4 py-2 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" />
            {submitting ? "..." : "Refer"}
          </button>
        </div>

        {referrals.length > 0 && (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {referrals.slice(0, 5).map(r => (
              <div key={r._id} className="flex items-center justify-between font-mono-cipher text-xs">
                <span className="text-muted-foreground truncate max-w-[160px]">{r.refereeWallet.slice(0, 14)}...</span>
                <span className={`border px-1.5 py-0.5 ${
                  r.status === "paid" ? "border-primary text-primary" :
                  r.status === "confirmed" ? "border-primary/50 text-primary/70" :
                  "border-border text-muted-foreground"
                }`} style={{ fontSize: "9px" }}>
                  {r.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="font-mono-cipher text-xs text-muted-foreground">
          Earn 100 CIPHER per confirmed referral. Rewards unlock after referee submits their first encrypted profile.
        </div>
      </div>
    </div>
  );
}

// ─── ATS Integration Widget ───────────────────────────────────────────────────
function ATSIntegrationWidget({ address }: { address: string }) {
  const configs = useQuery(api.wave3.getIntegrationConfigs, { walletAddress: address }) ?? [];
  const upsertConfig = useMutation(api.wave3.upsertIntegrationConfig);
  const [selected, setSelected] = useState<"greenhouse" | "lever" | "workday" | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  const ATS_SYSTEMS = [
    { type: "greenhouse" as const, label: "Greenhouse", desc: "Sync job postings and candidate pipeline" },
    { type: "lever" as const, label: "Lever", desc: "Import encrypted job requirements" },
    { type: "workday" as const, label: "Workday", desc: "Enterprise HR system integration" },
  ];

  const getConfig = (type: string) => configs.find(c => c.type === type);

  const handleSave = async () => {
    if (!selected || !apiKey.trim()) {
      toast.error("Select an ATS and enter an API key");
      return;
    }
    setSaving(true);
    try {
      await upsertConfig({
        walletAddress: address,
        type: selected,
        apiKeyHash: generateHash(), // Hash the API key — never store plaintext
        active: true,
      });
      toast.success(`${selected} integration configured`);
      setSelected(null);
      setApiKey("");
    } catch {
      toast.error("Failed to save integration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border bg-card">
      <div className="px-6 py-4 border-b border-border flex items-center gap-2">
        <Link2 className="w-4 h-4 text-primary" />
        <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">ATS Integrations</span>
        <span className="ml-auto font-mono-cipher text-xs text-muted-foreground">{configs.filter(c => c.active).length} active</span>
      </div>
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          {ATS_SYSTEMS.map(ats => {
            const config = getConfig(ats.type);
            return (
              <div
                key={ats.type}
                className={`flex items-center justify-between p-4 border transition-all duration-100 cursor-pointer ${
                  selected === ats.type ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
                onClick={() => setSelected(selected === ats.type ? null : ats.type)}
              >
                <div>
                  <div className="font-mono-cipher text-xs text-foreground uppercase tracking-widest">{ats.label}</div>
                  <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>{ats.desc}</div>
                </div>
                {config?.active ? (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span className="font-mono-cipher text-xs text-primary">Active</span>
                  </div>
                ) : (
                  <span className="font-mono-cipher text-xs text-muted-foreground border border-border px-2 py-0.5">Configure</span>
                )}
              </div>
            );
          })}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
              <div className="font-mono-cipher text-xs text-muted-foreground">
                API key is hashed before storage — never stored in plaintext.
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={`${selected} API key`}
                  className="flex-1 bg-background border border-border px-3 py-2 font-mono-cipher text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  onClick={handleSave}
                  disabled={saving || !apiKey.trim()}
                  className="font-mono-cipher text-xs bg-primary text-primary-foreground px-4 py-2 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 disabled:opacity-50"
                >
                  {saving ? "..." : "Save"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [walletHash] = useState(generateHash);
  const [showDemo, setShowDemo] = useState(false);
  const [circuitRunning, setCircuitRunning] = useState(false);
  const [showAddress, setShowAddress] = useState(false);

  const stats = useQuery(api.matches.getProtocolStats);
  const candidateMatches = useQuery(api.matches.getCandidateMatches, address ? { walletAddress: address } : "skip");
  const candidateProfile = useQuery(api.profiles.getCandidateProfile, address ? { walletAddress: address } : "skip");
  const unreadCount = useQuery(api.notifications.getUnreadCount, address ? { walletAddress: address } : "skip");

  if (!isConnected) return null; // AppLayout handles wallet gating

  const activeMatches = candidateMatches?.length ?? 0;
  const matchedCount = candidateMatches?.filter(m => m.status === "matched").length ?? 0;
  const fheOps = stats ? stats.totalRequests * 3 : 0;
  const hasProfile = !!candidateProfile?.submitted;

  const sparkData1 = [2, 5, 3, 8, 6, 11, 9, 14, 12, 18];
  const sparkData2 = [1, 3, 2, 5, 4, 7, 6, 9, 8, 12];
  const sparkData3 = [10, 8, 12, 9, 15, 11, 18, 14, 20, 17];
  const sparkData4 = [5, 9, 7, 12, 10, 16, 13, 19, 15, 22];

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div className="space-y-1">
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Dashboard — Wave 3</div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
              Protocol Overview
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddress(v => !v)}
              className="flex items-center gap-2 border border-border px-3 py-2 font-mono-cipher text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-all duration-100"
            >
              {showAddress ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showAddress ? address : address?.slice(0, 6) + "..." + address?.slice(-4)}
            </button>
            {unreadCount != null && unreadCount > 0 && (
              <div className="flex items-center gap-1.5 border border-primary/30 bg-primary/5 px-3 py-2">
                <Bell className="w-3 h-3 text-primary" />
                <span className="font-mono-cipher text-xs text-primary">{unreadCount} new</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Active Matches" value={activeMatches} sub="total requests" trend="+12%" sparkData={sparkData1} delay={0} />
          <StatCard label="Matched" value={matchedCount} sub="compatible pairs" trend="+8%" sparkData={sparkData2} delay={0.06} />
          <StatCard label="FHE Ops" value={fheOps} sub="computations run" trend="+24%" sparkData={sparkData3} delay={0.12} />
          <StatCard label="Privacy" value="100%" sub="zero data leaked" sparkData={sparkData4} delay={0.18} />
        </div>

        {/* ── Profile status banner ── */}
        {!hasProfile && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-primary/40 bg-primary/5 p-4 flex items-center justify-between gap-4 flex-wrap"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="font-mono-cipher text-xs text-primary">
                Profile not submitted — encrypt your profile to start matching
              </span>
            </div>
            <Link
              to="/app/candidate"
              className="font-mono-cipher text-xs bg-primary text-primary-foreground px-4 py-2 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100"
            >
              Encrypt Profile →
            </Link>
          </motion.div>
        )}

        {/* ── Wave 3 Features ── */}
        <div className="space-y-2">
          <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            Wave 3 Features
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TokenBalanceWidget address={address!} />
            <ReferralWidget address={address!} />
            <ATSIntegrationWidget address={address!} />
          </div>
        </div>

        {/* ── Live Ticker ── */}
        <LiveTicker />

        {/* ── Action Cards ── */}
        <div className="space-y-2">
          <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Quick Actions</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionCard path="/app/candidate" icon={User} label="Candidate Profile" desc="Encrypt your salary range, experience, and skills using FHE. Zero plaintext stored." cta="Encrypt Profile →" accent={!hasProfile} badge={!hasProfile ? "SETUP" : undefined} delay={0} />
            <ActionCard path="/app/employer" icon={Briefcase} label="Employer Portal" desc="Post encrypted job requirements. Match against the candidate pool without revealing budget." cta="Post Job →" delay={0.05} />
            <ActionCard path="/app/matches" icon={Zap} label="Match Engine" desc="Run the FHE matching protocol. Compute salary overlap without decryption." cta="Run Match →" badge="LIVE" delay={0.1} />
            <ActionCard path="/app/vault" icon={Key} label="ZK Vault" desc="Manage encrypted credential commitments. Reveal values only to yourself." cta="Open Vault →" delay={0.15} />
            <ActionCard path="/app/governance" icon={Vote} label="Governance" desc="Vote on protocol parameters using your staked CIPHER tokens." cta="Vote →" delay={0.2} />
            <ActionCard path="/app/sdk" icon={Code2} label="SDK Docs" desc="24+ methods for integrating FHE matching into your application." cta="View SDK →" badge="NEW" delay={0.25} />
          </div>
        </div>

        {/* ── Network + Terminal ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <NetworkStatusPanel />
          <TerminalPanel />
        </div>

        {/* ── Privacy Score ── */}
        <PrivacyScore walletConnected={isConnected} />

        {/* ── FHE Circuit ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">FHE Circuit Visualizer</span>
            </div>
            <button
              onClick={() => { setCircuitRunning(true); setTimeout(() => setCircuitRunning(false), 3000); }}
              className="font-mono-cipher text-xs border border-border text-muted-foreground px-3 py-1.5 hover:border-primary hover:text-foreground transition-all duration-100 flex items-center gap-2"
            >
              <Zap className="w-3 h-3" />
              Execute Circuit →
            </button>
          </div>
          <FHECircuit running={circuitRunning} />
        </div>

        {/* ── Quick Demo ── */}
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
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="p-6">
                  <DemoMode />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </AppLayout>
  );
}