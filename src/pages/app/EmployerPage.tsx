import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TxProgressBar } from "@/components/TxProgressBar";
import { Link } from "react-router";
import { AppLayout } from "./AppLayout";
import { EncryptedInput } from "@/components/EncryptedInput";
import { ConsentReveal } from "@/components/ConsentReveal";
import { SkillHeatmap } from "@/components/SkillHeatmap";
import { FHECircuit } from "@/components/FHECircuit";
import { commitJobPosting } from "@/lib/demoData";
import { isContractDeployed } from "@/lib/fhenix";
import { onChainSubmitJobPosting, onChainEmployerConsent } from "@/lib/contract-calls";
import {
  CheckCircle, Clock, XCircle, Eye, EyeOff, Lock, ExternalLink,
  Plus, Trash2, ToggleLeft, ToggleRight, Briefcase, X,
} from "lucide-react";
import { useAccount, useConnect, useConnectorClient, usePublicClient } from "wagmi";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

function ConnectWalletButton({ className }: { className?: string }) {
  const { connect, connectors } = useConnect();
  return (
    <button onClick={() => { const c = connectors.find(c => c.id === 'injected') || connectors[0]; if (c) connect({ connector: c }); }} className={className}>
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

// ─── New Job Modal ─────────────────────────────────────────────────────────────
function NewJobModal({
  address,
  onClose,
  connectorClient,
  publicClient,
  chainId,
}: {
  address: string;
  onClose: () => void;
  connectorClient: any;
  publicClient: any;
  chainId: number | undefined;
}) {
  const createJob = useMutation(api.profiles.createJobPosting);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState(130000);
  const [requiredExp, setRequiredExp] = useState(5);
  const [minSkillLevel, setMinSkillLevel] = useState(7);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Solidity", "TypeScript"]);
  const [posting, setPosting] = useState(false);
  const [postTxStep, setPostTxStep] = useState(-1);

  const POST_STEPS = [
    { label: "Encrypting job spec", detail: "FHE commitment encoding for budget, experience, skills..." },
    { label: "Awaiting wallet approval", detail: "Your wallet popup should open — this can take up to 60 seconds. Please wait and don't close this page." },
    { label: "Broadcasting on-chain", detail: "Sending encrypted job spec to CipherCV contract..." },
    { label: "Waiting for confirmation", detail: "On-chain confirmation may take 15–30 seconds..." },
    { label: "Finalizing job posting", detail: "Persisting encrypted job posting..." },
  ];

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handlePost = async () => {
    if (!title.trim()) { toast.error("Job title is required"); return; }
    setPosting(true);
    setPostTxStep(0);
    try {
      const jHash = commitJobPosting(address, budget, requiredExp, selectedSkills.length);
      const bHash = commitJobPosting(address, budget, 0, 0);
      const eHash = commitJobPosting(address, 0, requiredExp, 0);

      // Try on-chain submission
      const isOnChainNetwork = (chainId === 421614 || chainId === 11155111) && isContractDeployed("CipherCV");
      if (isOnChainNetwork && connectorClient && publicClient) {
        setPostTxStep(1); // Awaiting wallet approval
        try {
          const { hash, explorerUrl } = await onChainSubmitJobPosting(
            connectorClient,
            publicClient,
            { budget, requiredExp, requiredSkillScore: minSkillLevel * 10 }
          );
          setPostTxStep(2); // Broadcasting
          toast.success(
            <span>Job spec submitted on-chain — <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="underline">View tx ↗</a></span>
          );
          setPostTxStep(3); // Waiting for confirmation
        } catch (onChainErr: any) {
          toast.error(`On-chain tx failed: ${onChainErr?.shortMessage ?? onChainErr?.message ?? "Unknown error"}`);
        }
      }

      setPostTxStep(4); // Finalizing
      await createJob({
        walletAddress: address,
        title: title.trim(),
        description: description.trim(),
        skills: selectedSkills,
        budget,
        requiredExpYears: requiredExp,
        jobHash: jHash,
        budgetHash: bHash,
        expHash: eHash,
        requiredSkillCount: selectedSkills.length,
      });
      setPostTxStep(POST_STEPS.length); // Done
      toast.success("Job posting created");
      onClose();
    } catch {
      toast.error("Failed to create job posting");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border bg-card"
      >
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">New Job Posting</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Job Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Senior Solidity Engineer"
              className="w-full bg-background border border-border px-4 py-2.5 font-mono-cipher text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief role description (optional)"
              rows={3}
              className="w-full bg-background border border-border px-4 py-2.5 font-mono-cipher text-xs text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Encrypted inputs */}
          <EncryptedInput label="Compensation Budget" min={40000} max={400000} value={budget} onChange={setBudget} />
          <EncryptedInput label="Required Experience (Years)" min={0} max={20} value={requiredExp} onChange={setRequiredExp} />
          <EncryptedInput label="Minimum Skill Level" min={1} max={10} value={minSkillLevel} onChange={setMinSkillLevel} />

          {/* Skills */}
          <div className="space-y-2">
            <label className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Required Skills</label>
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

          <button
            onClick={handlePost}
            disabled={posting}
            className="w-full py-4 bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest font-mono-cipher disabled:opacity-60 transition-all duration-100 hover:bg-foreground hover:text-background"
          >
            {!posting
              ? "Encrypt & Post Job →"
              : postTxStep === 0 ? "Encrypting job spec..."
              : postTxStep === 1 ? "Waiting for wallet — please don't close this page..."
              : postTxStep === 2 ? "Broadcasting on-chain..."
              : postTxStep === 3 ? "Waiting for confirmation..."
              : postTxStep === 4 ? "Finalizing..."
              : "Done ✓"}
          </button>
          <AnimatePresence>
            {posting && (
              <TxProgressBar
                steps={POST_STEPS}
                currentStep={postTxStep}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Job Card ──────────────────────────────────────────────────────────────────
function JobCard({
  job,
  walletAddress,
  onDelete,
  onToggle,
}: {
  job: any;
  walletAddress: string;
  onDelete: (id: Id<"jobPostings">) => void;
  onToggle: (id: Id<"jobPostings">) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isActive = job.active ?? true;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border bg-card transition-colors ${isActive ? "border-border" : "border-border/40 opacity-60"}`}
    >
      <div className="px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Briefcase className="w-4 h-4 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="font-mono-cipher text-sm text-foreground truncate">{job.title ?? "Untitled Job"}</div>
            <div className="font-mono-cipher text-muted-foreground flex items-center gap-3 mt-0.5" style={{ fontSize: "10px" }}>
              <span>{job.requiredExpYears}yr exp</span>
              <span>·</span>
              <span>{job.requiredSkillCount} skills</span>
              {job.skills?.length > 0 && (
                <>
                  <span>·</span>
                  <span>{job.skills.slice(0, 3).join(", ")}{job.skills.length > 3 ? ` +${job.skills.length - 3}` : ""}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`font-mono-cipher border px-2 py-0.5 ${isActive ? "border-primary/40 text-primary" : "border-border text-muted-foreground"}`} style={{ fontSize: "9px" }}>
            {isActive ? "ACTIVE" : "PAUSED"}
          </span>
          <button onClick={() => onToggle(job._id)} className="text-muted-foreground hover:text-foreground transition-colors p-1" title={isActive ? "Pause" : "Activate"}>
            {isActive ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4" />}
          </button>
          <button onClick={() => setExpanded(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors p-1 font-mono-cipher text-xs">
            {expanded ? "▲" : "▼"}
          </button>
          <button onClick={() => onDelete(job._id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 py-4 space-y-3">
              {job.description && (
                <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{job.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-border p-3">
                  <div className="font-mono-cipher text-muted-foreground mb-1" style={{ fontSize: "10px" }}>Budget</div>
                  <div className="font-mono-cipher text-xs text-primary">[ENCRYPTED]</div>
                  <div className="font-mono-cipher text-muted-foreground mt-0.5" style={{ fontSize: "9px" }}>{job.budgetHash?.slice(0, 14)}...</div>
                </div>
                <div className="border border-border p-3">
                  <div className="font-mono-cipher text-muted-foreground mb-1" style={{ fontSize: "10px" }}>Job Hash</div>
                  <div className="font-mono-cipher text-xs text-foreground">{job.jobHash?.slice(0, 14)}...</div>
                </div>
              </div>
              {job.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((s: string) => (
                    <span key={s} className="font-mono-cipher border border-border text-muted-foreground px-2 py-0.5" style={{ fontSize: "9px" }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function EmployerPage() {
  const { address, isConnected, chainId } = useAccount();
  const { data: connectorClient } = useConnectorClient();
  const publicClient = usePublicClient();
  const [revealedCandidates, setRevealedCandidates] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"jobs" | "pipeline" | "skills" | "circuit">("jobs");
  const [consentStates, setConsentStates] = useState<Record<string, { candidate: boolean; employer: boolean }>>({});
  const [showNewJobModal, setShowNewJobModal] = useState(false);

  const deleteJob = useMutation(api.profiles.deleteJobPosting);
  const toggleJob = useMutation(api.profiles.toggleJobActive);
  const consentReveal = useMutation(api.matches.consentReveal);

  const jobPostings = useQuery(
    api.profiles.getJobPostings,
    address ? { walletAddress: address } : "skip"
  );
  const employerMatches = useQuery(
    api.matches.getEmployerMatches,
    address ? { walletAddress: address } : "skip"
  );

  const handleDeleteJob = async (jobId: Id<"jobPostings">) => {
    if (!address) return;
    try {
      await deleteJob({ jobId, walletAddress: address });
      toast.success("Job posting deleted");
    } catch {
      toast.error("Failed to delete job");
    }
  };

  const handleToggleJob = async (jobId: Id<"jobPostings">) => {
    if (!address) return;
    try {
      await toggleJob({ jobId, walletAddress: address });
    } catch {
      toast.error("Failed to toggle job status");
    }
  };

  const handleEmployerConsent = async (matchId: string) => {
    try {
      const isOnChainNetwork = (chainId === 421614 || chainId === 11155111) && isContractDeployed("CipherCV");
      if (isOnChainNetwork) {
        const match = (employerMatches ?? []).find(m => m._id === matchId);
        if (match?.candidateWallet) {
          try {
            toast.info("Sending consent transaction on-chain...");
            const { explorerUrl } = await onChainEmployerConsent(match.candidateWallet as `0x${string}`);
            toast.success(
              <span>Consent recorded on-chain — <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="underline">View tx</a></span>
            );
          } catch (onChainErr: any) {
            toast.error(`On-chain consent failed: ${onChainErr?.shortMessage ?? onChainErr?.message ?? "Unknown error"}`);
          }
        }
      }
      await consentReveal({ matchId: matchId as any, role: "employer" });
      setConsentStates(prev => ({ ...prev, [matchId]: { ...prev[matchId], employer: true } }));
      toast.success("Consent signed");
    } catch {
      toast.error("Failed to sign consent");
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedCandidates(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full space-y-6">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg uppercase tracking-widest" style={{ fontFamily: "Space Grotesk" }}>Cipher CV</span>
          </div>
          <div className="border border-border bg-card p-8 space-y-6">
            <div className="space-y-2">
              <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Access Restricted</div>
              <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>Employer Dashboard</h2>
              <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">Connect your wallet to access the encrypted employer dashboard.</p>
            </div>
            <ConnectWalletButton className="w-full font-mono-cipher text-sm bg-primary text-primary-foreground py-4 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 font-bold" />
            <Link to="/" className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors block">← Back to Landing</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const matches = employerMatches ?? [];
  const jobs = jobPostings ?? [];
  const activeJobs = jobs.filter(j => j.active ?? true);

  return (
    <AppLayout>
      <AnimatePresence>
        {showNewJobModal && (
          <NewJobModal
            address={address!}
            onClose={() => setShowNewJobModal(false)}
            connectorClient={connectorClient}
            publicClient={publicClient}
            chainId={chainId}
          />
        )}
      </AnimatePresence>

      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Employer Dashboard</div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>Job Postings</h1>
            <p className="text-muted-foreground text-sm">Post encrypted job requirements. Candidates are matched without revealing your budget or their identity.</p>
          </div>
          <button
            onClick={() => setShowNewJobModal(true)}
            className="shrink-0 flex items-center gap-2 font-mono-cipher text-xs bg-primary text-primary-foreground px-4 py-2.5 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            New Job
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id: "jobs" as const, label: `Jobs (${jobs.length})` },
            { id: "pipeline" as const, label: `Pipeline (${matches.length})` },
            { id: "skills" as const, label: "Skill Matrix" },
            { id: "circuit" as const, label: "FHE Circuit" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-mono-cipher text-xs uppercase tracking-widest border-b-2 transition-all duration-100 ${
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "jobs" && (
            <motion.div key="jobs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total Jobs", value: jobs.length },
                  { label: "Active", value: activeJobs.length },
                  { label: "Pipeline", value: matches.length },
                ].map(stat => (
                  <div key={stat.label} className="border border-border bg-card p-4 text-center">
                    <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>{stat.value}</div>
                    <div className="font-mono-cipher text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Job list */}
              {jobs.length === 0 ? (
                <div className="border border-border p-12 text-center space-y-4">
                  <Briefcase className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <div className="space-y-2">
                    <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">No Job Postings Yet</div>
                    <p className="font-mono-cipher text-xs text-muted-foreground">Create your first encrypted job posting to enter the matching pool.</p>
                  </div>
                  <button
                    onClick={() => setShowNewJobModal(true)}
                    className="inline-flex items-center gap-2 font-mono-cipher text-xs bg-primary text-primary-foreground px-4 py-2.5 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create First Job
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.map(job => (
                    <JobCard
                      key={job._id}
                      job={job}
                      walletAddress={address!}
                      onDelete={handleDeleteJob}
                      onToggle={handleToggleJob}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "pipeline" && (
            <motion.div key="pipeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {matches.length === 0 ? (
                <div className="border border-border p-12 text-center">
                  <div className="font-mono-cipher text-xs text-muted-foreground">No candidates yet. Post a job to enter the matching pool.</div>
                </div>
              ) : (
                matches.map((match, i) => (
                  <motion.div key={match._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="border border-border bg-card">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {statusIcon(match.status as MatchStatus)}
                        <div>
                          <div className="font-mono-cipher text-xs text-foreground">Candidate {match.candidateWallet.slice(0, 6)}...{match.candidateWallet.slice(-4)}</div>
                          <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>{match.candidateWallet}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {match.status === "matched" && (
                          <button onClick={() => toggleReveal(match._id)} className="text-muted-foreground hover:text-foreground transition-colors">
                            {revealedCandidates.has(match._id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <span className={`font-mono-cipher text-xs px-2 py-1 border ${match.status === "matched" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
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
            <motion.div key="skills" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SkillHeatmap
                candidateSkills={["Solidity", "TypeScript", "React", "FHE", "Smart Contracts", "DeFi"]}
                employerSkills={jobs[0]?.skills ?? ["Solidity", "TypeScript"]}
              />
            </motion.div>
          )}

          {activeTab === "circuit" && (
            <motion.div key="circuit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <FHECircuit />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}