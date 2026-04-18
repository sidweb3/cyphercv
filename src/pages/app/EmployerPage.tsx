import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router";
import { AppLayout } from "./AppLayout";
import { EncryptedInput } from "@/components/EncryptedInput";
import { ConsentReveal } from "@/components/ConsentReveal";
import { SkillHeatmap } from "@/components/SkillHeatmap";
import { FHECircuit } from "@/components/FHECircuit";
import { commitJobPosting } from "@/lib/demoData";
import { CheckCircle, Clock, XCircle, Eye, EyeOff, Lock } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

function ConnectWalletButton({ className }: { className?: string }) {
  const { connect, connectors } = useConnect();
  const handleConnect = () => {
    const c = connectors.find(c => c.id === 'injected') || connectors[0];
    if (c) connect({ connector: c });
  };
  return (
    <button onClick={handleConnect} className={className}>
      Connect Wallet →
    </button>
  );
}

type MatchStatus = "pending" | "matched" | "rejected";

const REQUIRED_SKILLS = [
  "Solidity", "Rust", "TypeScript", "React", "Node.js",
  "Python", "Go", "ZK Proofs", "FHE", "Smart Contracts",
  "DeFi", "Layer 2", "Cryptography",
];

const CANDIDATE_SKILLS_DEMO = ["Solidity", "TypeScript", "React", "FHE", "Smart Contracts", "DeFi"];

export default function EmployerPage() {
  const { address, isConnected } = useAccount();
  const [budget, setBudget] = useState(130000);
  const [requiredExp, setRequiredExp] = useState(5);
  const [minSkillLevel, setMinSkillLevel] = useState(7);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Solidity", "TypeScript"]);
  const jobHash = address ? commitJobPosting(address, budget, requiredExp, selectedSkills.length) : "0x0000000000000000";
  const [posting, setPosting] = useState(false);
  const [revealedCandidates, setRevealedCandidates] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"job" | "pipeline" | "skills" | "circuit">("job");
  const [consentStates, setConsentStates] = useState<Record<string, { candidate: boolean; employer: boolean }>>({});
  const [circuitRunning, setCircuitRunning] = useState(false);

  const submitJob = useMutation(api.profiles.submitJobPosting);
  const consentReveal = useMutation(api.matches.consentReveal);
  const existingJob = useQuery(
    api.profiles.getJobPosting,
    address ? { walletAddress: address } : "skip"
  );
  const employerMatches = useQuery(
    api.matches.getEmployerMatches,
    address ? { walletAddress: address } : "skip"
  );

  const jobPosted = existingJob?.submitted ?? false;

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handlePostJob = async () => {
    if (!address) return;
    setPosting(true);
    try {
      const jHash = commitJobPosting(address, budget, requiredExp, selectedSkills.length);
      const bHash = commitJobPosting(address, budget, 0, 0);
      const eHash = commitJobPosting(address, 0, requiredExp, 0);
      await submitJob({
        walletAddress: address,
        jobHash: jHash,
        budgetHash: bHash,
        expHash: eHash,
        requiredSkillCount: selectedSkills.length,
        requiredExpYears: requiredExp,
      });
      toast.success("Job spec encrypted & committed");
    } catch {
      toast.error("Failed to post job");
    } finally {
      setPosting(false);
    }
  };

  const handleEmployerConsent = async (matchId: string) => {
    try {
      await consentReveal({ matchId: matchId as any, role: "employer" });
      setConsentStates(prev => ({
        ...prev,
        [matchId]: { ...prev[matchId], employer: true },
      }));
      toast.success("Consent signed");
    } catch {
      toast.error("Failed to sign consent");
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedCandidates(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusIcon = (status: MatchStatus) => {
    if (status === "matched") return <CheckCircle className="w-3.5 h-3.5 text-primary" />;
    if (status === "pending") return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
    return <XCircle className="w-3.5 h-3.5 text-destructive" />;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-6"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg uppercase tracking-widest" style={{ fontFamily: "Space Grotesk" }}>
              Cipher CV
            </span>
          </div>
          <div className="border border-border bg-card p-8 space-y-6">
            <div className="space-y-2">
              <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Access Restricted</div>
              <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
                Employer Dashboard
              </h2>
              <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
                Connect your wallet to access the encrypted employer dashboard.
              </p>
            </div>
            <ConnectWalletButton className="w-full font-mono-cipher text-sm bg-primary text-primary-foreground py-4 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 font-bold" />
            <Link to="/" className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors block">
              ← Back to Landing
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const matches = employerMatches ?? [];

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
            Employer Dashboard — Wave 2
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
            Encrypted Job Spec
          </h1>
          <p className="text-muted-foreground text-sm">
            Post encrypted job requirements. Candidates are matched without revealing your budget or their identity.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id: "job" as const, label: "Job Spec" },
            { id: "pipeline" as const, label: `Pipeline (${matches.length})` },
            { id: "skills" as const, label: "Skill Matrix" },
            { id: "circuit" as const, label: "FHE Circuit" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-mono-cipher text-xs uppercase tracking-widest border-b-2 transition-all duration-100 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "job" && (
            <motion.div
              key="job"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="border border-border bg-card">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
                      Job Constraint Configuration
                    </span>
                    <span className="encrypted-block">{jobHash.slice(0, 12)}...</span>
                  </div>
                  <div className="p-6 space-y-6">
                    <EncryptedInput label="Compensation Budget" min={40000} max={400000} value={budget} onChange={setBudget} />
                    <EncryptedInput label="Required Experience (Years)" min={0} max={20} value={requiredExp} onChange={setRequiredExp} />
                    <EncryptedInput label="Minimum Skill Level" min={1} max={10} value={minSkillLevel} onChange={setMinSkillLevel} />
                  </div>
                </div>

                <div className="border border-border bg-card">
                  <div className="px-6 py-4 border-b border-border">
                    <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
                      Required Skills — Encrypted
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2">
                      {REQUIRED_SKILLS.map(skill => (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`font-mono-cipher text-xs px-3 py-1.5 border transition-all duration-100 ${
                            selectedSkills.includes(skill)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                          }`}
                        >
                          {selectedSkills.includes(skill) ? "█ " : ""}{skill}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={handlePostJob}
                  disabled={posting || jobPosted}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest font-mono-cipher disabled:opacity-60 transition-all duration-100 hover:bg-foreground hover:text-background"
                >
                  {posting
                    ? "Encrypting Job Spec..."
                    : jobPosted
                    ? "✓ Job Spec Encrypted & Committed"
                    : "Encrypt & Post Job Spec"}
                </motion.button>
              </div>

              <div className="space-y-4">
                <div className="border border-border bg-card p-6 space-y-4">
                  <div className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
                    Job Spec Status
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Company Identity", value: "[ENCRYPTED]", ok: true },
                      { label: "Budget", value: "[ENCRYPTED]", ok: true },
                      { label: "Required Skills", value: `${selectedSkills.length} vectors`, ok: true },
                      { label: "Experience Req.", value: "[ENCRYPTED]", ok: true },
                      { label: "On-chain", value: jobPosted ? "Committed" : "Pending", ok: jobPosted },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="font-mono-cipher text-xs text-muted-foreground">{item.label}</span>
                        <span className={`font-mono-cipher text-xs ${item.ok ? "text-primary" : "text-muted-foreground"}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-border bg-card p-6 space-y-3">
                  <div className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
                    Pipeline Stats
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Total", value: matches.length },
                      { label: "Matched", value: matches.filter(m => m.status === "matched").length },
                      { label: "Pending", value: matches.filter(m => m.status === "pending").length },
                      { label: "Rejected", value: matches.filter(m => m.status === "rejected").length },
                    ].map(stat => (
                      <div key={stat.label} className="border border-border p-3 text-center">
                        <div className="text-xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
                          {stat.value}
                        </div>
                        <div className="font-mono-cipher text-xs text-muted-foreground">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "pipeline" && (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {matches.length === 0 ? (
                <div className="border border-border p-12 text-center">
                  <div className="font-mono-cipher text-xs text-muted-foreground">
                    No candidates yet. Post your job spec to enter the matching pool.
                  </div>
                </div>
              ) : (
                matches.map((match, i) => (
                  <motion.div
                    key={match._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border border-border bg-card"
                  >
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {statusIcon(match.status as MatchStatus)}
                        <div>
                          <div className="font-mono-cipher text-xs text-foreground">
                            Candidate {match.candidateWallet.slice(0, 6)}...{match.candidateWallet.slice(-4)}
                          </div>
                          <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
                            {match.candidateWallet}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {match.status === "matched" && (
                          <button onClick={() => toggleReveal(match._id)} className="text-muted-foreground hover:text-foreground transition-colors">
                            {revealedCandidates.has(match._id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <span className={`font-mono-cipher text-xs px-2 py-1 border ${
                          match.status === "matched" ? "border-primary text-primary" :
                          match.status === "rejected" ? "border-border text-muted-foreground" :
                          "border-border text-muted-foreground"
                        }`}>
                          {match.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {match.status === "matched" && (
                      <div className="p-6">
                        <ConsentReveal
                          matchId={match._id}
                          candidateConsented={consentStates[match._id]?.candidate ?? match.candidateConsented}
                          employerConsented={consentStates[match._id]?.employer ?? match.employerConsented}
                          salaryRevealed={match.salaryRevealed ?? false}
                          suggestedSalary={match.suggestedSalary}
                          score={match.score}
                          onCandidateConsent={() => {}}
                          onEmployerConsent={() => handleEmployerConsent(match._id)}
                          role="employer"
                        />
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === "skills" && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <SkillHeatmap
                candidateSkills={CANDIDATE_SKILLS_DEMO}
                employerSkills={selectedSkills}
              />
            </motion.div>
          )}

          {activeTab === "circuit" && (
            <motion.div
              key="circuit"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex justify-end">
                <button
                  onClick={() => { setCircuitRunning(true); setTimeout(() => setCircuitRunning(false), 3000); }}
                  className="font-mono-cipher text-xs bg-primary text-primary-foreground px-4 py-2 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100"
                >
                  Execute FHE Circuit →
                </button>
              </div>
              <FHECircuit running={circuitRunning} />
              <div className="border border-border bg-card p-6 space-y-3">
                <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                  Circuit Inputs (Encrypted)
                </div>
                {[
                  { label: "candidateSalaryMin", value: "[euint256]" },
                  { label: "candidateSalaryMax", value: "[euint256]" },
                  { label: "employerBudget", value: "[euint256]" },
                  { label: "candidateExp", value: "[euint256]" },
                  { label: "requiredExp", value: "[euint256]" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="font-mono-cipher text-xs text-muted-foreground">{item.label}</span>
                    <span className="font-mono-cipher text-xs text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}