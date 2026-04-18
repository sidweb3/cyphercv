import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView, useMotionValue, useSpring } from "framer-motion";
import { Link } from "react-router";
import { MoaiTransmission } from "@/components/MoaiTransmission";
import { WalletButton, EncryptProfileButton } from "@/components/WalletButton";
import { ExternalLink, ArrowRight, Twitter, Github, Lock, Shield, EyeOff, ChevronDown, User, Building2, Key, Ghost, TrendingUp, Calendar, DollarSign, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

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
        {/* Identity block */}
        <div className="border border-border bg-background p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-muted-foreground/50" />
            <span className="font-mono-cipher text-xs text-muted-foreground">Identity</span>
          </div>
          <div className="font-mono-cipher text-xs text-primary/70">
            <HashCycler />
          </div>
        </div>

        {/* Current employer block */}
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

        {/* Steps */}
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

        {/* CTA */}
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
      <FloatingOrb x="50%" y="10%" size={200} delay={4} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, rgba(8,8,8,0.8) 100%)" }} />

      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 md:px-12 lg:px-20 py-5 z-20">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-3">
          <div className="relative">
            <img src="/assets/cypher.jpg" alt="Cipher CV" className="w-8 h-8 object-cover" />
            <motion.div className="absolute inset-0 border border-primary/40" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
          </div>
          <span className="font-display text-sm uppercase tracking-widest text-foreground"><GlitchText text="Cipher CV" /></span>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="hidden md:flex items-center gap-8">
          {[{ label: "How It Works", href: "#how-it-works" }, { label: "Pricing", href: "#pricing" }, { label: "Demo", href: "#demo" }].map((item) => (
            <motion.a key={item.label} href={item.href} whileHover={{ color: "#ff4500", x: 2 }} className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest transition-colors duration-150">
              <ScrambleText text={item.label} speed={30} />
            </motion.a>
          ))}
          <Link to="/app/candidate" className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
            <ScrambleText text="Dashboard" speed={30} />
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-3">
          <a href="https://fhenix.io" target="_blank" rel="noopener noreferrer" className="hidden md:flex font-mono-cipher text-xs border border-border px-3 py-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-all duration-100 items-center gap-1.5">
            Fhenix <ExternalLink className="w-3 h-3" />
          </a>
          <WalletButton />
        </motion.div>
      </nav>

      {/* Hero content */}
      <div className="max-w-7xl mx-auto w-full pt-24 pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}>
              <EncryptedBadge label="70% of professionals are open to new jobs. 0% can risk their boss finding out." />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}>
              <h1 className="font-display text-[clamp(2.8rem,7vw,6.5rem)] leading-[0.92] tracking-tight text-foreground">
                <AnimatePresence mode="wait">
                  {phase < 1 ? (
                    <motion.span key="p0" exit={{ opacity: 0 }} className="block">
                      Your boss<br />
                      <span className="text-muted-foreground/50">is watching.</span>
                    </motion.span>
                  ) : phase < 2 ? (
                    <motion.span key="p1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="block">
                      <span className="line-through text-muted-foreground/30 text-[clamp(1.4rem,3.5vw,2.8rem)] block mb-2">Your boss is watching.</span>
                      Your search<br />
                      <span className="text-primary">is not.</span>
                    </motion.span>
                  ) : (
                    <motion.span key="p2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="block">
                      <span className="line-through text-muted-foreground/30 text-[clamp(1.4rem,3.5vw,2.8rem)] block mb-2">Your boss is watching.</span>
                      Your search<br />
                      <span className="text-primary relative inline-block">
                        is not.
                        <motion.span className="absolute bottom-1 left-0 h-[2px] bg-primary" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
                      </span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </h1>
            </motion.div>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.6 }} className="font-body text-muted-foreground max-w-lg leading-relaxed text-base md:text-lg">
              The stealth job search platform for the currently employed. Your profile is encrypted and invisible to your current employer — by mathematics, not by policy.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0, duration: 0.6 }} className="flex flex-wrap gap-3">
              <EncryptProfileButton />
              <Link to="/app/candidate" className="group font-mono-cipher text-xs bg-secondary text-foreground px-6 py-3 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-150 border border-border flex items-center gap-2">
                Start Stealth Search <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="flex items-center gap-8 pt-2 border-t border-border/50">
              {[
                { label: "Stealth Profiles Active", value: "4,291" },
                { label: "Employers Blocked", value: "1,847" },
                { label: "Salary Leaked", value: "0" },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 + i * 0.1 }} className="space-y-0.5 pt-4">
                  <div className="font-display text-xl text-foreground">{stat.value}</div>
                  <div className="font-mono-cipher text-xs text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right: Stealth Demo */}
          <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }} className="lg:col-span-5">
            <StealthDemoVisual />
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
        <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Scroll</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── How It Works Section ─────────────────────────────────────────────────────
function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    { num: "01", title: "Encrypt Your Profile", desc: "Salary, skills, and experience are encrypted client-side using FHE. No plaintext ever leaves your device.", icon: Lock, color: "#ff4500" },
    { num: "02", title: "Block Your Employer", desc: "Add your current employer's domain to the encrypted blocklist. They become mathematically invisible to your profile.", icon: EyeOff, color: "#ff8800" },
    { num: "03", title: "Match in the Dark", desc: "The algorithm runs on encrypted data. Employers evaluate your fit without seeing your identity, salary, or current company.", icon: Ghost, color: "#00d4ff" },
    { num: "04", title: "Reveal on Your Terms", desc: "Only when you consent does your identity unlock. Until then, you're a cryptographic proof — not a person.", icon: Key, color: "#00ff88" },
  ];

  return (
    <section id="how-it-works" ref={ref} className="py-24 px-6 md:px-12 lg:px-20 border-t border-border relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: "linear-gradient(#ff4500 1px, transparent 1px), linear-gradient(90deg, #ff4500 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="mb-16">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest mb-4">§ 01 — How It Works</div>
          <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-tight text-foreground mb-6">
            Stealth isn't a setting.<br />
            <span className="text-primary">It's mathematics.</span>
          </h2>
          <p className="font-body text-muted-foreground max-w-xl text-base leading-relaxed">
            LinkedIn "Open to Work" is visible to everyone — including your manager. Cipher CV uses fully homomorphic encryption to make your job search cryptographically invisible to your current employer.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-border">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`p-8 space-y-4 relative group hover:bg-card transition-colors duration-200 ${i < steps.length - 1 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}
            >
              <div className="flex items-start justify-between">
                <span className="font-mono-cipher text-xs uppercase" style={{ color: step.color + "66" }}>{step.num}</span>
                <step.icon className="w-4 h-4 transition-colors duration-200" style={{ color: step.color + "66" }} />
              </div>
              <h3 className="font-display text-lg text-foreground leading-tight"><ScrambleText text={step.title} speed={35} /></h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              <motion.div className="absolute bottom-0 left-0 h-px" style={{ background: step.color }} initial={{ width: 0 }} whileHover={{ width: "100%" }} transition={{ duration: 0.3 }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features Section (3 Revenue Products) ───────────────────────────────────
function FeaturesSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" ref={ref} className="py-24 px-6 md:px-12 lg:px-20 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="mb-16">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest mb-4">§ 02 — Products</div>
          <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-tight text-foreground">
            Three tools.<br />
            <span className="text-primary">One outcome.</span>
          </h2>
          <p className="font-body text-muted-foreground mt-4 max-w-xl text-base leading-relaxed">
            A raise, a new job, or both — without your employer ever knowing you were looking.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-border">
          {/* Stealth Mode */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0 }} className="p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-border group hover:bg-card transition-colors duration-200 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <Ghost className="w-6 h-6 text-primary/60 group-hover:text-primary transition-colors" />
              <span className="font-mono-cipher text-xs text-primary border border-primary/30 px-2 py-0.5">$29/mo</span>
            </div>
            <div>
              <h3 className="font-display text-2xl text-foreground mb-2">Stealth Mode</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">Your profile is encrypted and invisible to your current employer. All activity hidden until you authorize reveal.</p>
            </div>
            <ul className="space-y-2">
              {["Employer domain blocklist (FHE)", "FHE time-lock: show profile from [date]", "All activity encrypted by default", "Zero-knowledge activity log"].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                  <span className="font-mono-cipher text-xs text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/app/candidate" className="group/btn font-mono-cipher text-xs border border-border px-4 py-2.5 text-muted-foreground hover:border-primary hover:text-foreground transition-all duration-150 flex items-center gap-2 w-fit">
              Start Stealth <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
            <motion.div className="absolute bottom-0 left-0 h-px bg-primary" initial={{ width: 0 }} whileHover={{ width: "100%" }} transition={{ duration: 0.3 }} />
          </motion.div>

          {/* Counter-Offer Calculator */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }} className="p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-border group hover:bg-card transition-colors duration-200 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <TrendingUp className="w-6 h-6 text-primary/60 group-hover:text-primary transition-colors" />
              <span className="font-mono-cipher text-xs text-primary border border-primary/30 px-2 py-0.5">$49 report</span>
            </div>
            <div>
              <h3 className="font-display text-2xl text-foreground mb-2">Counter-Offer Calculator</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">Input your encrypted salary and target increase. Get a personalized negotiation strategy backed by real market data.</p>
            </div>
            <div className="border border-border bg-background p-3 space-y-2">
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest mb-2">Sample output</div>
              <div className="flex items-center justify-between">
                <span className="font-mono-cipher text-xs text-muted-foreground">Your current salary</span>
                <span className="font-mono-cipher text-xs text-primary">████████</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono-cipher text-xs text-muted-foreground">Offers needed</span>
                <span className="font-mono-cipher text-xs text-foreground">3 averaging $X</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono-cipher text-xs text-muted-foreground">Negotiation leverage</span>
                <span className="font-mono-cipher text-xs text-primary">+23% projected</span>
              </div>
            </div>
            <Link to="/app/candidate" className="group/btn font-mono-cipher text-xs border border-border px-4 py-2.5 text-muted-foreground hover:border-primary hover:text-foreground transition-all duration-150 flex items-center gap-2 w-fit">
              Get Report <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
            <motion.div className="absolute bottom-0 left-0 h-px bg-primary" initial={{ width: 0 }} whileHover={{ width: "100%" }} transition={{ duration: 0.3 }} />
          </motion.div>

          {/* Interview Insurance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }} className="p-8 space-y-6 group hover:bg-card transition-colors duration-200 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <Calendar className="w-6 h-6 text-primary/60 group-hover:text-primary transition-colors" />
              <span className="font-mono-cipher text-xs text-primary border border-primary/30 px-2 py-0.5">$99 guaranteed</span>
            </div>
            <div>
              <h3 className="font-display text-2xl text-foreground mb-2">Interview Insurance</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">Pay $99, get 3 guaranteed interviews with vetted employers. No interviews in 30 days? Full refund. Employers pre-commit via FHE escrow.</p>
            </div>
            <ul className="space-y-2">
              {["3 guaranteed interviews", "30-day money-back guarantee", "Vetted employer network", "FHE escrow commitment"].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                  <span className="font-mono-cipher text-xs text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/app/candidate" className="group/btn font-mono-cipher text-xs border border-border px-4 py-2.5 text-muted-foreground hover:border-primary hover:text-foreground transition-all duration-150 flex items-center gap-2 w-fit">
              Get Insured <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
            <motion.div className="absolute bottom-0 left-0 h-px bg-primary" initial={{ width: 0 }} whileHover={{ width: "100%" }} transition={{ duration: 0.3 }} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Comparison Section ───────────────────────────────────────────────────────
function ComparisonSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const rows = [
    { label: "Visibility to current employer", linkedin: "Open to Work badge visible to all", cipher: "Mathematically invisible" },
    { label: "Salary exposure", linkedin: "Revealed to every recruiter", cipher: "Encrypted — never exposed" },
    { label: "Identity during search", linkedin: "Name + photo + company visible", cipher: "Anonymous until you consent" },
    { label: "Rejection signal", linkedin: "Reveals you're actively looking", cipher: "Zero information leakage" },
    { label: "Negotiation leverage", linkedin: "Employer knows your desperation", cipher: "Symmetric information" },
    { label: "Trust model", linkedin: "Trust LinkedIn's privacy settings", cipher: "Trust the mathematics" },
  ];

  return (
    <section ref={ref} className="py-24 px-6 md:px-12 lg:px-20 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="mb-16">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest mb-4">§ 03 — Comparison</div>
          <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-tight text-foreground">
            LinkedIn "Open to Work"<br />
            <span className="text-primary">vs. actually private.</span>
          </h2>
        </motion.div>

        <div className="border border-border overflow-hidden">
          <div className="grid grid-cols-3 border-b border-border">
            <div className="p-4 font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Attribute</div>
            <div className="p-4 border-l border-border">
              <div className="flex items-center gap-2">
                <XCircle className="w-3 h-3 text-destructive/60" />
                <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">LinkedIn</span>
              </div>
            </div>
            <div className="p-4 border-l border-border">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-primary" />
                <span className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Cipher CV</span>
              </div>
            </div>
          </div>
          {rows.map((row, i) => (
            <motion.div key={row.label} initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.07 }} className={`grid grid-cols-3 group hover:bg-card transition-colors duration-150 ${i < rows.length - 1 ? "border-b border-border" : ""}`}>
              <div className="p-4 font-body text-sm text-foreground"><ScrambleText text={row.label} speed={25} /></div>
              <div className="p-4 border-l border-border font-body text-sm text-muted-foreground/60 flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 text-destructive/40 mt-0.5 flex-shrink-0" />
                {row.linkedin}
              </div>
              <div className="p-4 border-l border-border font-body text-sm text-primary/80"><ScrambleText text={row.cipher} speed={25} /></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Demo Section ─────────────────────────────────────────────────────────────
function DemoSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="demo" ref={ref} className="py-24 px-6 md:px-12 lg:px-20 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="mb-16">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest mb-4">§ 04 — The Demo</div>
          <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-tight text-foreground">
            30 seconds.<br />
            <span className="text-primary">The whole story.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-border">
          {/* Narrative */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="p-8 lg:border-r border-border space-y-6">
            <div className="space-y-4">
              {[
                { quote: "I'm employed at Google. I can't let them know I'm looking.", speaker: "Sarah, Senior Engineer" },
                { quote: "I got 4 interviews, 2 offers, negotiated a 20% raise — my manager never knew.", speaker: "Sarah, 6 weeks later" },
              ].map((q, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 + i * 0.2 }} className="border-l-2 border-primary pl-4 py-1">
                  <p className="font-body text-base text-foreground leading-relaxed mb-2">"{q.quote}"</p>
                  <span className="font-mono-cipher text-xs text-muted-foreground">— {q.speaker}</span>
                </motion.div>
              ))}
            </div>

            <div className="border border-border bg-background p-4 space-y-3">
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">The reveal</div>
              <p className="font-display text-xl text-foreground leading-tight">
                "Stealth isn't a setting.<br />
                <span className="text-primary">It's mathematics."</span>
              </p>
            </div>

            <div className="space-y-2">
              {[
                { label: "LinkedIn Open to Work", visible: true, desc: "Visible to 900M users including your manager" },
                { label: "Cipher CV Stealth Mode", visible: false, desc: "Encrypted — google.com sees nothing" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 p-3 border border-border">
                  {item.visible ? <EyeOff className="w-4 h-4 text-destructive/60 mt-0.5 flex-shrink-0" /> : <Lock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />}
                  <div>
                    <div className="font-mono-cipher text-xs font-bold text-foreground">{item.label}</div>
                    <div className="font-mono-cipher text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Interactive demo */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }} className="p-8">
            <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest mb-4">Interactive demo</div>
            <StealthDemoVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Technical Section ────────────────────────────────────────────────────────
function TechnicalSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const specs = [
    { label: "Encryption Scheme", value: "TFHE (Torus FHE)" },
    { label: "Network", value: "Fhenix Testnet" },
    { label: "Blocklist Method", value: "Encrypted domain hash" },
    { label: "Key Management", value: "Client-side only" },
    { label: "Matching Algorithm", value: "Encrypted interval intersection" },
    { label: "Consent Protocol", value: "Dual-signature reveal" },
    { label: "Escrow Method", value: "FHE smart contract" },
    { label: "Data Retention", value: "Zero plaintext stored" },
  ];

  return (
    <section ref={ref} className="py-24 px-6 md:px-12 lg:px-20 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="space-y-8">
            <div>
              <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest mb-4">§ 05 — Technical</div>
              <h2 className="font-display text-[clamp(2.5rem,4vw,4rem)] leading-tight text-foreground">
                The stack<br />
                <span className="text-primary">behind the cipher.</span>
              </h2>
            </div>
            <p className="font-body text-muted-foreground leading-relaxed">
              Built on Fhenix's fully homomorphic EVM — the only blockchain that can execute arbitrary computations on encrypted data. The employer blocklist is a cryptographic proof, not a privacy setting.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/app/whitepaper" className="group font-mono-cipher text-xs border border-border px-5 py-2.5 text-muted-foreground hover:border-primary hover:text-foreground transition-all duration-150 flex items-center gap-2">
                Read Whitepaper <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/app/protocol" className="group font-mono-cipher text-xs border border-border px-5 py-2.5 text-muted-foreground hover:border-primary hover:text-foreground transition-all duration-150 flex items-center gap-2">
                Protocol Docs <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.2 }} className="border border-border">
            {specs.map((spec, i) => (
              <motion.div key={spec.label} initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.4, delay: 0.3 + i * 0.06 }} className={`flex items-center justify-between px-5 py-3.5 group hover:bg-card transition-colors duration-150 ${i < specs.length - 1 ? "border-b border-border" : ""}`}>
                <span className="font-mono-cipher text-xs text-muted-foreground"><ScrambleText text={spec.label} speed={25} /></span>
                <span className="font-mono-cipher text-xs text-foreground group-hover:text-primary transition-colors duration-150"><ScrambleText text={spec.value} speed={25} /></span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────
function CTASection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32 px-6 md:px-12 lg:px-20 border-t border-border relative overflow-hidden">
      <FloatingOrb x="20%" y="30%" size={500} delay={0} />
      <FloatingOrb x="60%" y="50%" size={400} delay={3} />
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="space-y-10">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">§ 06 — Start Your Stealth Search</div>
          <h2 className="font-display text-[clamp(3rem,7vw,7rem)] leading-[0.92] text-foreground">
            Your manager<br />
            <span className="text-primary">will never know.</span>
          </h2>
          <p className="font-body text-muted-foreground max-w-xl mx-auto leading-relaxed text-base md:text-lg">
            Join 4,291 professionals who are actively searching — invisibly. Encrypt your profile once. Match forever. Reveal nothing until you choose to.
          </p>
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
              Fhenix Testnet Live
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
            {[{ label: "Whitepaper", to: "/app/whitepaper" }, { label: "Protocol Docs", to: "/app/protocol" }, { label: "Proof Explorer", to: "/app/proofs" }].map((link) => (
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
          </div>
        </div>
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="font-mono-cipher text-xs text-muted-foreground">Fhenix Privacy-by-Design Buildathon — Wave 2 — {new Date().getFullYear()}</div>
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
        <HowItWorksSection />
        <MoaiTransmission />
        <FeaturesSection />
        <ComparisonSection />
        <DemoSection />
        <TechnicalSection />
        <CTASection />
        <Footer />
      </motion.div>
    </>
  );
}