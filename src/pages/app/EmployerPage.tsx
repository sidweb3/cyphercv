import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router";
import { AppLayout } from "./AppLayout";
import { EncryptedInput } from "@/components/EncryptedInput";
import { generateHash } from "@/lib/demoData";
import { CheckCircle, Clock, XCircle, Eye, EyeOff, Lock } from "lucide-react";
import { useAccount, useConnect } from "wagmi";

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

interface CandidateRecord {
  id: string;
  hash: string;
  label: string;
  status: MatchStatus;
  score?: number;
  salary?: number;
  timestamp: string;
}

const MOCK_CANDIDATES: CandidateRecord[] = [
  {
    id: "c1",
    hash: "0x7f3a9b2c4e1d8f5a",
    label: "Candidate #A7F3",
    status: "matched",
    score: 94,
    salary: 125000,
    timestamp: "2 hours ago",
  },
  {
    id: "c2",
    hash: "0x3d8e2f1a9c7b4e6d",
    label: "Candidate #3D8E",
    status: "pending",
    timestamp: "4 hours ago",
  },
  {
    id: "c3",
    hash: "0x5c9f2e8a1b4d7e3c",
    label: "Candidate #5C9F",
    status: "rejected",
    timestamp: "8 hours ago",
  },
  {
    id: "c4",
    hash: "0x1a9c7b4e6d3d8e2f",
    label: "Candidate #1A9C",
    status: "matched",
    score: 81,
    salary: 118000,
    timestamp: "1 day ago",
  },
  {
    id: "c5",
    hash: "0x8a1b4d7e3c5c9f2e",
    label: "Candidate #8A1B",
    status: "pending",
    timestamp: "1 day ago",
  },
];

const REQUIRED_SKILLS = [
  "Solidity", "Rust", "TypeScript", "React", "Node.js",
  "Python", "Go", "ZK Proofs", "FHE", "Smart Contracts",
  "DeFi", "Layer 2", "Cryptography",
];

export default function EmployerPage() {
  const { isConnected } = useAccount();
  const [budget, setBudget] = useState(130000);
  const [requiredExp, setRequiredExp] = useState(5);
  const [minExp, setMinExp] = useState(3);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Solidity", "TypeScript"]);
  const [jobHash] = useState(generateHash);
  const [jobPosted, setJobPosted] = useState(false);
  const [posting, setPosting] = useState(false);
  const [candidates, setCandidates] = useState<CandidateRecord[]>(MOCK_CANDIDATES);
  const [revealedCandidates, setRevealedCandidates] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"post" | "pipeline">("post");

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handlePostJob = () => {
    setPosting(true);
    setTimeout(() => {
      setPosting(false);
      setJobPosted(true);
      setActiveTab("pipeline");
    }, 2200);
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

  // Wallet gate
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
                Connect your wallet to post encrypted job specs and view matched candidates.
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

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
            Employer Dashboard
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
            Encrypted Job Spec
          </h1>
          <p className="text-muted-foreground text-sm">
            Post encrypted job requirements. Candidates are matched without revealing your budget or their salary.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(["post", "pipeline"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-mono-cipher text-xs uppercase tracking-widest px-6 py-3 border-b-2 transition-all duration-100 ${
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "post" ? "Post Job" : `Pipeline (${candidates.length})`}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "post" ? (
            <motion.div
              key="post"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Job spec form */}
              <div className="lg:col-span-2 space-y-6">
                <div className="border border-border bg-card">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
                      Constraint Set Configuration
                    </span>
                    <span className="encrypted-block">{jobHash.slice(0, 12)}...</span>
                  </div>
                  <div className="p-6 space-y-6">
                    <EncryptedInput
                      label="Compensation Budget"
                      min={40000}
                      max={400000}
                      value={budget}
                      onChange={setBudget}
                    />
                    <EncryptedInput
                      label="Required Experience (Years)"
                      min={0}
                      max={20}
                      value={requiredExp}
                      onChange={setRequiredExp}
                    />
                    <EncryptedInput
                      label="Minimum Experience Floor"
                      min={0}
                      max={20}
                      value={minExp}
                      onChange={setMinExp}
                    />
                  </div>
                </div>

                {/* Required skills */}
                <div className="border border-border bg-card">
                  <div className="px-6 py-4 border-b border-border">
                    <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
                      Required Skill Vector — Encrypted
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
                    ? "✓ Job Spec Encrypted & Live"
                    : "Encrypt & Post Job Spec"}
                </motion.button>

                {posting && (
                  <div className="border border-border p-4 space-y-2">
                    {[
                      "Generating constraint encryption...",
                      "Encrypting budget range...",
                      "Encrypting skill requirements...",
                      "Broadcasting to Fhenix...",
                    ].map((step, i) => (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.45 }}
                        className="font-mono-cipher text-xs text-muted-foreground flex items-center gap-2"
                      >
                        <span className="text-primary animate-pulse">▋</span> {step}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-4">
                <div className="border border-border bg-card p-6 space-y-4">
                  <div className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
                    Job Spec Status
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Budget", value: "[ENCRYPTED]", ok: true },
                      { label: "Experience Req.", value: "[ENCRYPTED]", ok: true },
                      { label: "Skills", value: `${selectedSkills.length} required`, ok: true },
                      { label: "Bias Indicators", value: "None exposed", ok: true },
                      { label: "On-chain", value: jobPosted ? "Live" : "Draft", ok: jobPosted },
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
                      { label: "Total", value: candidates.length },
                      { label: "Matched", value: candidates.filter(c => c.status === "matched").length },
                      { label: "Pending", value: candidates.filter(c => c.status === "pending").length },
                      { label: "Rejected", value: candidates.filter(c => c.status === "rejected").length },
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
          ) : (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="border border-border bg-card">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
                    Candidate Pipeline — All Identities Encrypted
                  </span>
                  <span className="font-mono-cipher text-xs text-muted-foreground">
                    {candidates.length} candidates
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {candidates.map((candidate, i) => (
                    <motion.div
                      key={candidate.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="px-6 py-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {statusIcon(candidate.status)}
                        <div className="min-w-0">
                          <div className="font-mono-cipher text-xs text-foreground">
                            {candidate.label}
                          </div>
                          <div className="font-mono-cipher text-xs text-muted-foreground">
                            {candidate.hash.slice(0, 14)}... · {candidate.timestamp}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {candidate.status === "matched" && (
                          <AnimatePresence mode="wait">
                            {revealedCandidates.has(candidate.id) ? (
                              <motion.div
                                key="revealed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-right"
                              >
                                <div className="font-mono-cipher text-xs text-primary">{candidate.score}% match</div>
                                <div className="font-mono-cipher text-xs text-foreground">${candidate.salary?.toLocaleString()}</div>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="hidden"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-right"
                              >
                                <div className="encrypted-block">██% match</div>
                                <div className="encrypted-block mt-1">$███,███</div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        )}
                        {candidate.status === "rejected" && (
                          <div className="font-mono-cipher text-xs text-muted-foreground">
                            No overlap
                          </div>
                        )}
                        {candidate.status === "pending" && (
                          <div className="font-mono-cipher text-xs text-muted-foreground animate-pulse">
                            Computing...
                          </div>
                        )}
                        {candidate.status === "matched" && (
                          <button
                            onClick={() => toggleReveal(candidate.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {revealedCandidates.has(candidate.id) ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Privacy note */}
              <div className="border border-border p-4 bg-card">
                <div className="font-mono-cipher text-xs text-muted-foreground space-y-1">
                  <div className="text-foreground mb-2">Privacy Guarantees Active</div>
                  {[
                    "Candidate identities remain encrypted until mutual consent",
                    "Salary figures revealed only upon match confirmation",
                    "Rejection provides zero information about candidate constraints",
                    "All matching computed on Fhenix fhEVM — no plaintext exposure",
                  ].map(item => (
                    <div key={item} className="flex items-start gap-2">
                      <span className="text-primary">—</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}