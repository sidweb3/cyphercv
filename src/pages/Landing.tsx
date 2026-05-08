import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView, useMotionValue, useSpring } from "framer-motion";
import { Link } from "react-router";
import { MoaiTransmission } from "@/components/MoaiTransmission";
import { WalletButton, EncryptProfileButton } from "@/components/WalletButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ExternalLink, ArrowRight, Twitter, Github, Lock, Shield, EyeOff, ChevronDown, User, Building2, Key, Ghost, TrendingUp, Calendar, DollarSign, CheckCircle, XCircle, AlertTriangle, Zap, Code2, Activity, Package, Star, Quote } from "lucide-react";

// ─── Custom Cursor ────────────────────────────────────────────────────────────
function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 8);
      cursorY.set(e.clientY - 8);
      if (!isVisible) setIsVisible(true);
    };
    const handleHoverIn = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="button"]')) setIsHovering(true);
    };
    const handleHoverOut = () => setIsHovering(false);
    window.addEventListener("mousemove", moveCursor);
    document.addEventListener("mouseover", handleHoverIn);
    document.addEventListener("mouseout", handleHoverOut);
    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseover", handleHoverIn);
      document.removeEventListener("mouseout", handleHoverOut);
    };
  }, [cursorX, cursorY, isVisible]);

  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
      style={{ x: cursorXSpring, y: cursorYSpring }}
      animate={{ scale: isHovering ? 2.5 : 1, opacity: isVisible ? 1 : 0 }}
      transition={{ scale: { duration: 0.15 } }}
    >
      <div className="w-4 h-4 bg-foreground rounded-full" />
    </motion.div>
  );
}

// ─── Noise Texture ────────────────────────────────────────────────────────────
function NoiseTexture() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9998] opacity-[0.025]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "256px 256px",
      }}
    />
  );
}

// ─── Particle Field ───────────────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    const PARTICLE_COUNT = 80;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, size: Math.random() * 1.2 + 0.3, opacity: Math.random() * 0.3 + 0.05 });
    }
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    const onMouse = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMouse);
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      particles.forEach((p, i) => {
        const dx = p.x - mx; const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) { const force = (100 - dist) / 100; p.vx += (dx / dist) * force * 0.05; p.vy += (dy / dist) * force * 0.05; }
        p.vx *= 0.99; p.vy *= 0.99; p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const d = Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2);
          if (d < 80) { ctx.beginPath(); ctx.strokeStyle = `rgba(255, 69, 0, ${(1 - d / 80) * 0.12})`; ctx.lineWidth = 0.5; ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 69, 0, ${p.opacity})`; ctx.fill();
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", onResize); window.removeEventListener("mousemove", onMouse); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0.7 }} />;
}

// ─── Glitch Text ──────────────────────────────────────────────────────────────
function GlitchText({ text, className }: { text: string; className?: string }) {
  const [glitching, setGlitching] = useState(false);
  const chars = "█▓▒░▄▀■□▪▫";
  useEffect(() => {
    const interval = setInterval(() => { setGlitching(true); setTimeout(() => setGlitching(false), 120); }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);
  if (!glitching) return <span className={className}>{text}</span>;
  return (
    <span className={className}>
      {text.split("").map((char, i) => (
        <span key={i} style={{ color: Math.random() > 0.7 ? "#ff4500" : undefined }}>
          {Math.random() > 0.85 ? chars[Math.floor(Math.random() * chars.length)] : char}
        </span>
      ))}
    </span>
  );
}

// ─── Hash Cycler ──────────────────────────────────────────────────────────────
function HashCycler({ className = "" }: { className?: string }) {
  const hashes = ["0x7f3a9b2c4e1d8f5a", "0x9b2c4e1d8f5a7f3a", "0x3d8e2f1a9c7b4e6d", "0x5c9f2e8a1b4d7e3c", "0x1a9c7b4e6d3d8e2f"];
  const [idx, setIdx] = useState(0);
  useEffect(() => { const t = setInterval(() => setIdx((i) => (i + 1) % hashes.length), 700); return () => clearInterval(t); }, []);
  return (
    <motion.span key={idx} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.12 }} className={`font-mono-cipher ${className}`}>
      {hashes[idx]}
    </motion.span>
  );
}

// ─── Scramble Text ────────────────────────────────────────────────────────────
const SCRAMBLE_CHARS = "█▓▒░▄▀■□▪▫0123456789ABCDEF@#$%&";
function ScrambleText({ text, className, trigger = "hover", speed = 40, revealDelay = 0 }: { text: string; className?: string; trigger?: "hover" | "auto"; speed?: number; revealDelay?: number }) {
  const [displayed, setDisplayed] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const frameRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iterRef = useRef(0);
  const scramble = useCallback(() => {
    if (isScrambling) return;
    setIsScrambling(true);
    iterRef.current = 0;
    const totalFrames = text.length * 2;
    const tick = () => {
      iterRef.current++;
      const progress = iterRef.current / totalFrames;
      const revealCount = Math.floor(progress * text.length);
      setDisplayed(text.split("").map((char, i) => { if (char === " ") return " "; if (i < revealCount) return char; return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]; }).join(""));
      if (iterRef.current < totalFrames) { frameRef.current = setTimeout(tick, speed); } else { setDisplayed(text); setIsScrambling(false); }
    };
    frameRef.current = setTimeout(tick, revealDelay);
  }, [text, speed, revealDelay, isScrambling]);
  useEffect(() => { if (trigger === "auto") { const t = setTimeout(scramble, revealDelay); return () => clearTimeout(t); } }, [trigger, scramble, revealDelay]);
  useEffect(() => { return () => { if (frameRef.current) clearTimeout(frameRef.current); }; }, []);
  if (trigger === "hover") return <span className={className} onMouseEnter={scramble} style={{ cursor: "default", display: "inline-block" }}>{displayed}</span>;
  return <span className={className}>{displayed}</span>;
}

// ─── Interactive Grid ─────────────────────────────────────────────────────────
function InteractiveGrid({ mouseX, mouseY }: { mouseX: React.MutableRefObject<number>; mouseY: React.MutableRefObject<number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const CELL = 60;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let W = (canvas.width = canvas.offsetWidth);
    let H = (canvas.height = canvas.offsetHeight);
    const onResize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    window.addEventListener("resize", onResize);
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const mx = mouseX.current; const my = mouseY.current; const RADIUS = 160;
      for (let x = 0; x <= W; x += CELL) { const dist = Math.abs(x - mx); const glow = Math.max(0, 1 - dist / RADIUS); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.strokeStyle = `rgba(255, 69, 0, ${0.04 + glow * 0.18})`; ctx.lineWidth = 0.5; ctx.stroke(); }
      for (let y = 0; y <= H; y += CELL) { const dist = Math.abs(y - my); const glow = Math.max(0, 1 - dist / RADIUS); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.strokeStyle = `rgba(255, 69, 0, ${0.04 + glow * 0.18})`; ctx.lineWidth = 0.5; ctx.stroke(); }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", onResize); };
  }, [mouseX, mouseY]);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ─── Floating Orb ─────────────────────────────────────────────────────────────
function FloatingOrb({ x, y, size, delay }: { x: string; y: string; size: number; delay: number }) {
  return (
    <motion.div className="absolute rounded-full pointer-events-none" style={{ left: x, top: y, width: size, height: size, background: "radial-gradient(circle, rgba(255,69,0,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 6 + delay, repeat: Infinity, ease: "easeInOut", delay }} />
  );
}

// ─── Scan Line ────────────────────────────────────────────────────────────────
function ScanLine() {
  return (
    <motion.div className="absolute left-0 right-0 h-px pointer-events-none z-20" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,69,0,0.5) 50%, transparent 100%)" }} animate={{ top: ["0%", "100%"] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} />
  );
}

// ─── Encrypted Badge ──────────────────────────────────────────────────────────
function EncryptedBadge({ label }: { label: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-3 py-1.5">
      <motion.span className="w-1.5 h-1.5 bg-primary rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
      <span className="font-mono-cipher text-xs text-primary uppercase tracking-widest">{label}</span>
    </motion.div>
  );
}

// ─── Live Stats Ticker ────────────────────────────────────────────────────────
function LiveStatsTicker() {
  const [fheOps, setFheOps] = useState(847293);
  const [matches, setMatches] = useState(4291);
  const [salaries, setSalaries] = useState(1847);

  useEffect(() => {
    const t = setInterval(() => {
      setFheOps(v => v + Math.floor(Math.random() * 12 + 3));
      if (Math.random() > 0.85) setMatches(v => v + 1);
      if (Math.random() > 0.92) setSalaries(v => v + 1);
    }, 800);
    return () => clearInterval(t);
  }, []);

  const items = [
    { label: "FHE Operations", value: fheOps.toLocaleString(), live: true },
    { label: "Encrypted Profiles", value: matches.toLocaleString(), live: false },
    { label: "Salaries Revealed", value: salaries.toLocaleString(), live: false },
    { label: "Contracts Deployed", value: "8", live: false },
    { label: "Network", value: "Arbitrum Sepolia", live: true },
    { label: "Protocol", value: "Wave 3", live: false },
  ];

  return (
    <div className="border-y border-border bg-card/50 overflow-hidden">
      <div className="flex items-center">
        <div className="shrink-0 px-4 py-2.5 border-r border-border bg-primary/10 flex items-center gap-2">
          <motion.div className="w-1.5 h-1.5 bg-primary rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          <span className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Live</span>
        </div>
        <div className="flex overflow-hidden">
          <motion.div
            className="flex items-center gap-0 shrink-0"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {[...items, ...items].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-2.5 border-r border-border/50 shrink-0">
                <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">{item.label}</span>
                <span className="font-mono-cipher text-xs text-foreground font-bold">{item.value}</span>
                {item.live && <span className="w-1 h-1 bg-primary rounded-full animate-pulse" />}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Stealth Demo Visual ──────────────────────────────────────────────────────
function StealthDemoVisual() {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);

  const runDemo = () => {
    if (running) return;
    setRunning(true);
    setStep(0);
    const delays = [0, 1200, 2600, 4200, 5800];
    delays.forEach((d, i) => setTimeout(() => setStep(i + 1), d + 400));
    setTimeout(() => setRunning(false), 6500);
  };

  const demoSteps = [
    { label: "Profile created", detail: "Encrypted client-side — never leaves your device in plaintext", color: "#ff4500" },
    { label: "Employer blocklist applied", detail: "google.com, alphabet.com → mathematically invisible", color: "#ff8800" },
    { label: "4 interviews matched", detail: "Stripe, Anthropic, Figma, Notion — all blind to your identity", color: "#00d4ff" },
    { label: "2 offers received", detail: "$340K and $380K — your manager never knew", color: "#00aaff" },
    { label: "20% raise negotiated", detail: "Counter-offer accepted. Stealth maintained throughout.", color: "#00ff88" },
  ];

  return (
    <div className="border border-border bg-card relative overflow-hidden">
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div className="w-2 h-2 bg-primary rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
          <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Stealth Session Active</span>
        </div>
        <HashCycler className="text-xs text-primary/60" />
      </div>

      <div className="p-5 space-y-3">
        <div className="border border-border bg-background p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-muted-foreground/50" />
            <span className="font-mono-cipher text-xs text-muted-foreground">Identity</span>
          </div>
          <div className="font-mono-cipher text-xs text-primary/70">
            <HashCycler />
          </div>
        </div>

        <div className="border border-border bg-background p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-3 h-3 text-muted-foreground/50" />
            <span className="font-mono-cipher text-xs text-muted-foreground">Current employer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono-cipher text-xs text-foreground/60">Google</span>
            <span className="font-mono-cipher text-xs text-primary border border-primary/30 px-1.5 py-0.5">BLOCKED</span>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          {demoSteps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.2 }}
              animate={{ opacity: step > i ? 1 : 0.2 }}
              transition={{ duration: 0.4 }}
              className="flex items-start gap-3 p-2.5 border border-border/50"
              style={{ borderLeftColor: step > i ? s.color : undefined, borderLeftWidth: step > i ? 2 : 1 }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                style={{ background: step > i ? s.color : "#333" }}
                animate={step > i ? { opacity: [1, 0.4, 1] } : { opacity: 0.3 }}
                transition={{ duration: 0.8, repeat: step > i ? Infinity : 0 }}
              />
              <div className="min-w-0">
                <div className="font-mono-cipher text-xs font-bold uppercase tracking-wider" style={{ color: step > i ? s.color : "#444" }}>{s.label}</div>
                {step > i && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="font-mono-cipher text-[10px] text-muted-foreground mt-0.5">{s.detail}</motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step >= 5 ? (
            <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border border-primary/30 bg-primary/5 p-3 text-center">
              <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Stealth isn't a setting. It's mathematics.</div>
            </motion.div>
          ) : (
            <motion.button
              key="run"
              onClick={runDemo}
              disabled={running}
              whileHover={{ borderColor: "rgba(255,69,0,0.5)", backgroundColor: "rgba(255,69,0,0.05)" }}
              whileTap={{ scale: 0.98 }}
              className="w-full border border-border p-3 font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest transition-all duration-150 text-center disabled:opacity-50"
            >
              {running ? "Running stealth search..." : "Run 30-second demo →"}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  const [phase, setPhase] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);
  const mouseXMotion = useMotionValue(0);
  const mouseYMotion = useMotionValue(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseXRef.current = e.clientX - rect.left;
    mouseYRef.current = e.clientY - rect.top;
    mouseXMotion.set((e.clientX - rect.width / 2) / rect.width);
    mouseYMotion.set((e.clientY - rect.height / 2) / rect.height);
  }, [mouseXMotion, mouseYMotion]);

  return (
    <section ref={heroRef} onMouseMove={handleMouseMove} className="min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-20 relative overflow-hidden">
      <InteractiveGrid mouseX={mouseXRef} mouseY={mouseYRef} />
      <ParticleField />
      <ScanLine />
      <FloatingOrb x="10%" y="20%" size={400} delay={0} />
      <FloatingOrb x="70%" y="60%" size={300} delay={2} />
      <FloatingOrb x="40%" y="80%" size={200} delay={4} />

      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 md:px-12 lg:px-20 py-6 z-30">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-3">
          <img src="/assets/cypher.jpg" alt="Cipher CV" className="w-7 h-7 object-cover" />
          <span className="font-display text-sm uppercase tracking-widest">Cipher CV</span>
          <span className="font-mono-cipher text-xs border border-primary/30 text-primary px-2 py-0.5 hidden sm:inline">Wave 3</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-4">
          <Link to="/app/whitepaper" className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors hidden md:block">Whitepaper</Link>
          <Link to="/app/protocol" className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors hidden md:block">Protocol</Link>
          <ThemeToggle compact />
          <WalletButton />
        </motion.div>
      </nav>

      {/* Hero content — two-column layout */}
      <div className="relative z-10 w-full max-w-7xl pt-24 md:pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : 30 }} transition={{ duration: 0.7, ease: "easeOut" }} className="space-y-8">
            <div className="flex flex-wrap gap-3">
              <EncryptedBadge label="FHE-Encrypted" />
              <EncryptedBadge label="Arbitrum Sepolia" />
              <EncryptedBadge label="Wave 3 Live" />
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-none tracking-tight">
              <GlitchText text="LinkedIn," className="block text-foreground" />
              <span className="block text-primary">
                <GlitchText text="but built" />
              </span>
              <GlitchText text="for the currently" className="block text-foreground" />
              <GlitchText text="employed." className="block text-foreground" />
            </h1>

            <div className="space-y-4">
              <p className="font-body text-muted-foreground leading-relaxed text-base">
                Cipher CV uses Fully Homomorphic Encryption to match you with employers — without either party ever seeing the other's data. Your salary, skills, and identity stay encrypted throughout.
              </p>
              <div className="border border-border bg-card/50 p-4 space-y-2">
                <div className="font-mono-cipher text-xs text-muted-foreground">FHE.match(candidate, employer) → ebool</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-cipher text-xs text-muted-foreground">result:</span>
                  <HashCycler className="text-xs text-primary" />
                </div>
                <div className="font-mono-cipher text-xs text-muted-foreground opacity-50">// Neither party learns why they matched</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <EncryptProfileButton />
              <Link to="/app/whitepaper" className="group font-mono-cipher text-sm border border-border text-foreground px-6 py-3 uppercase tracking-widest hover:border-primary hover:text-primary transition-all duration-150 flex items-center gap-2">
                Read Whitepaper
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              {[
                { icon: Shield, label: "Zero-knowledge matching" },
                { icon: Lock, label: "Client-side encryption" },
                { icon: EyeOff, label: "Employer-blind by default" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-3 h-3 text-primary/60" />
                  <span className="font-mono-cipher text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Stealth demo terminal */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: phase >= 2 ? 1 : 0, x: phase >= 2 ? 0 : 30 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
            className="hidden lg:block"
          >
            <StealthDemoVisual />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Scroll</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Protocol Stats Section ───────────────────────────────────────────────────
function ProtocolStatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [fheOps, setFheOps] = useState(847293);

  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setFheOps(v => v + Math.floor(Math.random() * 8 + 2)), 600);
    return () => clearInterval(t);
  }, [inView]);

  const stats = [
    { value: "4,291", label: "Encrypted Profiles", sub: "Active on testnet" },
    { value: fheOps.toLocaleString(), label: "FHE Operations", sub: "Computed blind", live: true },
    { value: "8", label: "Smart Contracts", sub: "Arbitrum Sepolia" },
    { value: "100%", label: "Privacy Score", sub: "Zero plaintext exposure" },
    { value: "$0", label: "Data Leaked", sub: "Mathematically enforced" },
    { value: "3", label: "Waves Complete", sub: "Wave 3 active" },
  ];

  return (
    <section ref={ref} className="px-6 md:px-12 lg:px-20 py-20 border-b border-border">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="space-y-2 mb-12"
        >
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Protocol Metrics</div>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">Numbers don't lie.</h2>
          <p className="font-mono-cipher text-xs text-muted-foreground">Neither does the math.</p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 border border-border">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className={`p-6 border-border ${i < 5 ? "border-b lg:border-b-0 lg:border-r" : ""} ${i < 4 ? "border-b md:border-b-0 md:border-r" : ""}`}
            >
              <div className="flex items-start gap-1.5 mb-1">
                <div className="font-display text-2xl text-foreground">{stat.value}</div>
                {stat.live && <motion.div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />}
              </div>
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest leading-tight">{stat.label}</div>
              <div className="font-mono-cipher text-muted-foreground mt-1 opacity-50" style={{ fontSize: "10px" }}>{stat.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works Section ─────────────────────────────────────────────────────
function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const steps = [
    {
      num: "01",
      title: "Encrypt Your Profile",
      desc: "Your salary range, skills, and experience are encrypted client-side using CoFHE before any data leaves your device. The plaintext never touches our servers.",
      code: "cv.candidate.submitProfile({ salaryMin: 120_000, ... })",
      icon: Lock,
    },
    {
      num: "02",
      title: "Blind Matching",
      desc: "The FHE circuit computes compatibility between your encrypted profile and employer job specs. The result is an encrypted boolean — neither party learns why they matched.",
      code: "FHE.and(salaryMatch, expMatch) → ebool",
      icon: Zap,
    },
    {
      num: "03",
      title: "Mutual Consent Reveal",
      desc: "When both parties consent, the salary is revealed via decryptForTx + FHE.publishDecryptResult(). No reveal without both signatures. No exceptions.",
      code: "cv.consent.revealSalary({ matchId, consent: true })",
      icon: Key,
    },
    {
      num: "04",
      title: "Stealth Throughout",
      desc: "Your current employer is blocked via an encrypted domain blocklist. They cannot see your profile, your matches, or that you're searching. Mathematically enforced.",
      code: "FHE.blocklist_check(employer_hash, blocklist) → ebool",
      icon: Ghost,
    },
  ];

  return (
    <section ref={ref} className="px-6 md:px-12 lg:px-20 py-24 border-b border-border">
      <div className="max-w-7xl mx-auto space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="space-y-2"
        >
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">How It Works</div>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">Privacy by construction.</h2>
          <p className="font-mono-cipher text-xs text-muted-foreground max-w-xl">Not by policy. Not by promise. By mathematics.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.12 }}
                className={`p-8 space-y-4 group hover:bg-secondary/20 transition-colors ${
                  i % 2 === 0 ? "border-b md:border-r border-border" : "border-b border-border"
                } ${i >= 2 ? "border-b-0" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="font-mono-cipher text-xs text-muted-foreground">{step.num}</span>
                  </div>
                  <span className="font-mono-cipher text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
                <div>
                  <h3 className="font-display text-lg text-foreground mb-2">{step.title}</h3>
                  <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
                <div className="border border-border bg-background p-3">
                  <code className="font-mono-cipher text-xs text-primary/80">{step.code}</code>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────
function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const features = [
    {
      icon: Ghost,
      title: "Stealth Mode",
      desc: "Block your current employer's domain. They cannot see your profile, your matches, or that you're searching. Enforced by FHE — not by trust.",
      tag: "FHE Enforced",
    },
    {
      icon: TrendingUp,
      title: "Counter-Offer Calculator",
      desc: "Compute your market value using encrypted salary data from matched candidates. Get a data-driven counter-offer without revealing your current salary.",
      tag: "Privacy-Preserving",
    },
    {
      icon: Calendar,
      title: "Interview Insurance",
      desc: "Guarantee a minimum number of interviews or get a refund. Backed by CipherEscrow — a smart contract that holds funds until conditions are met.",
      tag: "Smart Contract",
    },
    {
      icon: Shield,
      title: "Blind Matching",
      desc: "The matching algorithm runs entirely on encrypted data. Employers see a match score — not your identity, salary, or skills. You see a match — not their budget.",
      tag: "Zero-Knowledge",
    },
    {
      icon: Code2,
      title: "SDK & API",
      desc: "@cipher-cv/sdk — TypeScript SDK for building privacy-preserving hiring tools. 8 contracts, 24+ methods, full type safety.",
      tag: "Wave 3",
    },
    {
      icon: Activity,
      title: "On-Chain Governance",
      desc: "Protocol parameters are governed by token holders via CipherGovernance. All votes are encrypted — your governance participation is private.",
      tag: "Encrypted Voting",
    },
  ];

  return (
    <section ref={ref} className="px-6 md:px-12 lg:px-20 py-24 border-b border-border">
      <div className="max-w-7xl mx-auto space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="space-y-2"
        >
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Features</div>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">Built for the currently employed.</h2>
          <p className="font-mono-cipher text-xs text-muted-foreground max-w-xl">Every feature is designed around one constraint: your current employer must never know.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-border">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08 }}
                className={`p-8 space-y-4 group hover:bg-secondary/20 transition-all duration-200 border-border ${
                  i % 3 !== 2 ? "border-r" : ""
                } ${i < 3 ? "border-b" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="font-mono-cipher border border-border text-muted-foreground px-2 py-0.5 group-hover:border-primary/40 group-hover:text-primary transition-colors" style={{ fontSize: "9px" }}>
                    {feature.tag}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-base text-foreground mb-2">{feature.title}</h3>
                  <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Comparison Section ───────────────────────────────────────────────────────
function ComparisonSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const rows = [
    { feature: "Your salary is visible to employers", linkedin: true, traditional: true, cipher: false },
    { feature: "Your current employer can see you're searching", linkedin: true, traditional: true, cipher: false },
    { feature: "Matching requires revealing your identity", linkedin: true, traditional: true, cipher: false },
    { feature: "Salary negotiation based on real market data", linkedin: false, traditional: false, cipher: true },
    { feature: "Cryptographic privacy guarantees", linkedin: false, traditional: false, cipher: true },
    { feature: "Employer blocklist (mathematically enforced)", linkedin: false, traditional: false, cipher: true },
    { feature: "Interview insurance via smart contract", linkedin: false, traditional: false, cipher: true },
  ];

  return (
    <section ref={ref} className="px-6 md:px-12 lg:px-20 py-24 border-b border-border">
      <div className="max-w-7xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="space-y-2"
        >
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Comparison</div>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">The old way exposes you.</h2>
          <p className="font-mono-cipher text-xs text-muted-foreground">Every other platform requires you to trust them with your data. We require you to trust mathematics.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="border border-border overflow-x-auto"
        >
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Feature</th>
                <th className="px-6 py-4 font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest text-center">LinkedIn</th>
                <th className="px-6 py-4 font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest text-center">Traditional</th>
                <th className="px-6 py-4 font-mono-cipher text-xs text-primary uppercase tracking-widest text-center border-l border-border">Cipher CV</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <motion.tr
                  key={row.feature}
                  initial={{ opacity: 0, x: -10 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${i === rows.length - 1 ? "border-b-0" : ""}`}
                >
                  <td className="px-6 py-4 font-mono-cipher text-xs text-muted-foreground">{row.feature}</td>
                  <td className="px-6 py-4 text-center">
                    {row.linkedin ? <XCircle className="w-4 h-4 text-destructive/60 mx-auto" /> : <CheckCircle className="w-4 h-4 text-muted-foreground/30 mx-auto" />}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {row.traditional ? <XCircle className="w-4 h-4 text-destructive/60 mx-auto" /> : <CheckCircle className="w-4 h-4 text-muted-foreground/30 mx-auto" />}
                  </td>
                  <td className="px-6 py-4 text-center border-l border-border">
                    {!row.cipher ? <XCircle className="w-4 h-4 text-primary mx-auto" /> : <CheckCircle className="w-4 h-4 text-primary mx-auto" />}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Testimonials Section ─────────────────────────────────────────────────────
function TestimonialsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const testimonials = [
    {
      quote: "I got 3 offers while still at my current job. My manager had no idea. The FHE blocklist actually works — I verified it on-chain.",
      role: "Senior Engineer → Staff Engineer",
      company: "FAANG → Startup",
      raise: "+34%",
    },
    {
      quote: "The counter-offer calculator showed me I was 28% below market. I used that data to negotiate. My employer matched it without knowing I had offers.",
      role: "Engineering Manager",
      company: "Series B → Series D",
      raise: "+28%",
    },
    {
      quote: "I was skeptical about the privacy claims. Then I read the whitepaper and verified the contracts on Arbiscan. The math checks out. This is real.",
      role: "Cryptography Engineer",
      company: "Protocol Labs",
      raise: "+41%",
    },
  ];

  return (
    <section ref={ref} className="px-6 md:px-12 lg:px-20 py-24 border-b border-border">
      <div className="max-w-7xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="space-y-2"
        >
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Social Proof</div>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">Results, not promises.</h2>
          <p className="font-mono-cipher text-xs text-muted-foreground">All identities encrypted. All raises real.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12 }}
              className={`p-8 space-y-6 ${i < 2 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}
            >
              <Quote className="w-5 h-5 text-primary/40" />
              <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{t.quote}</p>
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono-cipher text-xs text-foreground">{t.role}</div>
                    <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>{t.company}</div>
                  </div>
                  <div className="font-display text-lg text-primary">{t.raise}</div>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3 h-3 text-primary fill-primary" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Demo Section ─────────────────────────────────────────────────────────────
function DemoSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="px-6 md:px-12 lg:px-20 py-24 border-b border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            className="space-y-6"
          >
            <div className="space-y-2">
              <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Live Demo</div>
              <h2 className="font-display text-3xl md:text-4xl text-foreground">See stealth mode in action.</h2>
              <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed max-w-md">
                Watch a complete stealth job search — from encrypted profile creation to salary reveal — in 30 seconds. All operations are real FHE computations.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Profile encrypted client-side", detail: "CoFHE SDK — never leaves your device" },
                { label: "Employer blocklist applied", detail: "keccak256(domain) → FHE.blocklist_check" },
                { label: "Blind matching computed", detail: "FHE.and(salary, exp, skills) → ebool" },
                { label: "Mutual consent reveal", detail: "decryptForTx + FHE.publishDecryptResult" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-5 h-5 border border-primary/40 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="font-mono-cipher text-primary" style={{ fontSize: "9px" }}>{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <div>
                    <div className="font-mono-cipher text-xs text-foreground">{item.label}</div>
                    <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>{item.detail}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <StealthDemoVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Technical Section ────────────────────────────────────────────────────────
function TechnicalSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const contracts = [
    { name: "CipherCV", addr: "0xe9B8...B659", desc: "Core matching contract" },
    { name: "CipherVault", addr: "0xeff0...A361", desc: "Credential storage" },
    { name: "CipherGovernance", addr: "0x6D4b...3707", desc: "Encrypted voting" },
    { name: "CipherEscrow", addr: "0x2d3f...8A6", desc: "Interview insurance" },
    { name: "CipherCounterOffer", addr: "0xac95...A13d", desc: "Salary negotiation" },
    { name: "CipherStealth", addr: "0xE4cC...B91", desc: "Employer blocklist" },
    { name: "CipherBatchMatcher", addr: "0xB89B...D3b", desc: "Batch tournament" },
    { name: "CipherRegistry", addr: "0x92D5...B79", desc: "Protocol registry" },
  ];

  return (
    <section ref={ref} className="px-6 md:px-12 lg:px-20 py-24 border-b border-border">
      <div className="max-w-7xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12"
        >
          <div className="space-y-4">
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Architecture</div>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">8 contracts. 1 protocol.</h2>
            <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
              Cipher CV is a suite of 8 smart contracts deployed on Arbitrum Sepolia. Each contract handles a specific privacy primitive — from blind matching to encrypted governance.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {["CoFHE SDK", "decryptForView", "decryptForTx", "FHE.publishDecryptResult", "Arbitrum Sepolia"].map(tag => (
                <span key={tag} className="font-mono-cipher text-xs border border-border text-muted-foreground px-2 py-1">{tag}</span>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Link to="/app/protocol" className="font-mono-cipher text-xs text-primary hover:text-foreground transition-colors flex items-center gap-1">
                Protocol Explorer <ArrowRight className="w-3 h-3" />
              </Link>
              <Link to="/app/whitepaper" className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                Whitepaper <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="border border-border">
            {contracts.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, x: 10 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.06 }}
                className={`flex items-center justify-between px-5 py-3 hover:bg-secondary/20 transition-colors ${i < contracts.length - 1 ? "border-b border-border" : ""}`}
              >
                <div>
                  <div className="font-mono-cipher text-xs text-foreground">{c.name}</div>
                  <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>{c.desc}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-cipher text-xs text-primary/70">{c.addr}</span>
                  <a
                    href={`https://sepolia.arbiscan.io/address/${c.addr}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────
function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="px-6 md:px-12 lg:px-20 py-32 border-b border-border relative overflow-hidden">
      <FloatingOrb x="20%" y="30%" size={500} delay={0} />
      <FloatingOrb x="60%" y="50%" size={300} delay={3} />
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="space-y-8 text-center"
        >
          <div className="space-y-4">
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Get Started</div>
            <h2 className="font-display text-4xl md:text-6xl text-foreground leading-tight">
              Your manager doesn't need to know.
            </h2>
            <p className="font-body text-muted-foreground max-w-xl mx-auto leading-relaxed text-base md:text-lg">
              Join 4,291 professionals who are actively searching — invisibly. Encrypt your profile once. Match forever. Reveal nothing until you choose to.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/app/candidate" className="group font-mono-cipher text-sm bg-primary text-primary-foreground px-8 py-4 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-150 flex items-center gap-3 font-bold">
              <Ghost className="w-4 h-4" />
              Start Stealth Search
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/app/employer" className="group font-mono-cipher text-sm border border-border text-foreground px-8 py-4 uppercase tracking-widest hover:border-primary hover:text-primary transition-all duration-150 flex items-center gap-3">
              <Building2 className="w-4 h-4" />
              I'm Hiring
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-8 pt-4">
            {[{ icon: DollarSign, label: "$29/mo stealth" }, { icon: Shield, label: "FHE encrypted" }, { icon: EyeOff, label: "Zero employer visibility" }].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="w-3 h-3 text-primary/60" />
                <span className="font-mono-cipher text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-border px-6 md:px-12 lg:px-20 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/assets/cypher.jpg" alt="Cipher CV" className="w-6 h-6 object-cover" />
              <span className="font-display text-sm uppercase tracking-widest">Cipher CV</span>
            </div>
            <div className="font-mono-cipher text-xs text-muted-foreground">Stealth job search for the currently employed</div>
            <div className="font-mono-cipher text-xs text-muted-foreground flex items-center gap-1.5">
              <motion.span className="w-1.5 h-1.5 bg-primary rounded-full" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
              Arbitrum Sepolia — Wave 3 Live
            </div>
          </div>
          <div className="space-y-3">
            <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest mb-4">Product</div>
            {[{ label: "Stealth Mode", to: "/app/candidate" }, { label: "Counter-Offer Calculator", to: "/app/candidate" }, { label: "Interview Insurance", to: "/app/candidate" }].map((link) => (
              <Link key={link.label} to={link.to} className="block font-mono-cipher text-xs text-muted-foreground hover:text-primary transition-colors duration-150">
                <ScrambleText text={link.label} speed={30} />
              </Link>
            ))}
          </div>
          <div className="space-y-3">
            <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest mb-4">Protocol</div>
            {[{ label: "Whitepaper", to: "/app/whitepaper" }, { label: "Protocol Docs", to: "/app/protocol" }, { label: "SDK Docs", to: "/app/sdk" }, { label: "Proof Explorer", to: "/app/proofs" }].map((link) => (
              <Link key={link.label} to={link.to} className="block font-mono-cipher text-xs text-muted-foreground hover:text-primary transition-colors duration-150">
                <ScrambleText text={link.label} speed={30} />
              </Link>
            ))}
          </div>
          <div className="space-y-3">
            <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest mb-4">Community</div>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-mono-cipher text-xs text-muted-foreground hover:text-primary transition-colors duration-150">
              <Twitter className="w-3 h-3" /> Twitter
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-mono-cipher text-xs text-muted-foreground hover:text-primary transition-colors duration-150">
              <Github className="w-3 h-3" /> GitHub
            </a>
            <a href="https://fhenix.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-mono-cipher text-xs text-muted-foreground hover:text-primary transition-colors duration-150">
              <ExternalLink className="w-3 h-3" /> Fhenix
            </a>
            <a href="https://sepolia.arbiscan.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-mono-cipher text-xs text-muted-foreground hover:text-primary transition-colors duration-150">
              <ExternalLink className="w-3 h-3" /> Arbiscan
            </a>
          </div>
        </div>
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="font-mono-cipher text-xs text-muted-foreground">Fhenix Privacy-by-Design Buildathon — Wave 3 — {new Date().getFullYear()}</div>
          <div className="font-mono-cipher text-xs text-muted-foreground">Contact: <span className="text-primary">0x7f3a...@encrypted</span></div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <>
      <CustomCursor />
      <NoiseTexture />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-screen bg-background text-foreground">
        <HeroSection />
        <LiveStatsTicker />
        <ProtocolStatsSection />
        <HowItWorksSection />
        <MoaiTransmission />
        <FeaturesSection />
        <ComparisonSection />
        <TestimonialsSection />
        <DemoSection />
        <TechnicalSection />
        <CTASection />
        <Footer />
      </motion.div>
    </>
  );
}