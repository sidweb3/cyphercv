import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Link } from "react-router";
import { DemoMode } from "@/components/DemoMode";
import { WalletButton, EncryptProfileButton } from "@/components/WalletButton";
import { Github, Twitter, ExternalLink, ChevronRight, User, Building2, Zap, Eye, ArrowRight } from "lucide-react";

// Cycling hash display
function HashCycler({ className = "" }: { className?: string }) {
  const hashes = [
    "0x7f3a9b2c4e1d8f5a",
    "0x9b2c4e1d8f5a7f3a",
    "0x3d8e2f1a9c7b4e6d",
    "0x5c9f2e8a1b4d7e3c",
    "0x1a9c7b4e6d3d8e2f",
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % hashes.length), 600);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.span
      key={idx}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`font-mono-cipher ${className}`}
    >
      {hashes[idx]}
    </motion.span>
  );
}

// Hero Section
function HeroSection() {
  const [sliderA, setSliderA] = useState(65);
  const [sliderB, setSliderB] = useState(72);
  const [matchState, setMatchState] = useState<"idle" | "computing" | "found">("idle");
  const [strikethrough, setStrikethrough] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStrikethrough(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const runDemo = () => {
    setMatchState("computing");
    setTimeout(() => setMatchState("found"), 2000);
  };

  return (
    <section className="min-h-screen flex flex-col justify-end pb-16 px-6 md:px-12 lg:px-20 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#2a2a2a 1px, transparent 1px), linear-gradient(90deg, #2a2a2a 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Top nav */}
      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 md:px-12 lg:px-20 py-6 border-b border-border z-10">
        <div className="flex items-center gap-2">
          <img src="/assets/cypher.jpg" alt="Cipher CV" className="w-8 h-8 object-cover" style={{ imageRendering: "auto" }} />
          <span className="font-bold text-sm uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk' }}>
            Cipher CV
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#protocol" className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Protocol</a>
          <a href="#how-it-works" className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">How It Works</a>
          <a href="#demo" className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Demo</a>
          <Link to="/app/candidate" className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Candidate</Link>
          <Link to="/app/employer" className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Employer</Link>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://fhenix.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex font-mono-cipher text-xs border border-border px-3 py-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-all duration-100 items-center gap-1"
          >
            Fhenix Testnet <ExternalLink className="w-3 h-3" />
          </a>
          <WalletButton />
        </div>
      </nav>

      {/* Hero content - bottom left anchored */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-5 gap-12 items-end">
        <div className="lg:col-span-3 space-y-8">
          <div className="space-y-2">
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
              § 01 — The Black Box
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-none tracking-tight"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              <AnimatePresence mode="wait">
                {!strikethrough ? (
                  <motion.span
                    key="visible"
                    exit={{ opacity: 0 }}
                    className="block text-foreground"
                  >
                    Your career is<br />visible to everyone.
                  </motion.span>
                ) : (
                  <motion.span
                    key="hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="block"
                  >
                    <span className="line-through text-muted-foreground text-3xl md:text-4xl block mb-2">
                      Your career is visible to everyone.
                    </span>
                    <span className="text-foreground">
                      Your career is<br />
                      <span className="text-primary">visible to no one.</span>
                    </span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-muted-foreground max-w-lg leading-relaxed"
          >
            The first labor market that runs on encrypted mathematics. Match with employers without revealing your salary, your history, or your identity.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap gap-3"
          >
            <EncryptProfileButton />
            <Link
              to="/app/candidate"
              className="font-mono-cipher text-xs bg-secondary text-foreground px-6 py-3 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 border border-border"
            >
              Candidate Dashboard →
            </Link>
            <Link
              to="/app/employer"
              className="font-mono-cipher text-xs border border-border text-muted-foreground px-6 py-3 uppercase tracking-widest hover:border-primary hover:text-foreground transition-all duration-100"
            >
              Employer Dashboard →
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="font-mono-cipher text-xs text-muted-foreground flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Fhenix Buildathon — Wave 1 — Privacy-by-Design
          </motion.div>
        </div>

        {/* Interactive Black Box Demo */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="lg:col-span-2 space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            {/* Candidate Input Box */}
            <div className="bg-black border border-border p-4 space-y-3">
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                Candidate Input
              </div>
              <div className="space-y-2">
                <div className="font-mono-cipher text-xs text-muted-foreground">Salary Req.</div>
                <div className="h-1 bg-secondary relative">
                  <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: `${sliderA}%` }} />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sliderA}
                    onChange={e => setSliderA(Number(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                </div>
                <div className="encrypted-block text-center">
                  [ENCRYPTED]
                </div>
              </div>
            </div>

            {/* Employer Input Box */}
            <div className="bg-black border border-border p-4 space-y-3">
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                Employer Input
              </div>
              <div className="space-y-2">
                <div className="font-mono-cipher text-xs text-muted-foreground">Budget</div>
                <div className="h-1 bg-secondary relative">
                  <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: `${sliderB}%` }} />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sliderB}
                    onChange={e => setSliderB(Number(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                </div>
                <div className="encrypted-block text-center">
                  [ENCRYPTED]
                </div>
              </div>
            </div>
          </div>

          {/* Calculation display */}
          <div className="bg-black border border-border p-4 space-y-2">
            <div className="font-mono-cipher text-xs text-muted-foreground">
              <HashCycler /> ⊕ <HashCycler /> =
            </div>
            <AnimatePresence mode="wait">
              {matchState === "idle" && (
                <motion.button
                  key="btn"
                  onClick={runDemo}
                  className="w-full font-mono-cipher text-xs text-primary border border-primary px-3 py-2 hover:bg-primary hover:text-primary-foreground transition-all duration-100"
                >
                  RUN DEMO MATCH →
                </motion.button>
              )}
              {matchState === "computing" && (
                <motion.div
                  key="computing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-mono-cipher text-xs text-muted-foreground"
                >
                  <span className="text-primary animate-pulse">▋</span> Computing encrypted intersection...
                </motion.div>
              )}
              {matchState === "found" && (
                <motion.div
                  key="found"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1"
                >
                  <div className="font-mono-cipher text-xs text-primary font-bold">
                    ✓ MATCH FOUND
                  </div>
                  <div className="font-mono-cipher text-xs text-muted-foreground">
                    Inputs remain encrypted. Result computed blind.
                  </div>
                  <button
                    onClick={() => setMatchState("idle")}
                    className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Reset →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Protocol Section
function ProtocolSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const panels = [
    {
      step: "01",
      title: "Encrypted Input",
      description: "Submit your utility curve. Salary expectations, experience, and constraints are encrypted client-side before transmission.",
      visual: (
        <div className="space-y-2 font-mono-cipher text-xs">
          {["Name: ████████████", "Salary: [ENCRYPTED]", "Skills: ████████", "History: [ENCRYPTED]", "Location: ████"].map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.15 }}
              className="text-muted-foreground"
            >
              {line}
              {i % 2 === 0 && <span className="text-primary animate-pulse ml-1">▋</span>}
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      step: "02",
      title: "FHE Calculation",
      description: "Fhenix's fhEVM computes the intersection of encrypted vectors. No plaintext ever leaves your device.",
      visual: (
        <div className="space-y-3 font-mono-cipher text-xs">
          <div className="text-muted-foreground">euint256 candidateCurve =</div>
          <div className="text-primary ml-4">encrypt(salaryRange);</div>
          <div className="text-muted-foreground">euint256 employerBudget =</div>
          <div className="text-primary ml-4">encrypt(budget);</div>
          <div className="text-muted-foreground mt-2">ebool match = FHE.gte(</div>
          <div className="text-primary ml-4">employerBudget,</div>
          <div className="text-primary ml-4">candidateCurve</div>
          <div className="text-muted-foreground">);</div>
        </div>
      ),
    },
    {
      step: "03",
      title: "Blind Result",
      description: "A match score emerges from the encrypted computation. Salary is revealed only upon mutual consent. Rejection reveals nothing.",
      visual: (
        <div className="space-y-3 font-mono-cipher text-xs">
          <div className="border border-primary p-3 space-y-1">
            <div className="text-primary">MATCH CONFIRMED</div>
            <div className="text-muted-foreground">Score: 94%</div>
            <div className="text-muted-foreground">
              Salary:{" "}
              <motion.span
                initial={{ filter: "blur(6px)" }}
                animate={inView ? { filter: "blur(0px)" } : {}}
                transition={{ delay: 1.5, duration: 0.8 }}
                className="text-foreground"
              >
                $125,000
              </motion.span>
            </div>
          </div>
          <div className="text-muted-foreground">Identity: [STILL ENCRYPTED]</div>
          <div className="text-muted-foreground">Requirements: [STILL ENCRYPTED]</div>
        </div>
      ),
    },
  ];

  return (
    <section id="protocol" className="py-24 px-6 md:px-12 lg:px-20 border-t border-border" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest mb-3">
            § 02 — Dark Matching
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>
            How the Protocol Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border">
          {panels.map((panel, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.2 }}
              className={`p-8 space-y-6 ${i < 2 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}
            >
              <div className="flex items-start justify-between">
                <span className="font-mono-cipher text-4xl font-bold text-muted-foreground opacity-30">
                  {panel.step}
                </span>
                <ChevronRight className="w-4 h-4 text-primary mt-2" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                  {panel.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{panel.description}</p>
              </div>
              <div className="bg-black border border-border p-4">
                {panel.visual}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [activeRole, setActiveRole] = useState<"candidate" | "employer">("candidate");

  const candidateSteps = [
    {
      step: "01",
      title: "Connect Wallet",
      desc: "Connect MetaMask or any injected wallet. Your identity is never linked to your profile.",
      action: null,
      terminal: "> wallet.connect(injected)\n> address: 0x7f3a...8f5a\n> status: CONNECTED",
    },
    {
      step: "02",
      title: "Build Encrypted Profile",
      desc: "Set your salary range, experience, and skills. All values are encrypted client-side before any network call.",
      action: { label: "Try Candidate Dashboard →", to: "/app/candidate" },
      terminal: "> encrypt(salaryMin: 100000)\n> encrypt(salaryMax: 150000)\n> encrypt(skills: [...])\n> hash: 0x9b2c...4e1d",
    },
    {
      step: "03",
      title: "Submit to Fhenix",
      desc: "Your encrypted profile is committed on-chain. No plaintext leaves your browser.",
      action: null,
      terminal: "> tx.submit(encryptedProfile)\n> block: #1,847,293\n> status: COMMITTED",
    },
    {
      step: "04",
      title: "Receive Blind Matches",
      desc: "The FHE engine computes matches. You see a score and salary only when both parties consent.",
      action: { label: "View Match Engine →", to: "/app/matches" },
      terminal: "> match.result: FOUND\n> score: 94%\n> salary: [ENCRYPTED]\n> reveal: awaiting consent",
    },
  ];

  const employerSteps = [
    {
      step: "01",
      title: "Connect Wallet",
      desc: "Connect your wallet. Your company identity is decoupled from the job spec you post.",
      action: null,
      terminal: "> wallet.connect(injected)\n> address: 0x3d8e...4e6d\n> status: CONNECTED",
    },
    {
      step: "02",
      title: "Post Encrypted Job Spec",
      desc: "Define your budget, required experience, and skills. Candidates never see your actual budget ceiling.",
      action: { label: "Try Employer Dashboard →", to: "/app/employer" },
      terminal: "> encrypt(budget: 130000)\n> encrypt(minExp: 5)\n> encrypt(skills: [...])\n> hash: 0x5c9f...7e3c",
    },
    {
      step: "03",
      title: "FHE Matching Runs",
      desc: "The Fhenix fhEVM computes FHE.gte(budget, candidateMin) on encrypted values. No plaintext comparison.",
      action: null,
      terminal: "> FHE.gte(budget, candidateMin)\n> FHE.lte(budget, candidateMax)\n> result: ebool(true)",
    },
    {
      step: "04",
      title: "Review Encrypted Pipeline",
      desc: "See matched candidates as anonymous hashes. Reveal salary only upon mutual consent.",
      action: { label: "View Protocol →", to: "/app/protocol" },
      terminal: "> candidate: 0x7f3a...8f5a\n> match: 94%\n> identity: [ENCRYPTED]\n> salary: [ENCRYPTED]",
    },
  ];

  const steps = activeRole === "candidate" ? candidateSteps : employerSteps;

  return (
    <section id="how-it-works" className="py-24 px-6 md:px-12 lg:px-20 border-t border-border" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest mb-3">
              § 03 — User Flow
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>
              How It Works
            </h2>
            <p className="text-muted-foreground text-sm mt-3 max-w-lg">
              Four steps. No plaintext exposure. Try each step live in the app.
            </p>
          </div>

          {/* Role toggle */}
          <div className="flex border border-border">
            <button
              onClick={() => setActiveRole("candidate")}
              className={`flex items-center gap-2 px-5 py-3 font-mono-cipher text-xs uppercase tracking-widest transition-all duration-100 ${
                activeRole === "candidate"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Candidate
            </button>
            <button
              onClick={() => setActiveRole("employer")}
              className={`flex items-center gap-2 px-5 py-3 font-mono-cipher text-xs uppercase tracking-widest transition-all duration-100 border-l border-border ${
                activeRole === "employer"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Employer
            </button>
          </div>
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-border"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}
                className={`p-6 space-y-4 flex flex-col ${
                  i < steps.length - 1 ? "border-b lg:border-b-0 lg:border-r border-border" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono-cipher text-3xl font-bold text-muted-foreground opacity-20">
                    {step.step}
                  </span>
                  {i < steps.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-primary mt-1 hidden lg:block" />
                  )}
                  {i === steps.length - 1 && (
                    <Zap className="w-3.5 h-3.5 text-primary mt-1" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>
                    {step.title}
                  </h3>
                  <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Terminal visual */}
                <div className="bg-black border border-border p-3">
                  <pre className="font-mono-cipher text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {step.terminal.split('\n').map((line, li) => (
                      <div key={li} className={line.startsWith('>') ? 'text-primary' : 'text-muted-foreground'}>
                        {line}
                      </div>
                    ))}
                  </pre>
                </div>

                {step.action && (
                  <Link
                    to={step.action.to}
                    className="font-mono-cipher text-xs text-primary border border-primary px-3 py-2 text-center hover:bg-primary hover:text-primary-foreground transition-all duration-100 flex items-center justify-center gap-1"
                  >
                    {step.action.label}
                  </Link>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* CTA bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-8 border border-border p-6 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
              Ready to experience it?
            </div>
            <p className="font-mono-cipher text-xs text-muted-foreground">
              No real transactions in Wave 1. All matching is simulated with encrypted visuals.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link
              to="/app/candidate"
              className="font-mono-cipher text-xs bg-primary text-primary-foreground px-5 py-2.5 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100"
            >
              I'm a Candidate →
            </Link>
            <Link
              to="/app/employer"
              className="font-mono-cipher text-xs border border-border text-muted-foreground px-5 py-2.5 uppercase tracking-widest hover:border-primary hover:text-foreground transition-all duration-100"
            >
              I'm an Employer →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Comparison Section
function ComparisonSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="comparison" className="py-24 px-6 md:px-12 lg:px-20 border-t border-border" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest mb-3">
            § 04 — Transparent vs. Encrypted
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>
            The Difference
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border">
          {/* Traditional - Red tint */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            className="p-8 border-b md:border-b-0 md:border-r border-border"
            style={{ background: "rgba(255, 77, 0, 0.03)" }}
          >
            <div className="font-mono-cipher text-xs text-destructive uppercase tracking-widest mb-6">
              ✗ Traditional Market
            </div>
            <div className="space-y-3">
              {[
                { label: "Salary History", value: "$87,000 → $94,000 → $102,000", exposed: true },
                { label: "Current Employer", value: "Acme Corp — 3 years", exposed: true },
                { label: "Rejection Reason", value: "Overqualified for budget", exposed: true },
                { label: "Negotiation Position", value: "Candidate desperate (3 months unemployed)", exposed: true },
                { label: "Bias Indicators", value: "Name: Visible. Photo: Visible.", exposed: true },
              ].map(item => (
                <div key={item.label} className="border border-destructive/20 p-3 space-y-1">
                  <div className="font-mono-cipher text-xs text-muted-foreground">{item.label}</div>
                  <div className="font-mono-cipher text-xs text-destructive">{item.value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Cipher CV - Neutral/green tint */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            className="p-8"
            style={{ background: "rgba(100, 200, 100, 0.02)" }}
          >
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest mb-6">
              ✓ Cipher CV Protocol
            </div>
            <div className="space-y-3">
              {[
                { label: "Salary History", value: "[ENCRYPTED]" },
                { label: "Current Employer", value: "[ENCRYPTED]" },
                { label: "Rejection Reason", value: "No overlap detected. Zero information revealed." },
                { label: "Negotiation Position", value: "[ENCRYPTED] — Mathematical fairness enforced" },
                { label: "Identity", value: "[ENCRYPTED] — Revealed only on mutual consent" },
              ].map(item => (
                <div key={item.label} className="border border-border p-3 space-y-1">
                  <div className="font-mono-cipher text-xs text-muted-foreground">{item.label}</div>
                  <div className="font-mono-cipher text-xs text-foreground">{item.value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Technical Section
function TechnicalSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const codeSnippet = `// Cipher CV — Fhenix fhEVM Integration
// Wave 2 deployment target: Fhenix Helium Testnet

pragma solidity ^0.8.20;
import "@fhenixprotocol/contracts/FHE.sol";

contract CipherCV {
  // Encrypted salary ranges — never stored in plaintext
  mapping(address => euint256) private candidateCurves;
  mapping(address => euint256) private employerBudgets;
  
  function submitCandidateProfile(
    inEuint256 calldata encryptedMinSalary,
    inEuint256 calldata encryptedMaxSalary
  ) external {
    candidateCurves[msg.sender] = FHE.asEuint256(encryptedMinSalary);
  }
  
  function computeBlindMatch(
    address candidate,
    address employer
  ) external returns (ebool) {
    // FHE comparison — no plaintext ever exposed
    return FHE.gte(
      employerBudgets[employer],
      candidateCurves[candidate]
    );
  }
}`;

  return (
    <section id="technical" className="py-24 px-6 md:px-12 lg:px-20 border-t border-border" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest mb-3">
            § 05 — Fhenix Integration
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>
            Technical Architecture
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 border border-border">
          {/* Code snippet */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-border"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted">
              <span className="font-mono-cipher text-xs text-muted-foreground">CipherCV.sol</span>
              <span className="font-mono-cipher text-xs text-primary">Wave 2 Preview</span>
            </div>
            <pre className="p-6 overflow-x-auto">
              <code className="font-mono-cipher text-xs leading-relaxed">
                {codeSnippet.split('\n').map((line, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-muted-foreground select-none w-6 text-right shrink-0">{i + 1}</span>
                    <span className={
                      line.includes('//') ? 'text-muted-foreground' :
                      line.includes('euint256') || line.includes('ebool') || line.includes('inEuint256') ? 'text-primary' :
                      line.includes('function') || line.includes('mapping') || line.includes('contract') ? 'text-foreground' :
                      'text-muted-foreground'
                    }>{line}</span>
                  </div>
                ))}
              </code>
            </pre>
          </motion.div>

          {/* Architecture */}
          <div className="lg:col-span-2 p-8 space-y-6">
            <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest mb-4">
              Stack
            </div>
            {[
              { layer: "Frontend", tech: "React + Vite", desc: "Client-side encryption via CoFHE SDK" },
              { layer: "Protocol", tech: "Fhenix fhEVM", desc: "Fully Homomorphic Encryption on-chain" },
              { layer: "Storage", tech: "Encrypted State", desc: "euint256 types — never plaintext" },
              { layer: "Matching", tech: "FHE.gte / FHE.lte", desc: "Blind comparison operators" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.1 }}
                className="border-l-2 border-primary pl-4 space-y-1"
              >
                <div className="font-mono-cipher text-xs text-muted-foreground uppercase">{item.layer}</div>
                <div className="font-mono-cipher text-sm text-foreground">{item.tech}</div>
                <div className="font-mono-cipher text-xs text-muted-foreground">{item.desc}</div>
              </motion.div>
            ))}

            <div className="border border-primary p-4 mt-6">
              <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest mb-2">
                Powered by
              </div>
              <div className="font-mono-cipher text-sm text-foreground">
                Fully Homomorphic Encryption
              </div>
              <div className="font-mono-cipher text-xs text-muted-foreground mt-1">
                Smart contracts deploying Wave 2
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="border-t border-border px-6 md:px-12 lg:px-20 py-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <img src="/assets/cypher.jpg" alt="Cipher CV" className="w-6 h-6 object-cover" />
            <span className="font-bold text-sm uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk' }}>
              Cipher CV
            </span>
          </div>
          <div className="font-mono-cipher text-xs text-muted-foreground">
            Encrypted labor matching protocol
          </div>
          <div className="font-mono-cipher text-xs text-muted-foreground">
            Contact: <span className="text-primary">0x7f3a...@encrypted</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Twitter className="w-3 h-3" /> Twitter
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Github className="w-3 h-3" /> GitHub
          </a>
          <div className="font-mono-cipher text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Fhenix Testnet
          </div>
        </div>

        <div className="font-mono-cipher text-xs text-muted-foreground">
          Fhenix Privacy-by-Design Buildathon<br />
          Wave 1 — {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background text-foreground"
    >
      <HeroSection />
      <ProtocolSection />
      <HowItWorksSection />
      <DemoMode />
      <ComparisonSection />
      <TechnicalSection />
      <Footer />
    </motion.div>
  );
}