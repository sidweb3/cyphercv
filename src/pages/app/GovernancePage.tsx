import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "./AppLayout";
import { generateHash } from "@/lib/demoData";
import { Vote, CheckCircle, Clock, XCircle, Users, Zap, Shield, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const CATEGORY_COLORS: Record<string, string> = {
  parameter: "border-primary text-primary",
  upgrade: "border-foreground text-foreground",
  treasury: "border-muted-foreground text-muted-foreground",
  emergency: "border-destructive text-destructive",
};

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

function ProposalCard({
  proposal,
  myVote,
  onVote,
}: {
  proposal: {
    _id: string;
    proposalId: string;
    title: string;
    description: string;
    category: string;
    status: string;
    votesFor: number;
    votesAgainst: number;
    quorum: number;
    endsAt: number;
    proposerWallet: string;
  };
  myVote: { vote: "for" | "against" } | null | undefined;
  onVote: (proposalId: string, vote: "for" | "against") => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [voting, setVoting] = useState<"for" | "against" | null>(null);

  const total = proposal.votesFor + proposal.votesAgainst;
  const forPct = total > 0 ? (proposal.votesFor / total) * 100 : 50;
  const quorumPct = Math.min(100, (total / proposal.quorum) * 100);
  const daysLeft = Math.max(0, Math.ceil((proposal.endsAt - Date.now()) / 86400000));

  const handleVote = async (vote: "for" | "against") => {
    if (proposal.status !== "active" || myVote) return;
    setVoting(vote);
    await new Promise(r => setTimeout(r, 1200));
    onVote(proposal.proposalId, vote);
    setVoting(null);
  };

  const statusIcon = () => {
    if (proposal.status === "active") return <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />;
    if (proposal.status === "passed") return <CheckCircle className="w-3 h-3 text-primary" />;
    if (proposal.status === "rejected") return <XCircle className="w-3 h-3 text-muted-foreground" />;
    return <Clock className="w-3 h-3 text-muted-foreground" />;
  };

  return (
    <motion.div layout className="border border-border bg-card">
      <div
        className="px-6 py-5 flex items-start gap-4 cursor-pointer hover:bg-secondary/20 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2 mt-0.5">{statusIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-bold text-foreground text-sm mb-1" style={{ fontFamily: "Space Grotesk" }}>
                {proposal.title}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`font-mono-cipher border px-2 py-0.5 ${CATEGORY_COLORS[proposal.category] ?? "border-border text-muted-foreground"}`} style={{ fontSize: "9px" }}>
                  {proposal.category.toUpperCase()}
                </span>
                <span className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>{proposal.proposalId}</span>
                <span className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
                  by {proposal.proposerWallet.slice(0, 10)}...
                </span>
                {proposal.status === "active" && (
                  <span className="font-mono-cipher text-primary" style={{ fontSize: "10px" }}>{daysLeft}d remaining</span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-muted-foreground">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {/* Vote bar */}
          <div className="mt-4 space-y-1">
            <div className="flex justify-between">
              <span className="font-mono-cipher text-xs text-primary">{proposal.votesFor.toLocaleString()} FOR</span>
              <span className="font-mono-cipher text-xs text-muted-foreground">{proposal.votesAgainst.toLocaleString()} AGAINST</span>
            </div>
            <div className="h-1.5 bg-secondary relative overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${forPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between">
              <span className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
                Quorum: {quorumPct.toFixed(0)}% ({total.toLocaleString()}/{proposal.quorum.toLocaleString()})
              </span>
              <span className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
                {forPct.toFixed(1)}% approval
              </span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-0 space-y-4 border-t border-border">
              <div className="pt-4">
                <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest mb-2">Description</div>
                <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{proposal.description}</p>
              </div>

              {proposal.status === "active" && !myVote && (
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => handleVote("for")}
                    disabled={!!voting}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-3 border border-primary text-primary font-mono-cipher text-xs uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all duration-100 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {voting === "for" ? <span className="animate-pulse">▋</span> : <CheckCircle className="w-3 h-3" />}
                    Vote For
                  </motion.button>
                  <motion.button
                    onClick={() => handleVote("against")}
                    disabled={!!voting}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-3 border border-border text-muted-foreground font-mono-cipher text-xs uppercase tracking-widest hover:border-destructive hover:text-destructive transition-all duration-100 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {voting === "against" ? <span className="animate-pulse">▋</span> : <XCircle className="w-3 h-3" />}
                    Vote Against
                  </motion.button>
                </div>
              )}

              {myVote && (
                <div className="border border-primary/30 bg-primary/5 p-3 font-mono-cipher text-xs text-primary flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  You voted {myVote.vote.toUpperCase()} on this proposal
                </div>
              )}

              {proposal.status !== "active" && (
                <div className={`border p-3 font-mono-cipher text-xs flex items-center gap-2 ${
                  proposal.status === "passed" ? "border-primary/30 bg-primary/5 text-primary" : "border-border text-muted-foreground"
                }`}>
                  {statusIcon()}
                  <span className="ml-1">Proposal {proposal.status.toUpperCase()} — {proposal.status === "passed" ? "Implementation in progress" : "Archived"}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Wrapper that fetches per-proposal vote
function ProposalCardWithVote({
  proposal,
  voterWallet,
  onVote,
}: {
  proposal: any;
  voterWallet: string;
  onVote: (proposalId: string, vote: "for" | "against") => void;
}) {
  const myVote = useQuery(
    api.governance.getMyVote,
    voterWallet ? { proposalId: proposal.proposalId, voterWallet } : "skip"
  );

  return (
    <ProposalCard
      proposal={proposal}
      myVote={myVote ?? null}
      onVote={onVote}
    />
  );
}

export default function GovernancePage() {
  const { address, isConnected } = useAccount();
  const [filter, setFilter] = useState<"all" | "active" | "passed" | "rejected">("all");
  const [showNewProposal, setShowNewProposal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<"parameter" | "upgrade" | "treasury" | "emergency">("parameter");
  const [submitting, setSubmitting] = useState(false);

  const proposals = useQuery(api.governance.getProposals);
  const seedProposals = useMutation(api.governance.seedProposals);
  const castVote = useMutation(api.governance.castVote);
  const submitProposal = useMutation(api.governance.submitProposal);
  const createNotification = useMutation(api.notifications.createNotification);

  // Seed proposals on first load
  useEffect(() => {
    seedProposals();
  }, []);

  // Get my votes for all proposals
  const myVotes = useQuery(
    api.governance.getProposals,
    // We'll handle per-proposal votes inline
  );

  const handleVote = async (proposalId: string, vote: "for" | "against") => {
    if (!address) return;
    try {
      await castVote({
        proposalId,
        voterWallet: address,
        vote,
        txHash: generateHash(),
      });
      if (address) {
        await createNotification({
          walletAddress: address,
          type: "governance_vote",
          title: "Vote Cast",
          message: `Your vote (${vote.toUpperCase()}) on proposal ${proposalId} has been recorded on-chain.`,
        });
      }
      toast.success(`Vote cast: ${vote.toUpperCase()}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to cast vote");
    }
  };

  const handleSubmitProposal = async () => {
    if (!newTitle.trim() || !address) return;
    setSubmitting(true);
    try {
      await submitProposal({
        title: newTitle,
        description: newDesc || "No description provided.",
        category: newCategory,
        proposerWallet: address,
      });
      setNewTitle("");
      setNewDesc("");
      setShowNewProposal(false);
      toast.success("Proposal submitted to governance");
    } catch {
      toast.error("Failed to submit proposal");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = (proposals ?? []).filter(p => filter === "all" || p.status === filter);
  const activeCount = (proposals ?? []).filter(p => p.status === "active").length;
  const passedCount = (proposals ?? []).filter(p => p.status === "passed").length;
  const totalVotes = (proposals ?? []).reduce((sum, p) => sum + p.votesFor + p.votesAgainst, 0);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-6"
        >
          <div className="flex items-center gap-3">
            <Vote className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg uppercase tracking-widest" style={{ fontFamily: "Space Grotesk" }}>
              Protocol Governance
            </span>
          </div>
          <div className="border border-border bg-card p-8 space-y-6">
            <div className="space-y-2">
              <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Access Restricted</div>
              <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
                Connect Wallet to Vote
              </h2>
              <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
                Governance participation requires a connected wallet. Your vote is anonymous and encrypted.
              </p>
            </div>
            <ConnectWalletButton className="w-full font-mono-cipher text-sm bg-primary text-primary-foreground py-4 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 font-bold" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Protocol Governance — Wave 3</div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
              On-Chain Governance
            </h1>
            <p className="text-muted-foreground text-sm">
              Vote on protocol parameters, upgrades, and treasury decisions. All votes are encrypted and verifiable on Fhenix.
            </p>
          </div>
          <button
            onClick={() => setShowNewProposal(v => !v)}
            className="font-mono-cipher text-xs bg-primary text-primary-foreground px-4 py-2 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-3 h-3" />
            New Proposal
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border">
          {[
            { label: "Active Proposals", value: String(activeCount) },
            { label: "Passed", value: String(passedCount) },
            { label: "Total Votes Cast", value: totalVotes.toLocaleString() },
            { label: "Quorum Required", value: "1,000" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`p-5 ${i < 3 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}
            >
              <div className="text-xl font-bold text-foreground mb-0.5" style={{ fontFamily: "Space Grotesk" }}>
                {stat.value}
              </div>
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* New proposal form */}
        <AnimatePresence>
          {showNewProposal && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="border border-primary/40 bg-primary/5 p-6 space-y-4">
                <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Submit New Proposal</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="font-mono-cipher text-xs text-muted-foreground mb-1.5">TITLE</div>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        placeholder="Proposal title..."
                        className="w-full bg-background border border-border px-4 py-3 font-mono-cipher text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <div className="font-mono-cipher text-xs text-muted-foreground mb-1.5">CATEGORY</div>
                      <select
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value as any)}
                        className="w-full bg-background border border-border px-4 py-3 font-mono-cipher text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="parameter">Parameter Change</option>
                        <option value="upgrade">Protocol Upgrade</option>
                        <option value="treasury">Treasury</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <div className="font-mono-cipher text-xs text-muted-foreground mb-1.5">DESCRIPTION</div>
                    <textarea
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      placeholder="Describe the proposed change..."
                      rows={4}
                      className="w-full bg-background border border-border px-4 py-3 font-mono-cipher text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitProposal}
                    disabled={submitting || !newTitle.trim()}
                    className="font-mono-cipher text-xs bg-primary text-primary-foreground px-6 py-3 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Proposal →"}
                  </button>
                  <button
                    onClick={() => setShowNewProposal(false)}
                    className="font-mono-cipher text-xs border border-border text-muted-foreground px-6 py-3 uppercase tracking-widest hover:border-primary hover:text-foreground transition-all duration-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter tabs */}
        <div className="flex border-b border-border">
          {(["all", "active", "passed", "rejected"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-3 font-mono-cipher text-xs uppercase tracking-widest border-b-2 transition-all duration-100 ${
                filter === f ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {f} {f !== "all" && `(${(proposals ?? []).filter(p => p.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Proposals list */}
        <div className="space-y-4">
          {proposals === undefined ? (
            <div className="border border-border p-8 text-center">
              <div className="font-mono-cipher text-xs text-muted-foreground animate-pulse">Loading proposals...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="border border-border p-8 text-center">
              <div className="font-mono-cipher text-xs text-muted-foreground">No proposals found.</div>
            </div>
          ) : (
            filtered.map(proposal => (
              <ProposalCardWithVote
                key={proposal._id}
                proposal={proposal}
                voterWallet={address ?? ""}
                onVote={handleVote}
              />
            ))
          )}
        </div>

        {/* Governance info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border">
          {[
            { title: "Voting Power", stat: "1 wallet = 1 vote", desc: "Each connected wallet has equal voting power. Sybil resistance via Fhenix wallet verification." },
            { title: "Quorum", stat: "1,000 votes", desc: "Proposals require 1,000 total votes to reach quorum. Active proposals expire after 7 days." },
            { title: "Execution", stat: "On-chain", desc: "Passed proposals are executed via the CipherCV governance contract on Fhenix Frontier Testnet." },
          ].map((item, i) => (
            <div key={item.title} className={`p-6 space-y-2 ${i < 2 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}>
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">{item.title}</div>
              <div className="text-xl font-bold text-primary" style={{ fontFamily: "Space Grotesk" }}>{item.stat}</div>
              <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}