import { motion } from "framer-motion";
import { Lock, Download, FileArchive, Terminal, CheckCircle, Code2, Database, Layers } from "lucide-react";
import { Link } from "react-router";

const FILE_MANIFEST = [
  {
    category: "Smart Contracts (Fhenix fhEVM)",
    icon: Code2,
    color: "text-primary",
    files: [
      { name: "contracts/CipherCV.sol", desc: "Core FHE matching — encrypted salary, experience, skill comparison" },
      { name: "contracts/CipherVault.sol", desc: "ZK credential vault — on-chain commitment storage with revocation" },
      { name: "contracts/CipherGovernance.sol", desc: "On-chain governance — encrypted voting weights, proposal lifecycle" },
      { name: "contracts/CipherEscrow.sol", desc: "Interview Insurance escrow — FHE-gated fund release" },
      { name: "contracts/CipherCounterOffer.sol", desc: "Counter-offer calculator — encrypted salary benchmarks" },
      { name: "contracts/CipherRegistry.sol", desc: "Protocol registry — single source of truth for all contract addresses" },
      { name: "contracts/CipherBatchMatcher.sol", desc: "Batch tournament matcher — N×M candidate×employer pairs" },
      { name: "contracts/CipherStealth.sol", desc: "Stealth mode — encrypted employer blocklist, time-lock reveals" },
    ],
  },
  {
    category: "Deployment & Tooling",
    icon: Terminal,
    color: "text-foreground",
    files: [
      { name: "scripts/deploy.ts", desc: "Deploys all 8 contracts to Fhenix Frontier Testnet, registers in CipherRegistry" },
      { name: "hardhat.config.ts", desc: "Hardhat config — Fhenix Frontier + local devnet networks" },
    ],
  },
  {
    category: "Frontend — Pages",
    icon: Layers,
    color: "text-foreground",
    files: [
      { name: "src/pages/Landing.tsx", desc: "Landing page — MoaiTransmission centerpiece, stealth narrative" },
      { name: "src/pages/Auth.tsx", desc: "Auth page — OTP email authentication" },
      { name: "src/pages/app/DashboardPage.tsx", desc: "Main dashboard — stats, notifications, quick actions" },
      { name: "src/pages/app/CandidatePage.tsx", desc: "Candidate profile — FHE encryption, vault, interview insurance" },
      { name: "src/pages/app/EmployerPage.tsx", desc: "Employer portal — job postings, match simulation, analytics" },
      { name: "src/pages/app/MatchesPage.tsx", desc: "Matches — live FHE match simulation, consent reveal" },
      { name: "src/pages/app/VaultPage.tsx", desc: "Credential vault — manage, export, revoke encrypted credentials" },
      { name: "src/pages/app/GovernancePage.tsx", desc: "Governance — on-chain proposals, encrypted voting" },
      { name: "src/pages/app/AnalyticsPage.tsx", desc: "Analytics — privacy-preserving market intelligence" },
      { name: "src/pages/app/ProofExplorerPage.tsx", desc: "Proof explorer — live FHE operation verification" },
      { name: "src/pages/app/ProtocolPage.tsx", desc: "Protocol — architecture diagrams, contract code preview" },
      { name: "src/pages/app/WhitepaperPage.tsx", desc: "Whitepaper — full technical documentation" },
    ],
  },
  {
    category: "Frontend — Components",
    icon: Layers,
    color: "text-foreground",
    files: [
      { name: "src/components/MoaiTransmission.tsx", desc: "6-phase FHE data-path animation — centerpiece storytelling" },
      { name: "src/components/FHECircuit.tsx", desc: "Interactive FHE circuit visualizer" },
      { name: "src/components/MatchingEngine.tsx", desc: "Real-time match engine UI" },
      { name: "src/components/NotificationCenter.tsx", desc: "Live notification bell with Convex subscriptions" },
      { name: "src/components/ActivityFeed.tsx", desc: "Protocol activity feed" },
      { name: "src/components/PrivacyScore.tsx", desc: "Privacy score meter" },
      { name: "src/components/ConsentReveal.tsx", desc: "Mutual consent reveal flow" },
      { name: "src/components/SkillHeatmap.tsx", desc: "Skill demand heatmap" },
      { name: "src/components/BatchMatcher.tsx", desc: "Batch match UI" },
      { name: "src/components/EncryptedInput.tsx", desc: "FHE-encrypted input field" },
      { name: "src/components/WalletButton.tsx", desc: "RainbowKit wallet connect + FHE profile button" },
      { name: "src/components/DemoMode.tsx", desc: "Demo mode toggle" },
    ],
  },
  {
    category: "Backend — Convex",
    icon: Database,
    color: "text-foreground",
    files: [
      { name: "src/convex/schema.ts", desc: "Full database schema — profiles, jobs, matches, governance, notifications" },
      { name: "src/convex/profiles.ts", desc: "Encrypted profile CRUD + event notifications" },
      { name: "src/convex/matches.ts", desc: "Match requests, FHE simulation, protocol stats" },
      { name: "src/convex/governance.ts", desc: "Proposals, voting, duplicate prevention" },
      { name: "src/convex/notifications.ts", desc: "Notification system — create, read, delete" },
      { name: "src/convex/users.ts", desc: "User management" },
      { name: "src/convex/auth.ts", desc: "Convex Auth configuration" },
    ],
  },
  {
    category: "Library & Config",
    icon: FileArchive,
    color: "text-foreground",
    files: [
      { name: "src/lib/fhenix.ts", desc: "Fhenix FHE client — encrypt salary, experience, skill; all contract addresses" },
      { name: "src/lib/wagmi.ts", desc: "Wagmi + RainbowKit config for Fhenix Frontier" },
      { name: "src/lib/chains.ts", desc: "Fhenix Frontier Testnet chain definition" },
      { name: "src/lib/demoData.ts", desc: "Demo data generators — mock FHE for Wave 1" },
      { name: "package.json", desc: "Dependencies — React, Convex, fhenixjs, wagmi, RainbowKit, Framer Motion" },
      { name: "vite.config.ts", desc: "Vite build config" },
      { name: "hardhat.config.ts", desc: "Hardhat + Fhenix network config" },
      { name: "tailwind.config.ts", desc: "Tailwind + Swiss Brutalist design tokens" },
      { name: "vercel.json", desc: "Vercel deployment config" },
    ],
  },
];

export default function DownloadPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background text-foreground px-6 py-16"
    >
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <img src="/assets/cypher.jpg" alt="Cipher CV" className="w-8 h-8 object-cover" />
          <span className="font-bold text-sm uppercase tracking-widest" style={{ fontFamily: "Space Grotesk" }}>
            Cipher CV
          </span>
        </div>

        <div className="space-y-2">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
            Source Export
          </div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
            Download Project
          </h1>
          <p className="font-mono-cipher text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Full source archive — 8 FHE smart contracts, complete React frontend, Convex backend, and deployment tooling. Excludes node_modules, dist, and environment secrets.
          </p>
        </div>

        {/* Download card */}
        <div className="border border-primary bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileArchive className="w-5 h-5 text-primary shrink-0" />
            <div>
              <div className="font-mono-cipher text-sm text-foreground font-bold">cipher-match.tar.gz</div>
              <div className="font-mono-cipher text-xs text-muted-foreground mt-0.5">
                8 contracts · 12 pages · 12 components · Convex backend · Hardhat toolchain
              </div>
            </div>
          </div>
          <a
            href="/cipher-match.tar.gz"
            download="cipher-match.tar.gz"
            className="flex items-center gap-2 font-mono-cipher text-sm bg-primary text-primary-foreground px-6 py-3 uppercase tracking-widest hover:opacity-90 transition-opacity font-bold shrink-0"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        </div>

        {/* File manifest */}
        <div className="space-y-6">
          <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
            File Manifest
          </div>
          {FILE_MANIFEST.map((section, si) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: si * 0.07 }}
                className="border border-border"
              >
                <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${section.color}`} />
                  <span className="font-mono-cipher text-xs text-foreground uppercase tracking-widest">
                    {section.category}
                  </span>
                  <span className="font-mono-cipher text-xs text-muted-foreground ml-auto">
                    {section.files.length} files
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {section.files.map((file, fi) => (
                    <motion.div
                      key={file.name}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: si * 0.07 + fi * 0.03 }}
                      className="px-5 py-3 flex items-start gap-3"
                    >
                      <CheckCircle className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono-cipher text-xs text-foreground">{file.name}</div>
                        <div className="font-mono-cipher text-muted-foreground mt-0.5 leading-relaxed" style={{ fontSize: "10px" }}>
                          {file.desc}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Local setup */}
        <div className="border border-border bg-card p-6 space-y-4">
          <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
            Local Setup
          </div>
          <div className="bg-background border border-border p-4 space-y-2">
            <div className="flex items-center gap-2 font-mono-cipher text-xs text-muted-foreground mb-3">
              <Terminal className="w-3.5 h-3.5 text-primary" />
              Terminal
            </div>
            {[
              "tar -xzf cipher-match.tar.gz",
              "cd cipher-match",
              "bun install",
              "# Create .env.local with your keys (see below)",
              "bun run dev",
            ].map((cmd, i) => (
              <div key={i} className={`font-mono-cipher text-xs ${cmd.startsWith("#") ? "text-muted-foreground" : "text-foreground"}`}>
                {!cmd.startsWith("#") && <span className="text-primary mr-2">$</span>}
                {cmd}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
              Required .env.local
            </div>
            <div className="bg-background border border-border p-4 space-y-1">
              {[
                "VITE_CONVEX_URL=https://your-deployment.convex.cloud",
                "CONVEX_DEPLOYMENT=your-deployment-slug",
                "VITE_WALLETCONNECT_PROJECT_ID=your-project-id",
                "# After deploying contracts:",
                "VITE_CIPHER_CV_CONTRACT=0x...",
                "VITE_CIPHER_VAULT_CONTRACT=0x...",
                "VITE_CIPHER_GOVERNANCE_CONTRACT=0x...",
                "VITE_CIPHER_ESCROW_CONTRACT=0x...",
                "VITE_CIPHER_COUNTER_OFFER_CONTRACT=0x...",
                "VITE_CIPHER_REGISTRY_CONTRACT=0x...",
                "VITE_CIPHER_BATCH_MATCHER_CONTRACT=0x...",
                "VITE_CIPHER_STEALTH_CONTRACT=0x...",
                "DEPLOYER_PRIVATE_KEY=0x...",
              ].map((line, i) => (
                <div key={i} className={`font-mono-cipher text-xs ${line.startsWith("#") ? "text-muted-foreground" : "text-primary"}`}>
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
              Deploy Contracts
            </div>
            <div className="bg-background border border-border p-4 space-y-2">
              {[
                "# Deploy all 8 contracts to Fhenix Frontier Testnet",
                "npx hardhat run scripts/deploy.ts --network fhenixFrontier",
                "# Script prints all VITE_* env vars to add to .env.local",
              ].map((cmd, i) => (
                <div key={i} className={`font-mono-cipher text-xs ${cmd.startsWith("#") ? "text-muted-foreground" : "text-foreground"}`}>
                  {!cmd.startsWith("#") && <span className="text-primary mr-2">$</span>}
                  {cmd}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Privacy guarantee */}
        <div className="border border-border p-5 flex items-start gap-3">
          <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
            Archive contains no secrets, private keys, or environment variables. All sensitive configuration must be supplied by you via .env.local. The archive is reproducible from the source repository.
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            ← Back to Landing
          </Link>
          <Link
            to="/deploy"
            className="font-mono-cipher text-xs text-primary hover:underline flex items-center gap-1"
          >
            Deployment Guide →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}