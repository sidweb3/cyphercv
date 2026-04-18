import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

function SkillDemandChart() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div className="border border-border bg-card lg:col-span-2">
      <div className="px-6 py-4 border-b border-border">
        <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
          Skill Demand vs Supply
        </div>
        <div className="font-mono-cipher text-muted-foreground mt-0.5" style={{ fontSize: "10px" }}>
          Employer demand (orange) vs candidate supply (grey) — encrypted aggregate
        </div>
      </div>
      <div ref={ref} className="p-6 space-y-3">
        {SKILL_DEMAND.map((item, i) => (
          <div key={item.skill} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono-cipher text-xs text-foreground">{item.skill}</span>
              <span className="font-mono-cipher text-xs text-muted-foreground">
                {item.demand > item.supply ? (
                  <span className="text-primary">↑ High demand</span>
                ) : (
                  <span className="text-muted-foreground">Balanced</span>
                )}
              </span>
            </div>
            <div className="flex gap-1 h-3">
              <div className="flex-1 bg-secondary relative overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${item.demand}%` } : {}}
                  transition={{ duration: 0.8, delay: i * 0.06 }}
                />
              </div>
              <div className="flex-1 bg-secondary relative overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-muted-foreground/40"
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${item.supply}%` } : {}}
                  transition={{ duration: 0.8, delay: i * 0.06 + 0.1 }}
                />
              </div>
            </div>
          </div>
        ))}
        <div className="flex gap-6 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-primary" />
            <span className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>Employer demand</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-muted-foreground/40" />
            <span className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>Candidate supply</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { AppLayout } from "./AppLayout";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ActivityFeed } from "@/components/ActivityFeed";
import { PrivacyScore } from "@/components/PrivacyScore";
import { BarChart2, TrendingUp, Shield, Zap, Lock } from "lucide-react";
import { generateHash } from "@/lib/demoData";

// Simulated market data (privacy-preserving — no individual data exposed)
const SALARY_BUCKETS = [
  { range: "$60k–$80k", count: 12, pct: 18 },
  { range: "$80k–$100k", count: 19, pct: 28 },
  { range: "$100k–$130k", count: 24, pct: 35 },
  { range: "$130k–$160k", count: 8, pct: 12 },
  { range: "$160k+", count: 5, pct: 7 },
];

const SKILL_DEMAND = [
  { skill: "Solidity", demand: 94, supply: 62 },
  { skill: "FHE", demand: 88, supply: 14 },
  { skill: "ZK Proofs", demand: 82, supply: 21 },
  { skill: "Rust", demand: 76, supply: 48 },
  { skill: "TypeScript", demand: 71, supply: 85 },
  { skill: "Smart Contracts", demand: 68, supply: 55 },
  { skill: "Layer 2", demand: 65, supply: 38 },
  { skill: "Cryptography", demand: 60, supply: 29 },
];

const MATCH_RATE_HISTORY = [
  { day: "Mon", rate: 62 },
  { day: "Tue", rate: 71 },
  { day: "Wed", rate: 58 },
  { day: "Thu", rate: 79 },
  { day: "Fri", rate: 84 },
  { day: "Sat", rate: 67 },
  { day: "Sun", rate: 73 },
];

function BarChart({ data, valueKey, labelKey, color = "#ff4d00" }: {
  data: Record<string, number | string>[];
  valueKey: string;
  labelKey: string;
  color?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const max = Math.max(...data.map(d => Number(d[valueKey])));

  return (
    <div ref={ref} className="space-y-2">
      {data.map((item, i) => (
        <div key={String(item[labelKey])} className="flex items-center gap-3">
          <div className="font-mono-cipher text-xs text-muted-foreground w-24 shrink-0 text-right">
            {item[labelKey]}
          </div>
          <div className="flex-1 h-5 bg-secondary relative overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={inView ? { width: `${(Number(item[valueKey]) / max) * 100}%` } : {}}
              transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
            />
          </div>
          <div className="font-mono-cipher text-xs text-foreground w-8 shrink-0">
            {item[valueKey]}
          </div>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data }: { data: { day: string; rate: number }[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const max = Math.max(...data.map(d => d.rate));
  const min = Math.min(...data.map(d => d.rate));
  const range = max - min;

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((d.rate - min) / range) * 80 - 10,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div ref={ref} className="space-y-2">
      <svg viewBox="0 0 100 100" className="w-full h-32" preserveAspectRatio="none">
        {/* Grid lines */}
        {[25, 50, 75].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#383838" strokeWidth="0.5" />
        ))}
        {/* Line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="#ff4d00"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
        {/* Points */}
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.5"
            fill="#ff4d00"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.8 + i * 0.1 }}
          />
        ))}
      </svg>
      <div className="flex justify-between">
        {data.map(d => (
          <span key={d.day} className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
            {d.day}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const stats = useQuery(api.matches.getProtocolStats);
  const [liveHash, setLiveHash] = useState(generateHash());

  useEffect(() => {
    const t = setInterval(() => setLiveHash(generateHash()), 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
            Analytics — Privacy-Preserving
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
            Protocol Intelligence
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Aggregate market insights computed on encrypted data. No individual records are exposed — all analytics are derived from FHE-computed aggregates.
          </p>
        </div>

        {/* Privacy notice */}
        <div className="border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
          <Lock className="w-4 h-4 text-primary shrink-0" />
          <div className="font-mono-cipher text-xs text-muted-foreground">
            All analytics computed on encrypted data. Individual salary ranges, identities, and match details are never exposed. Aggregates only.
          </div>
          <div className="font-mono-cipher text-xs text-primary shrink-0 ml-auto">
            {liveHash.slice(0, 10)}...
          </div>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border">
          {[
            { label: "Total Profiles", value: stats ? String(stats.totalCandidates + stats.totalJobs) : "—", icon: BarChart2 },
            { label: "Match Rate", value: "73%", icon: TrendingUp },
            { label: "Privacy Score", value: "100%", icon: Shield },
            { label: "FHE Ops Today", value: stats ? String(stats.totalRequests * 3) : "—", icon: Zap },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`p-6 ${i < 3 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
                  {stat.value}
                </div>
                <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest mt-1">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Salary distribution */}
          <div className="border border-border bg-card">
            <div className="px-6 py-4 border-b border-border">
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                Salary Range Distribution
              </div>
              <div className="font-mono-cipher text-muted-foreground mt-0.5" style={{ fontSize: "10px" }}>
                Encrypted aggregate — no individual data exposed
              </div>
            </div>
            <div className="p-6">
              <BarChart data={SALARY_BUCKETS} valueKey="count" labelKey="range" />
            </div>
          </div>

          {/* Match rate over time */}
          <div className="border border-border bg-card">
            <div className="px-6 py-4 border-b border-border">
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                Match Rate — 7 Day
              </div>
              <div className="font-mono-cipher text-muted-foreground mt-0.5" style={{ fontSize: "10px" }}>
                % of FHE computations resulting in match
              </div>
            </div>
            <div className="p-6">
              <LineChart data={MATCH_RATE_HISTORY} />
            </div>
          </div>

          {/* Skill demand vs supply */}
          <SkillDemandChart />
        </div>

        {/* Privacy score + activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PrivacyScore />
          <ActivityFeed maxItems={8} />
        </div>

        {/* Insight cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border">
          {[
            {
              title: "FHE Advantage",
              stat: "0 bits",
              desc: "Information leaked per rejected match. Traditional platforms leak salary history, identity, and application count.",
            },
            {
              title: "Skill Gap",
              stat: "6.3×",
              desc: "Demand-to-supply ratio for FHE expertise. The rarest and most valuable skill in the encrypted compute market.",
            },
            {
              title: "Match Quality",
              stat: "87%",
              desc: "Of matches result in mutual consent reveal — indicating high-quality salary overlap detection by the FHE circuit.",
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-6 space-y-3 ${i < 2 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}
            >
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                {card.title}
              </div>
              <div className="text-3xl font-bold text-primary" style={{ fontFamily: "Space Grotesk" }}>
                {card.stat}
              </div>
              <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
                {card.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
