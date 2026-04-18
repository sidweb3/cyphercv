import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router";
import {
  Terminal, CheckCircle, ChevronDown, ChevronUp, ExternalLink,
  ArrowRight, AlertTriangle, Database, Code2, Globe, Key, Layers
} from "lucide-react";

// ─── Collapsible Section ──────────────────────────────────────────────────────
function CollapsibleSection({ title, children, tag, defaultOpen = false }: {
  title: string; children: React.ReactNode; tag?: string; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {tag && (
            <span className="font-mono-cipher border border-border px-1.5 py-0.5 text-muted-foreground" style={{ fontSize: "9px" }}>
              {tag}
            </span>
          )}
          <span className="font-mono-cipher text-xs text-foreground uppercase tracking-widest">{title}</span>
        </div>
        {open ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 pt-2 border-t border-border">{children}</div>}
    </div>
  );
}

// ─── Code Block ───────────────────────────────────────────────────────────────
function CodeBlock({ lines }: { lines: string[] }) {
  return (
    <div className="bg-background border border-border p-4 space-y-1.5">
      <div className="flex items-center gap-2 font-mono-cipher text-xs text-muted-foreground mb-3">
        <Terminal className="w-3.5 h-3.5 text-primary" />
        Terminal
      </div>
      {lines.map((line, i) => (
        <div key={i} className={`font-mono-cipher text-xs ${line.startsWith("#") ? "text-muted-foreground" : "text-foreground"}`}>
          {!line.startsWith("#") && line.trim() !== "" && <span className="text-primary mr-2">$</span>}
          {line}
        </div>
      ))}
    </div>
  );
}

// ─── Env Block ────────────────────────────────────────────────────────────────
function EnvBlock({ lines }: { lines: string[] }) {
  return (
    <div className="bg-background border border-border p-4 space-y-1">
      {lines.map((line, i) => (
        <div key={i} className={`font-mono-cipher text-xs ${line.startsWith("#") ? "text-muted-foreground" : "text-primary"}`}>
          {line}
        </div>
      ))}
    </div>
  );
}

// ─── Step Header ──────────────────────────────────────────────────────────────
function StepHeader({ n, title, icon: Icon }: { n: number; title: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 border border-primary flex items-center justify-center shrink-0">
        <span className="font-mono-cipher text-xs text-primary font-bold">{n}</span>
      </div>
      <Icon className="w-4 h-4 text-muted-foreground" />
      <h2 className="font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>{title}</h2>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DeploymentGuide() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background text-foreground px-6 py-16"
    >
      <div className="max-w-4xl mx-auto space-y-12">

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src="/assets/cypher.jpg" alt="Cipher CV" className="w-8 h-8 object-cover" />
            <span className="font-bold text-sm uppercase tracking-widest" style={{ fontFamily: "Space Grotesk" }}>
              Cipher CV
            </span>
          </div>
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Deployment Guide</div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
            Deploy Cipher CV
          </h1>
          <p className="font-mono-cipher text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Step-by-step guide to deploy all 8 FHE smart contracts, wire the Convex backend, and launch the frontend.
            Uses <strong className="text-foreground">@cofhe/sdk</strong> and <strong className="text-foreground">cofhe-hardhat-plugin</strong> on Ethereum Sepolia, Arbitrum Sepolia, or Base Sepolia.
          </p>

          {/* Network badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { label: "Arbitrum Sepolia", id: "421614", recommended: true },
              { label: "Ethereum Sepolia", id: "11155111" },
              { label: "Base Sepolia", id: "84532" },
            ].map(n => (
              <div key={n.id} className={`flex items-center gap-2 border px-3 py-1.5 ${n.recommended ? "border-primary" : "border-border"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${n.recommended ? "bg-primary" : "bg-muted-foreground"}`} />
                <span className="font-mono-cipher text-xs text-foreground">{n.label}</span>
                <span className="font-mono-cipher text-xs text-muted-foreground">Chain {n.id}</span>
                {n.recommended && <span className="font-mono-cipher border border-primary text-primary px-1" style={{ fontSize: "9px" }}>RECOMMENDED</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Step 1: Prerequisites ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <StepHeader n={1} title="Prerequisites" icon={CheckCircle} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: "Node.js v20+", desc: "Required for Hardhat and @cofhe/sdk" },
              { label: "pnpm (recommended)", desc: "npm install -g pnpm" },
              { label: "Bun", desc: "For frontend dev: curl -fsSL https://bun.sh/install | bash" },
              { label: "MetaMask or compatible wallet", desc: "Connected to Arbitrum Sepolia" },
              { label: "Sepolia ETH", desc: "For gas — get from faucets below" },
              { label: "WalletConnect Project ID", desc: "From cloud.walletconnect.com" },
            ].map(item => (
              <div key={item.label} className="border border-border p-3 flex items-start gap-3">
                <CheckCircle className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-mono-cipher text-xs text-foreground">{item.label}</div>
                  <div className="font-mono-cipher text-muted-foreground mt-0.5" style={{ fontSize: "10px" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Faucets</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: "Arbitrum Sepolia", href: "https://faucet.quicknode.com/arbitrum/sepolia" },
                { label: "Ethereum Sepolia", href: "https://sepoliafaucet.com" },
                { label: "Base Sepolia", href: "https://faucet.quicknode.com/base/sepolia" },
              ].map(f => (
                <a key={f.label} href={f.href} target="_blank" rel="noopener noreferrer"
                  className="border border-border p-3 flex items-center justify-between group hover:border-primary transition-colors">
                  <span className="font-mono-cipher text-xs text-muted-foreground group-hover:text-foreground">{f.label}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                </a>
              ))}
            </div>
          </div>

          <CodeBlock lines={[
            "git clone https://github.com/your-org/cipher-match",
            "cd cipher-match",
            "bun install",
            "# Install cofhe-hardhat-plugin for local mock testing",
            "pnpm add -D cofhe-hardhat-plugin @cofhe/sdk",
          ]} />
        </div>

        {/* ─── Step 2: Smart Contracts ───────────────────────────────────────── */}
        <div className="space-y-4">
          <StepHeader n={2} title="Smart Contracts" icon={Code2} />

          <div className="border border-border">
            <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono-cipher text-xs text-foreground uppercase tracking-widest">Contract Suite</span>
              <span className="font-mono-cipher text-xs text-muted-foreground ml-auto">8 contracts</span>
            </div>
            <div className="divide-y divide-border">
              {[
                { name: "CipherRegistry", order: 1, desc: "Deploy first — source of truth for all contract addresses", dep: "none" },
                { name: "CipherCV", order: 2, desc: "Core FHE matching engine — encrypted salary, experience, skill comparison", dep: "none" },
                { name: "CipherVault", order: 3, desc: "ZK credential vault — on-chain commitment storage with revocation", dep: "none" },
                { name: "CipherGovernance", order: 4, desc: "On-chain governance — encrypted voting weights, proposal lifecycle", dep: "none" },
                { name: "CipherEscrow", order: 5, desc: "Interview Insurance escrow — FHE-gated fund release", dep: "treasury address" },
                { name: "CipherCounterOffer", order: 6, desc: "Counter-offer calculator — encrypted salary benchmarks", dep: "none" },
                { name: "CipherStealth", order: 7, desc: "Stealth mode — encrypted employer blocklist, time-lock reveals", dep: "none" },
                { name: "CipherBatchMatcher", order: 8, desc: "Batch tournament matcher — N×M candidate×employer pairs", dep: "CipherCV address" },
              ].map(c => (
                <div key={c.name} className="px-5 py-3 flex items-start gap-3">
                  <span className="font-mono-cipher text-xs text-primary/60 w-4 shrink-0">{c.order}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono-cipher text-xs text-foreground">{c.name}</div>
                    <div className="font-mono-cipher text-muted-foreground mt-0.5" style={{ fontSize: "10px" }}>{c.desc}</div>
                  </div>
                  <div className="font-mono-cipher text-muted-foreground border border-border px-1.5 py-0.5 shrink-0" style={{ fontSize: "9px" }}>
                    dep: {c.dep}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Local Mock Testing (Recommended First)</div>
            <CodeBlock lines={[
              "# Run tests with mock FHE environment (no external deps)",
              "pnpm test",
              "# Or with Hardhat directly",
              "npx hardhat test",
            ]} />
          </div>

          <div className="space-y-3">
            <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Deploy to Testnet</div>
            <CodeBlock lines={[
              "# Arbitrum Sepolia (recommended — lowest gas)",
              "npx hardhat run scripts/deploy.ts --network arbSepolia",
              "",
              "# Ethereum Sepolia",
              "npx hardhat run scripts/deploy.ts --network ethSepolia",
              "",
              "# Base Sepolia",
              "npx hardhat run scripts/deploy.ts --network baseSepolia",
              "",
              "# Script prints all VITE_* env vars to add to .env.local",
            ]} />
          </div>

          <div className="space-y-2">
            <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Verify on Explorer</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: "Arbitrum Sepolia", href: "https://sepolia.arbiscan.io" },
                { label: "Ethereum Sepolia", href: "https://sepolia.etherscan.io" },
                { label: "Base Sepolia", href: "https://sepolia.basescan.org" },
              ].map(e => (
                <a key={e.label} href={e.href} target="_blank" rel="noopener noreferrer"
                  className="border border-border p-3 flex items-center justify-between group hover:border-primary transition-colors">
                  <span className="font-mono-cipher text-xs text-muted-foreground group-hover:text-foreground">{e.label}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Step 3: Convex Backend ────────────────────────────────────────── */}
        <div className="space-y-4">
          <StepHeader n={3} title="Convex Backend" icon={Database} />
          <CodeBlock lines={[
            "# Login to Convex",
            "npx convex login",
            "# Start dev server (auto-pushes schema + functions)",
            "npx convex dev",
          ]} />
          <div className="border border-border p-4 space-y-2">
            <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest mb-3">Schema Tables</div>
            {[
              "encryptedProfiles — Candidate FHE-encrypted profile data",
              "jobPostings — Employer job postings with encrypted budget",
              "matchRequests — Match request lifecycle (pending → matched → revealed)",
              "counterOfferRequests — Counter-offer calculator requests",
              "interviewInsuranceOrders — Interview Insurance order tracking",
              "governanceProposals — On-chain governance proposals",
              "governanceVotes — Vote records with duplicate prevention",
              "notifications — Live notification system",
            ].map(t => (
              <div key={t} className="font-mono-cipher text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary shrink-0">→</span>
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Step 4: Frontend ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          <StepHeader n={4} title="Frontend Setup" icon={Layers} />
          <div className="space-y-2">
            <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Required .env.local</div>
            <EnvBlock lines={[
              "# Convex",
              "VITE_CONVEX_URL=https://your-deployment.convex.cloud",
              "CONVEX_DEPLOYMENT=your-deployment-slug",
              "",
              "# WalletConnect (cloud.walletconnect.com)",
              "VITE_WALLETCONNECT_PROJECT_ID=your-project-id",
              "",
              "# Contract addresses (from deploy script output)",
              "VITE_CIPHER_CV_CONTRACT=0x...",
              "VITE_CIPHER_VAULT_CONTRACT=0x...",
              "VITE_CIPHER_GOVERNANCE_CONTRACT=0x...",
              "VITE_CIPHER_ESCROW_CONTRACT=0x...",
              "VITE_CIPHER_COUNTER_OFFER_CONTRACT=0x...",
              "VITE_CIPHER_REGISTRY_CONTRACT=0x...",
              "VITE_CIPHER_BATCH_MATCHER_CONTRACT=0x...",
              "VITE_CIPHER_STEALTH_CONTRACT=0x...",
              "",
              "# Deployment only (never commit, never add to Vercel)",
              "DEPLOYER_PRIVATE_KEY=0x...",
              "ARB_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc",
              "SEPOLIA_RPC_URL=https://rpc.sepolia.org",
            ]} />
          </div>
          <CodeBlock lines={[
            "bun run dev",
          ]} />
        </div>

        {/* ─── Step 5: Production ────────────────────────────────────────────── */}
        <div className="space-y-4">
          <StepHeader n={5} title="Production Deployment" icon={Globe} />
          <CodeBlock lines={[
            "# Deploy Convex to production",
            "npx convex deploy",
            "",
            "# Build and deploy frontend to Vercel",
            "bun run build",
            "npx vercel --prod",
          ]} />
          <div className="border border-border p-4 font-mono-cipher text-xs text-muted-foreground leading-relaxed">
            Add all <span className="text-primary">VITE_*</span> env vars to Vercel dashboard under Settings → Environment Variables.
            Never add <span className="text-primary">DEPLOYER_PRIVATE_KEY</span> to Vercel.
          </div>
        </div>

        {/* ─── Step 6: Env Vars Reference ────────────────────────────────────── */}
        <div className="space-y-4">
          <StepHeader n={6} title="Environment Variables Reference" icon={Key} />
          <div className="border border-border divide-y divide-border">
            {[
              { key: "VITE_CONVEX_URL", required: true, desc: "Convex deployment URL — from npx convex dev output", where: "Vercel + Local" },
              { key: "CONVEX_DEPLOYMENT", required: true, desc: "Convex deployment slug — from npx convex dev output", where: "Local only" },
              { key: "VITE_WALLETCONNECT_PROJECT_ID", required: true, desc: "WalletConnect Project ID — from cloud.walletconnect.com", where: "Vercel + Local" },
              { key: "VITE_CIPHER_CV_CONTRACT", required: false, desc: "CipherCV contract address — core matching engine", where: "Vercel + Local" },
              { key: "VITE_CIPHER_VAULT_CONTRACT", required: false, desc: "CipherVault contract address — credential vault", where: "Vercel + Local" },
              { key: "VITE_CIPHER_GOVERNANCE_CONTRACT", required: false, desc: "CipherGovernance contract address", where: "Vercel + Local" },
              { key: "VITE_CIPHER_ESCROW_CONTRACT", required: false, desc: "CipherEscrow contract address — interview insurance", where: "Vercel + Local" },
              { key: "VITE_CIPHER_COUNTER_OFFER_CONTRACT", required: false, desc: "CipherCounterOffer contract address", where: "Vercel + Local" },
              { key: "VITE_CIPHER_STEALTH_CONTRACT", required: false, desc: "CipherStealth contract address — employer blocklist", where: "Vercel + Local" },
              { key: "VITE_CIPHER_BATCH_MATCHER_CONTRACT", required: false, desc: "CipherBatchMatcher contract address", where: "Vercel + Local" },
              { key: "ARB_SEPOLIA_RPC_URL", required: false, desc: "Arbitrum Sepolia RPC URL — for contract deployment", where: "Local only" },
              { key: "SEPOLIA_RPC_URL", required: false, desc: "Ethereum Sepolia RPC URL — for contract deployment", where: "Local only" },
              { key: "DEPLOYER_PRIVATE_KEY", required: false, desc: "Deployer wallet private key — only for contract deployment, never in Vercel", where: "Local only" },
            ].map(v => (
              <div key={v.key} className="px-5 py-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <div className="font-mono-cipher text-xs text-primary">{v.key}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`font-mono-cipher border px-1.5 py-0.5 ${v.required ? "border-primary text-primary" : "border-border text-muted-foreground"}`} style={{ fontSize: "9px" }}>
                      {v.required ? "REQUIRED" : "OPTIONAL"}
                    </span>
                    <span className="font-mono-cipher text-muted-foreground border border-border px-1.5 py-0.5" style={{ fontSize: "9px" }}>
                      {v.where}
                    </span>
                  </div>
                </div>
                <div className="font-mono-cipher text-xs text-muted-foreground md:col-span-2 leading-relaxed">{v.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Troubleshooting ───────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border border-border flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <h2 className="font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>Troubleshooting</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                issue: "Cannot find module '@fhenixprotocol/cofhe-contracts'",
                fix: "Run: pnpm add @fhenixprotocol/cofhe-contracts — the CoFHE contracts library must be installed before compiling.",
              },
              {
                issue: "cofhe-hardhat-plugin not found",
                fix: "Run: pnpm add -D cofhe-hardhat-plugin — then uncomment the import in hardhat.config.ts.",
              },
              {
                issue: "Deployment fails: insufficient funds",
                fix: "Get Sepolia ETH from the faucets listed in Step 1. Arbitrum Sepolia has the lowest gas costs.",
              },
              {
                issue: "Convex: Did you forget to run npx convex dev?",
                fix: "This means there are TypeScript compile errors in src/convex/. Run: npx tsc -b --noEmit to find them.",
              },
              {
                issue: "RainbowKit: WalletConnect not connecting",
                fix: "Ensure VITE_WALLETCONNECT_PROJECT_ID is set and the domain is whitelisted in your WalletConnect dashboard.",
              },
              {
                issue: "@cofhe/sdk: encryptInputs fails",
                fix: "The CoFHE client requires the wallet to be connected to a supported network (Arbitrum Sepolia, Ethereum Sepolia, or Base Sepolia). Check the network in MetaMask.",
              },
              {
                issue: "Blank screen on /",
                fix: "Run: npx tsc -b --noEmit to find compile errors. Usually caused by a missing import or type mismatch.",
              },
            ].map(item => (
              <CollapsibleSection key={item.issue} title={item.issue} tag="Fix">
                <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{item.fix}</p>
              </CollapsibleSection>
            ))}
          </div>
        </div>

        {/* ─── Resources ─────────────────────────────────────────────────────── */}
        <div className="border border-border p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "CoFHE Docs", desc: "cofhe-hardhat-starter, @cofhe/sdk, FHE library reference", href: "https://cofhe-docs.fhenix.zone" },
            { label: "Convex Docs", desc: "Backend functions, schema, real-time queries", href: "https://docs.convex.dev" },
            { label: "cofhe-hardhat-starter", desc: "Official starter repo with Counter.sol example and test patterns", href: "https://github.com/fhenixprotocol/cofhe-hardhat-starter" },
          ].map(link => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="space-y-1 group"
            >
              <div className="font-mono-cipher text-xs text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                {link.label} <ExternalLink className="w-3 h-3" />
              </div>
              <div className="font-mono-cipher text-xs text-muted-foreground">{link.desc}</div>
            </a>
          ))}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Link
            to="/"
            className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            ← Back to Landing
          </Link>
          <Link
            to="/download"
            className="font-mono-cipher text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            Download Source <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}