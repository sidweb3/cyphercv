import { AppLayout } from "./AppLayout";
import { DemoMode } from "@/components/DemoMode";
import { FHECircuit } from "@/components/FHECircuit";
import { BatchMatcher } from "@/components/BatchMatcher";
import { SkillHeatmap } from "@/components/SkillHeatmap";
import { ActivityFeed } from "@/components/ActivityFeed";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Zap, BarChart2, Grid, Activity, Play, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { useAccount } from "wagmi";
import { generateHash, computeMatch } from "@/lib/demoData";
import { toast } from "sonner";

// ─── Live Match Simulator ─────────────────────────────────────────────────────
function LiveMatchSimulator() {
  const { address } = useAccount();
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<{ compatible: boolean; score: number; suggestedSalary?: number } | null>(null);

  const candidateProfile = useQuery(
    api.profiles.getCandidateProfile,
    address ? { walletAddress: address } : "skip"
  );
  const allJobs = useQuery(api.profiles.getAllJobPostings);
  const requestMatch = useMutation(api.matches.requestMatch);
  const createNotification = useMutation(api.notifications.createNotification);

  const steps = [
    "Fetching encrypted candidate profile...",
    "Scanning job pool for compatible specs...",
    "Running FHE.gte(budget, candidateMin)...",
    "Running FHE.gte(candidateExp, requiredExp)...",
    "Computing FHE.and(salaryMatch, expMatch)...",
    "Resolving ebool result — no plaintext exposed...",
    "Match computation complete.",
  ];

  const runSimulation = async () => {
    if (!address || !candidateProfile) {
      toast.error("Submit your candidate profile first");
      return;
    }
    const jobs = allJobs ?? [];
    if (jobs.length === 0) {
      toast.error("No job postings available yet");
      return;
    }

    setRunning(true);
    setResult(null);
    setStep(0);

    // Animate through steps
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 300));
      setStep(i + 1);
    }

    // Pick a random job to match against
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const matchResult = computeMatch(
      80000, 160000,
      120000,
      candidateProfile.experienceYears,
      job.requiredExpYears
    );

    setResult(matchResult);

    // Create match record in Convex
    try {
      await requestMatch({
        candidateWallet: address,
        employerWallet: job.walletAddress,
        candidateProfileId: candidateProfile._id,
        jobPostingId: job._id,
        score: matchResult.score,
        compatible: matchResult.compatible,
        suggestedSalary: matchResult.suggestedSalary,
      });

      if (matchResult.compatible) {
        await createNotification({
          walletAddress: address,
          type: "match_found",
          title: "Match Found!",
          message: `FHE matching found a ${matchResult.score}% compatible employer. Mutual consent required to reveal salary.`,
        });
        toast.success(`Match found — ${matchResult.score}% compatibility`);
      } else {
        toast.info("No match — encrypted rejection, zero info leaked");
      }
    } catch {
      // Match may already exist
    }

    setRunning(false);
  };

  return (
    <div className="border border-border bg-card">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <div className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">Live FHE Match Simulation</div>
          <div className="font-mono-cipher text-muted-foreground mt-0.5" style={{ fontSize: "10px" }}>
            Run the matching protocol against the live job pool
          </div>
        </div>
        <div className="flex items-center gap-3">
          {result && (
            <button
              onClick={() => { setResult(null); setStep(0); }}
              className="font-mono-cipher text-xs border border-border text-muted-foreground px-3 py-1.5 hover:border-primary hover:text-foreground transition-all duration-100 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          )}
          <button
            onClick={runSimulation}
            disabled={running}
            className="font-mono-cipher text-xs bg-primary text-primary-foreground px-4 py-2 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 disabled:opacity-50 flex items-center gap-2"
          >
            {running ? <span className="animate-pulse">▋</span> : <Play className="w-3 h-3" />}
            {running ? "Computing..." : "Run Match"}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Step progress */}
        {(running || step > 0) && (
          <div className="space-y-2">
            {steps.map((s, i) => (
              <motion.div
                key={s}
                initial={{ opacity: 0.2 }}
                animate={{ opacity: step > i ? 1 : step === i ? 0.7 : 0.2 }}
                className="flex items-center gap-3 font-mono-cipher text-xs"
              >
                <span className={step > i ? "text-primary" : step === i ? "text-primary animate-pulse" : "text-muted-foreground"}>
                  {step > i ? "✓" : step === i ? "▋" : "○"}
                </span>
                <span className={step > i ? "text-foreground" : "text-muted-foreground"}>{s}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && !running && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border p-5 space-y-3 ${result.compatible ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <div className="flex items-center gap-3">
                {result.compatible
                  ? <CheckCircle className="w-4 h-4 text-primary" />
                  : <XCircle className="w-4 h-4 text-muted-foreground" />
                }
                <span className={`font-mono-cipher text-xs uppercase tracking-widest ${result.compatible ? "text-primary" : "text-muted-foreground"}`}>
                  {result.compatible ? "Match Found — Encrypted Intersection Detected" : "No Match — Zero Information Leaked"}
                </span>
              </div>
              {result.compatible && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-border p-4 text-center">
                    <div className="text-3xl font-bold text-primary" style={{ fontFamily: "Space Grotesk" }}>{result.score}%</div>
                    <div className="font-mono-cipher text-xs text-muted-foreground mt-1">Compatibility</div>
                  </div>
                  {result.suggestedSalary && (
                    <div className="border border-border p-4 text-center">
                      <motion.div
                        initial={{ filter: "blur(8px)" }}
                        animate={{ filter: "blur(0px)" }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="text-3xl font-bold text-foreground"
                        style={{ fontFamily: "Space Grotesk" }}
                      >
                        ${result.suggestedSalary.toLocaleString()}
                      </motion.div>
                      <div className="font-mono-cipher text-xs text-muted-foreground mt-1">Suggested Salary</div>
                    </div>
                  )}
                </div>
              )}
              <div className="font-mono-cipher text-xs text-muted-foreground">
                {result.compatible
                  ? "Both parties must consent to reveal salary details. Navigate to your profile to sign consent."
                  : "No overlap detected in encrypted utility space. Neither party's constraints were revealed."
                }
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!running && step === 0 && !result && (
          <div className="text-center py-6">
            <div className="font-mono-cipher text-xs text-muted-foreground">
              {candidateProfile
                ? "Profile ready. Click Run Match to simulate FHE matching against the live job pool."
                : "Submit your candidate profile first to run live matching."
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const stats = useQuery(api.matches.getProtocolStats);
  const [activeTab, setActiveTab] = useState<"live" | "demo" | "batch" | "skills" | "feed">("live");
  const [circuitRunning, setCircuitRunning] = useState(false);

  const displayStats = [
    { label: "Active Candidates", value: stats ? String(stats.totalCandidates) : "—" },
    { label: "Active Jobs", value: stats ? String(stats.totalJobs) : "—" },
    { label: "Matches Found", value: stats ? String(stats.totalMatches) : "—" },
    { label: "Privacy Score", value: "100%" },
  ];

  const tabs = [
    { id: "live" as const, label: "Live Match", icon: Play },
    { id: "demo" as const, label: "FHE Demo", icon: Zap },
    { id: "batch" as const, label: "Batch Match", icon: BarChart2 },
    { id: "skills" as const, label: "Skill Matrix", icon: Grid },
    { id: "feed" as const, label: "Live Feed", icon: Activity },
  ];

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Match Engine — Wave 2</div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
            Live FHE Matching
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure encrypted utility curves and run the homomorphic matching protocol in real time.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border">
          {displayStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`p-6 text-center ${i < 3 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}
            >
              <div className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "Space Grotesk" }}>
                {stat.value}
              </div>
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-mono-cipher text-xs uppercase tracking-widest border-b-2 transition-all duration-100 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "live" && <LiveMatchSimulator />}
          {activeTab === "demo" && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => { setCircuitRunning(true); setTimeout(() => setCircuitRunning(false), 3000); }}
                  className="font-mono-cipher text-xs border border-border text-muted-foreground px-3 py-1.5 hover:border-primary hover:text-foreground transition-all duration-100"
                >
                  Execute Circuit →
                </button>
              </div>
              <FHECircuit running={circuitRunning} />
              <DemoMode />
            </div>
          )}
          {activeTab === "batch" && <BatchMatcher />}
          {activeTab === "skills" && (
            <SkillHeatmap
              candidateSkills={["Solidity", "TypeScript", "React", "FHE", "Smart Contracts", "DeFi"]}
              employerSkills={["Solidity", "TypeScript", "Node.js", "Smart Contracts", "Layer 2", "Cryptography"]}
            />
          )}
          {activeTab === "feed" && <ActivityFeed maxItems={12} />}
        </motion.div>
      </div>
    </AppLayout>
  );
}