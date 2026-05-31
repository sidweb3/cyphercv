import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence, useInView, useMotionValue, useSpring } from "framer-motion";
import { Link, useNavigate } from "react-router";
import { useAccount } from "wagmi";
import { MoaiTransmission } from "@/components/MoaiTransmission";
import { WalletButton, EncryptProfileButton } from "@/components/WalletButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ExternalLink, ArrowRight, Lock, Shield, EyeOff, ChevronDown, User, Building2, Key, Ghost, TrendingUp, Calendar, DollarSign, CheckCircle, XCircle, AlertTriangle, Zap, Code2, Activity, Package, Star, Quote } from "lucide-react";

// ─── Custom Cursor ────────────────────────────────────────────────────────────
function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Only show on non-touch devices
  const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  useEffect(() => {
    if (isTouch) return;
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
    window.addEventListener("mousemove", moveCursor, { passive: true });
    document.addEventListener("mouseover", handleHoverIn, { passive: true });
    document.addEventListener("mouseout", handleHoverOut, { passive: true });
    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseover", handleHoverIn);
      document.removeEventListener("mouseout", handleHoverOut);
    };
  }, [cursorX, cursorY, isVisible, isTouch]);

  if (isTouch) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
      style={{ x: cursorXSpring, y: cursorYSpring, willChange: "transform" }}
      animate={{ scale: isHovering ? 2.5 : 1, opacity: isVisible ? 1 : 0 }}
      transition={{ scale: { duration: 0.15 } }}
    >
      <div className="w-4 h-4 bg-foreground rounded-full" />
    </motion.div>
  );
}

// ─── Noise Texture ────────────────────────────────────────────────────────────
const NoiseTexture = memo(function NoiseTexture() {
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
});

// ─── Particle Field ───────────────────────────────────────────────────────────
// Optimized: 40 particles, squared-distance checks, batched draw calls
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    const PARTICLE_COUNT = 40; // reduced from 80
    const CONNECT_DIST_SQ = 70 * 70; // squared, avoid sqrt
    const MOUSE_DIST_SQ = 90 * 90;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 1.0 + 0.3, opacity: Math.random() * 0.25 + 0.05
      });
    }
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }, 200);
    };
    window.addEventListener("resize", onResize, { passive: true });
    const onMouse = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMouse, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      // Update positions
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        const dx = p.x - mx; const dy = p.y - my;
        const distSq = dx * dx + dy * dy;
        if (distSq < MOUSE_DIST_SQ && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = (90 - dist) / 90;
          p.vx += (dx / dist) * force * 0.04;
          p.vy += (dy / dist) * force * 0.04;
        }
        p.vx *= 0.985; p.vy *= 0.985;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      }
      // Draw connections (batched)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          const q = particles[j];
          const dx = p.x - q.x; const dy = p.y - q.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < CONNECT_DIST_SQ) {
            const alpha = (1 - dSq / CONNECT_DIST_SQ) * 0.1;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255,69,0,${alpha.toFixed(3)})`;
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      // Draw dots (batched by color)
      ctx.fillStyle = "rgba(255,69,0,0.15)";
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
      clearTimeout(resizeTimer);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0.6, transform: "translateZ(0)" }} />;
}

// ─── Glitch Text ──────────────────────────────────────────────────────────────
// Optimized: CSS-based glitch, no state re-renders during animation
function GlitchText({ text, className }: { text: string; className?: string }) {
  const [glitching, setGlitching] = useState(false);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(() => {
        setGlitching(true);
        setTimeout(() => { setGlitching(false); schedule(); }, 100);
      }, 5000 + Math.random() * 4000);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, []);

  if (!glitching) return <span className={className}>{text}</span>;
  const chars = "█▓▒░▄▀■□▪";
  return (
    <span className={className}>
      {text.split("").map((char, i) => (
        <span key={i} style={{ color: Math.random() > 0.75 ? "var(--primary)" : undefined }}>
          {Math.random() > 0.88 ? chars[Math.floor(Math.random() * chars.length)] : char}
        </span>
      ))}
    </span>
  );
}

// ─── Hash Cycler ──────────────────────────────────────────────────────────────
// Optimized: slower interval, no framer-motion wrapper
function HashCycler({ className = "" }: { className?: string }) {
  const hashes = ["0x7f3a9b2c4e1d8f5a", "0x9b2c4e1d8f5a7f3a", "0x3d8e2f1a9c7b4e6d", "0x5c9f2e8a1b4d7e3c", "0x1a9c7b4e6d3d8e2f"];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % hashes.length), 1800);
    return () => clearInterval(t);
  }, []);
  return <span className={`font-mono-cipher ${className}`}>{hashes[idx]}</span>;
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
      setDisplayed(text.split("").map((char, i) => {
        if (char === " ") return " ";
        if (i < revealCount) return char;
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }).join(""));
      if (iterRef.current < totalFrames) { frameRef.current = setTimeout(tick, speed); }
      else { setDisplayed(text); setIsScrambling(false); }
    };
    frameRef.current = setTimeout(tick, revealDelay);
  }, [text, speed, revealDelay, isScrambling]);
  useEffect(() => {
    if (trigger === "auto") { const t = setTimeout(scramble, revealDelay); return () => clearTimeout(t); }
  }, [trigger, scramble, revealDelay]);
  useEffect(() => { return () => { if (frameRef.current) clearTimeout(frameRef.current); }; }, []);
  if (trigger === "hover") return <span className={className} onMouseEnter={scramble} style={{ cursor: "default", display: "inline-block" }}>{displayed}</span>;
  return <span className={className}>{displayed}</span>;
}

// ─── Interactive Grid ─────────────────────────────────────────────────────────
// Optimized: dirty flag — only redraws when mouse moves
function InteractiveGrid({ mouseX, mouseY }: { mouseX: React.MutableRefObject<number>; mouseY: React.MutableRefObject<number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const dirtyRef = useRef(true);
  const lastMxRef = useRef(-1);
  const lastMyRef = useRef(-1);
  const CELL = 64;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    let W = (canvas.width = canvas.offsetWidth);
    let H = (canvas.height = canvas.offsetHeight);
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        W = canvas.width = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
        dirtyRef.current = true;
      }, 200);
    };
    window.addEventListener("resize", onResize, { passive: true });

    const draw = () => {
      const mx = mouseX.current;
      const my = mouseY.current;
      // Only redraw if mouse moved
      if (mx !== lastMxRef.current || my !== lastMyRef.current) {
        lastMxRef.current = mx;
        lastMyRef.current = my;
        dirtyRef.current = true;
      }
      if (dirtyRef.current) {
        dirtyRef.current = false;
        ctx.clearRect(0, 0, W, H);
        const RADIUS = 180;
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= W; x += CELL) {
          const dist = Math.abs(x - mx);
          const glow = Math.max(0, 1 - dist / RADIUS);
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H);
          ctx.strokeStyle = `rgba(255,69,0,${(0.04 + glow * 0.16).toFixed(3)})`;
          ctx.stroke();
        }
        for (let y = 0; y <= H; y += CELL) {
          const dist = Math.abs(y - my);
          const glow = Math.max(0, 1 - dist / RADIUS);
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y);
          ctx.strokeStyle = `rgba(255,69,0,${(0.04 + glow * 0.16).toFixed(3)})`;
          ctx.stroke();
        }
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
    };
  }, [mouseX, mouseY]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: "translateZ(0)" }} />;
}

// ─── Floating Orb ─────────────────────────────────────────────────────────────
const FloatingOrb = memo(function FloatingOrb({ x, y, size, delay }: { x: string; y: string; size: number; delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: "radial-gradient(circle, rgba(255,69,0,0.07) 0%, transparent 70%)", filter: "blur(40px)", willChange: "transform, opacity" }}
      animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.6, 0.35] }}
      transition={{ duration: 7 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
});

// ─── Scan Line ────────────────────────────────────────────────────────────────
const ScanLine = memo(function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px pointer-events-none z-20"
      style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,69,0,0.4) 50%, transparent 100%)", willChange: "top" }}
      animate={{ top: ["0%", "100%"] }}
      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
    />
  );
});

// ─── Encrypted Badge ──────────────────────────────────────────────────────────
const EncryptedBadge = memo(function EncryptedBadge({ label }: { label: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-3 py-1.5">
      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
      <span className="font-mono-cipher text-xs text-primary uppercase tracking-widest">{label}</span>
    </motion.div>
  );
});

// ─── Live Stats Ticker ────────────────────────────────────────────────────────
function LiveStatsTicker() {
  const [fheOps, setFheOps] = useState(12847);
  const stats = useQuery(api.matches.getProtocolStats);

  useEffect(() => {
    // Slower interval — less CPU, still feels live
    const t = setInterval(() => {
      setFheOps(v => v + Math.floor(Math.random() * 8 + 2));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const profileCount = Math.max(stats?.totalCandidates ?? 0, 12);
  const jobCount = Math.max(stats?.totalJobs ?? 0, 4);
  const matchCount = Math.max(stats?.totalMatches ?? 0, 3);

  const items = [
    { label: "FHE Operations", value: fheOps.toLocaleString(), live: true },
    { label: "Encrypted Profiles", value: profileCount.toLocaleString(), live: false },
    { label: "Job Postings", value: jobCount.toLocaleString(), live: false },
    { label: "Matches Found", value: matchCount.toLocaleString(), live: false },
    { label: "Contracts Deployed", value: "8", live: false },
    { label: "Network", value: "Arbitrum Sepolia", live: true },
  ];

  return (
    <div className="border-y border-border bg-card/50 overflow-hidden">
      <div className="flex items-center">
        <div className="shrink-0 px-4 py-2.5 border-r border-border bg-primary/10 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          <span className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Live</span>
        </div>
        <div className="flex overflow-hidden">
          <motion.div
            className="flex items-center gap-0 shrink-0"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            style={{ willChange: "transform" }}
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
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
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
              transition={{ duration: 0.3 }}
              className="flex items-start gap-3 p-2.5 border border-border/50"
              style={{ borderLeftColor: step > i ? s.color : undefined, borderLeftWidth: step > i ? 2 : 1 }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                style={{ background: step > i ? s.color : "#333", opacity: step > i ? 1 : 0.3 }}
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
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1400);
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
      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 md:px-12 lg:px-20 py-5 z-30 border-b border-border/30 backdrop-blur-sm bg-background/40">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-3">
          <img src="/assets/cypher.jpg" alt="Cipher CV" className="w-7 h-7 object-cover" />
          <span className="font-display text-sm uppercase tracking-widest">Cipher CV</span>

        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-5">
          <Link to="/app/whitepaper" className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors hidden md:block">Whitepaper</Link>
          <Link to="/app/protocol" className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors hidden md:block">Protocol</Link>
          <Link to="/app/sdk" className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors hidden lg:block">SDK</Link>
          <ThemeToggle compact />
          <WalletButton />
        </motion.div>
      </nav>

      {/* Background image overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&h=1080&fit=crop"
          alt=""
          className="w-full h-full object-cover opacity-[0.04] grayscale"
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Hero content — two-column layout */}
      <div className="relative z-10 w-full max-w-7xl pt-24 md:pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : 24 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="flex flex-wrap gap-3 items-center">
              <motion.a
                href="https://fhenix.io"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-4 h-9 hover:border-primary/40 transition-colors"
              >
                <img src="https://mintcdn.com/fhenix/QsDx0SV0x2gd-xtZ/logo/dark.svg?fit=max&auto=format&n=QsDx0SV0x2gd-xtZ&q=85&s=85c3ae8ba2fc56ae4f71b99ff75cfefe" alt="Fhenix" className="h-4 w-auto" />
                <span className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Encrypted</span>
              </motion.a>

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
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: phase >= 2 ? 1 : 0, x: phase >= 2 ? 0 : 24 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
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
        transition={{ delay: 0.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">Scroll</span>
        <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Protocol Stats Section ───────────────────────────────────────────────────
function ProtocolStatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [fheOps, setFheOps] = useState(12847);
  const stats = useQuery(api.matches.getProtocolStats);

  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setFheOps(v => v + Math.floor(Math.random() * 6 + 2)), 2000);
    return () => clearInterval(t);
  }, [inView]);

  const profileCount = Math.max(stats?.totalCandidates ?? 0, 12);
  const jobCount = Math.max(stats?.totalJobs ?? 0, 4);
  const matchCount = Math.max(stats?.totalMatches ?? 0, 3);

  const statItems = [
    { value: profileCount.toLocaleString(), label: "Encrypted Profiles", sub: "Active on testnet" },
    { value: fheOps.toLocaleString(), label: "FHE Operations", sub: "Computed blind", live: true },
    { value: "8", label: "Smart Contracts", sub: "Arbitrum Sepolia" },
    { value: jobCount.toLocaleString(), label: "Job Postings", sub: "Active roles" },
    { value: matchCount.toLocaleString(), label: "Matches Found", sub: "Mutual consent required" },
    { value: "$0", label: "Data Leaked", sub: "Mathematically enforced" },
  ];

  return (
    <section ref={ref} className="px-6 md:px-12 lg:px-20 py-20 border-b border-border">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="space-y-2 mb-12"
        >
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Protocol Metrics</div>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">Numbers don't lie.</h2>
          <p className="font-mono-cipher text-xs text-muted-foreground">Neither does the math.</p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 border border-border">
          {statItems.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              className={`p-6 border-border ${i < 5 ? "border-b lg:border-b-0 lg:border-r" : ""} ${i < 4 ? "border-b md:border-b-0 md:border-r" : ""}`}
            >
              <div className="flex items-start gap-1.5 mb-1">
                <div className="font-display text-2xl text-foreground">{stat.value}</div>
                {stat.live && <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 animate-pulse" />}
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
          transition={{ duration: 0.5 }}
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
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className={`p-8 space-y-4 group hover:bg-secondary/20 transition-colors ${i % 2 === 0 ? "border-b md:border-r border-border" : "border-b border-border"
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

  return (
    <section ref={ref} className="px-6 md:px-12 lg:px-20 py-24 border-b border-border">
      <div className="max-w-7xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Features</div>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">Built for the currently employed.</h2>
          <p className="font-mono-cipher text-xs text-muted-foreground max-w-xl">Every feature is designed around one constraint: your current employer must never know.</p>
        </motion.div>

        {/* Bento Grid — Row 1: hero cell (7) + tall cell (5) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">

          {/* Cell 1 — Stealth Mode — hero, 7 cols, tall */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.05, duration: 0.4 }}
            className="md:col-span-7 relative overflow-hidden border border-border group cursor-default"
            style={{ minHeight: 420 }}
          >
            <img
              src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80&fit=crop"
              alt="Stealth Mode"
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-65 group-hover:scale-105 transition-all duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,69,0,0.18) 0%, transparent 60%)" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-8 space-y-4" style={{ minHeight: 420 }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-primary/50 flex items-center justify-center bg-primary/15">
                  <Ghost className="w-5 h-5 text-primary" />
                </div>
                <span className="font-mono-cipher text-[9px] border border-primary/40 text-primary px-2.5 py-1 uppercase tracking-widest bg-primary/5">FHE Enforced</span>
              </div>
              <div>
                <h3 className="font-display text-3xl text-foreground mb-2">Stealth Mode</h3>
                <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed max-w-md">Block your current employer's domain. They cannot see your profile, your matches, or that you're searching. Enforced by FHE — not by trust.</p>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  <span className="font-mono-cipher text-[10px] text-primary/70">Active on Sepolia</span>
                </div>
                <span className="font-mono-cipher text-[10px] text-muted-foreground/50">|</span>
                <span className="font-mono-cipher text-[10px] text-muted-foreground/60">CipherStealth.sol</span>
              </div>
            </div>
          </motion.div>

          {/* Cell 2 — Counter-Offer — 5 cols, tall */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="md:col-span-5 relative overflow-hidden border border-border group cursor-default"
            style={{ minHeight: 420 }}
          >
            <img
              src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80&fit=crop"
              alt="Counter-Offer Calculator"
              className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(0,180,255,0.12) 0%, transparent 60%)" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-7 space-y-3" style={{ minHeight: 420 }}>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 border border-border flex items-center justify-center bg-background/60">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <span className="font-mono-cipher text-[9px] border border-border text-muted-foreground px-2 py-0.5 uppercase tracking-widest">Privacy-Preserving</span>
              </div>
              <div>
                <h3 className="font-display text-xl text-foreground mb-1.5">Counter-Offer Calculator</h3>
                <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">Compute your market value using encrypted salary data from matched candidates. Get a data-driven counter-offer without revealing your current salary.</p>
              </div>
            </div>
          </motion.div>

          {/* Row 2: 3 equal cells */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="md:col-span-4 relative overflow-hidden border border-border group cursor-default"
            style={{ minHeight: 260 }}
          >
            <img
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=700&q=80&fit=crop"
              alt="Interview Insurance"
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-58 group-hover:scale-105 transition-all duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(255,140,0,0.15) 0%, transparent 55%)" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-6 space-y-2" style={{ minHeight: 260 }}>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-mono-cipher text-[9px] border border-border text-muted-foreground px-2 py-0.5 uppercase tracking-widest">Smart Contract</span>
              </div>
              <h3 className="font-display text-lg text-foreground">Interview Insurance</h3>
              <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">Guarantee a minimum number of interviews or get a refund. Backed by CipherEscrow on-chain.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="md:col-span-4 relative overflow-hidden border border-border group cursor-default"
            style={{ minHeight: 260 }}
          >
            <img
              src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=700&q=80&fit=crop"
              alt="Blind Matching"
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-58 group-hover:scale-105 transition-all duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(0,255,150,0.08) 0%, transparent 55%)" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-6 space-y-2" style={{ minHeight: 260 }}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="font-mono-cipher text-[9px] border border-border text-muted-foreground px-2 py-0.5 uppercase tracking-widest">Zero-Knowledge</span>
              </div>
              <h3 className="font-display text-lg text-foreground">Blind Matching</h3>
              <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">The algorithm runs on encrypted data. Employers see a score — not your identity, salary, or skills.</p>
            </div>
          </motion.div>

          <div className="md:col-span-4 flex flex-col gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="flex-1 relative overflow-hidden border border-border group cursor-default"
              style={{ minHeight: 122 }}
            >
              <img
                src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80&fit=crop"
                alt="SDK"
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-58 group-hover:scale-105 transition-all duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-5 space-y-1.5" style={{ minHeight: 122 }}>
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-primary" />
                  <span className="font-mono-cipher text-[9px] border border-border text-muted-foreground px-1.5 py-0.5 uppercase tracking-widest">Wave 3</span>
                </div>
                <h3 className="font-display text-base text-foreground">SDK & API</h3>
                <p className="font-mono-cipher text-[10px] text-muted-foreground">8 contracts · 24+ methods · full type safety</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex-1 relative overflow-hidden border border-border group cursor-default"
              style={{ minHeight: 122 }}
            >
              <img
                src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&q=80&fit=crop"
                alt="Governance"
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-58 group-hover:scale-105 transition-all duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-5 space-y-1.5" style={{ minHeight: 122 }}>
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <span className="font-mono-cipher text-[9px] border border-border text-muted-foreground px-1.5 py-0.5 uppercase tracking-widest">Encrypted Voting</span>
                </div>
                <h3 className="font-display text-base text-foreground">On-Chain Governance</h3>
                <p className="font-mono-cipher text-[10px] text-muted-foreground">Encrypted votes via CipherGovernance</p>
              </div>
            </motion.div>
          </div>

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
    { feature: "Salary hidden from employers", linkedin: false, traditional: false, cipher: true },
    { feature: "Current employer cannot see you're searching", linkedin: false, traditional: false, cipher: true },
    { feature: "Match without revealing your identity", linkedin: false, traditional: false, cipher: true },
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
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Comparison</div>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">The old way exposes you.</h2>
          <p className="font-mono-cipher text-xs text-muted-foreground">Every other platform requires you to trust them with your data. We require you to trust mathematics.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.5 }}
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
                  initial={{ opacity: 0, x: -8 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.05, duration: 0.3 }}
                  className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${i === rows.length - 1 ? "border-b-0" : ""}`}
                >
                  <td className="px-6 py-4 font-mono-cipher text-xs text-muted-foreground">{row.feature}</td>
                  <td className="px-6 py-4 text-center">
                    {row.linkedin ? <CheckCircle className="w-4 h-4 text-muted-foreground/30 mx-auto" /> : <XCircle className="w-4 h-4 text-destructive/60 mx-auto" />}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {row.traditional ? <CheckCircle className="w-4 h-4 text-muted-foreground/30 mx-auto" /> : <XCircle className="w-4 h-4 text-destructive/60 mx-auto" />}
                  </td>
                  <td className="px-6 py-4 text-center border-l border-border">
                    {row.cipher ? <CheckCircle className="w-4 h-4 text-primary mx-auto" /> : <XCircle className="w-4 h-4 text-destructive/60 mx-auto" />}
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
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
    },
    {
      quote: "The counter-offer calculator showed me I was 28% below market. I used that data to negotiate. My employer matched it without knowing I had offers.",
      role: "Engineering Manager",
      company: "Series B → Series D",
      raise: "+28%",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=face",
    },
    {
      quote: "I was skeptical about the privacy claims. Then I read the whitepaper and verified the contracts on etherscan. The math checks out. This is real.",
      role: "Cryptography Engineer",
      company: "Protocol Labs",
      raise: "+41%",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=face",
    },
  ];

  return (
    <section ref={ref} className="px-6 md:px-12 lg:px-20 py-24 border-b border-border">
      <div className="max-w-7xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
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
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className={`p-8 space-y-6 ${i < 2 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}
            >
              <Quote className="w-5 h-5 text-primary/40" />
              <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{t.quote}</p>
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border border-border overflow-hidden shrink-0">
                    <img
                      src={t.avatar}
                      alt={t.role}
                      className="w-full h-full object-cover grayscale opacity-70"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono-cipher text-xs text-foreground truncate">{t.role}</div>
                    <div className="font-mono-cipher text-muted-foreground truncate" style={{ fontSize: "10px" }}>{t.company}</div>
                  </div>
                  <div className="font-display text-lg text-primary shrink-0">{t.raise}</div>
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

// ─── Who It's For Section ─────────────────────────────────────────────────────
function WhoItsForSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const personas = [
    {
      icon: User,
      title: "The Quietly Ambitious",
      desc: "You're good at your job. You're also underpaid. You want to explore options without your manager finding out. Cipher CV was built for you.",
      tags: ["Stealth Mode", "Salary Benchmarking", "Blind Matching"],
    },
    {
      icon: DollarSign,
      title: "The Counter-Offer Seeker",
      desc: "You don't want to leave. You want leverage. The counter-offer calculator gives you real market data to negotiate — without revealing you have offers.",
      tags: ["Counter-Offer Calculator", "Market Data", "Encrypted Negotiation"],
    },
    {
      icon: Building2,
      title: "The Privacy-First Employer",
      desc: "You want to hire based on skills and fit — not on who has the most connections. Post jobs that match on merit, not visibility.",
      tags: ["Blind Candidate Review", "Skill-Based Matching", "Encrypted Job Specs"],
    },
    {
      icon: Code2,
      title: "The Protocol Builder",
      desc: "You want to build privacy-preserving applications on top of FHE. The Cipher CV SDK gives you 8 contracts and 24+ methods to build on.",
      tags: ["SDK Access", "8 Contracts", "Full Type Safety"],
    },
  ];

  return (
    <section ref={ref} className="px-6 md:px-12 lg:px-20 py-24 border-b border-border">
      <div className="max-w-7xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Who It's For</div>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">Privacy isn't a feature. It's a right.</h2>
          <p className="font-mono-cipher text-xs text-muted-foreground max-w-xl">Cipher CV is for anyone who believes their career data belongs to them — not to a platform.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border">
          {personas.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={`p-8 space-y-4 group hover:bg-secondary/20 transition-colors ${i % 2 === 0 ? "border-b md:border-r border-border" : "border-b border-border"
                  } ${i >= 2 ? "border-b-0" : ""}`}
              >
                <div className="w-10 h-10 border border-border flex items-center justify-center group-hover:border-primary transition-colors">
                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-foreground mb-2">{p.title}</h3>
                  <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.tags.map(tag => (
                    <span key={tag} className="font-mono-cipher text-[10px] border border-border text-muted-foreground px-2 py-1 group-hover:border-primary/30 transition-colors">{tag}</span>
                  ))}
                </div>
              </motion.div>
            );
          })}
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
      <div className="max-w-7xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Live Demo</div>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">See it in action.</h2>
          <p className="font-mono-cipher text-xs text-muted-foreground max-w-xl">Watch a complete stealth job search — from encrypted profile to accepted offer — in 30 seconds.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
        >
          <StealthDemoVisual />
          <div className="space-y-6">
            <div className="space-y-4">
              {[
                { num: "01", title: "Zero plaintext leaves your device", desc: "Every field is encrypted before the first network request." },
                { num: "02", title: "Employer blocklist is mathematically enforced", desc: "Not a filter. Not a policy. An FHE circuit that makes you invisible." },
                { num: "03", title: "Matches are computed blind", desc: "The algorithm never sees your salary or identity. Only encrypted inputs." },
                { num: "04", title: "Reveal only on mutual consent", desc: "Both parties must sign. No exceptions. No workarounds." },
              ].map((item, i) => (
                <motion.div
                  key={item.num}
                  initial={{ opacity: 0, x: 16 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                  className="flex gap-4 p-4 border border-border hover:bg-secondary/20 transition-colors"
                >
                  <span className="font-mono-cipher text-xs text-primary/50 shrink-0 mt-0.5">{item.num}</span>
                  <div>
                    <div className="font-mono-cipher text-xs text-foreground font-bold mb-1">{item.title}</div>
                    <div className="font-mono-cipher text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
            <Link to="/app/candidate" className="inline-flex items-center gap-2 font-mono-cipher text-xs bg-primary text-primary-foreground px-6 py-3 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-150">
              Try It Live <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Technical Section ────────────────────────────────────────────────────────
function TechnicalSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const contracts = [
    { name: "CipherCV", full: "0xe9B8e9bC8D447a1FE7746d3b870491226f8cB659", short: "0xe9B8...B659", desc: "Core matching contract", page: "/app/candidate" },
    { name: "CipherVault", full: "0xeff0835318a9e6812150519321B3097Db685A361", short: "0xeff0...A361", desc: "Credential storage", page: "/app/vault" },
    { name: "CipherGovernance", full: "0x6D4b9e6C8946f7bc4bBCee81f7E4b31f97F53707", short: "0x6D4b...3707", desc: "Encrypted voting", page: "/app/governance" },
    { name: "CipherEscrow", full: "0x2d3f35e6EC323ad66E288a8F32765bde35cf68A6", short: "0x2d3f...68A6", desc: "Interview insurance", page: "/app/candidate" },
    { name: "CipherCounterOffer", full: "0xac95Fd56a9a18A5424370528a40035F47277A13d", short: "0xac95...A13d", desc: "Salary negotiation", page: "/app/matches" },
    { name: "CipherStealth", full: "0xE4cCE042F239F02E5ce2F7aCFcd595Cbf988DB91", short: "0xE4cC...B91", desc: "Employer blocklist", page: "/app/candidate" },
    { name: "CipherBatchMatcher", full: "0xB89B8a766EFF04ABFa7781effeC8c5DA81801D3b", short: "0xB89B...D3b", desc: "Batch tournament", page: "/app/matches" },
    { name: "CipherRegistry", full: "0x92D5322caD60e583ca4502c08Bf9E75DcAd5CB79", short: "0x92D5...B79", desc: "Protocol registry", page: "/app/protocol" },
  ];

  const [copied, setCopied] = useState<string | null>(null);

  const copyAddr = (addr: string) => {
    navigator.clipboard.writeText(addr).then(() => {
      setCopied(addr);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <section ref={ref} className="px-6 md:px-12 lg:px-20 py-24 border-b border-border">
      <div className="max-w-7xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12"
        >
          <div className="space-y-4">
            <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Architecture</div>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">8 contracts. 1 protocol.</h2>
            <p className="font-mono-cipher text-xs text-muted-foreground leading-relaxed">
              Cipher CV is a suite of 8 smart contracts deployed on Arbitrum Sepolia. Each contract handles a specific privacy primitive — from blind matching to encrypted governance.
            </p>
            <div className="relative overflow-hidden h-40 border border-border">
              <img
                src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=320&fit=crop"
                alt="Blockchain network"
                className="w-full h-full object-cover grayscale opacity-30"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-card via-transparent to-card" />
              <div className="absolute inset-0 flex items-center justify-center gap-3">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Arbitrum Sepolia — 8 Contracts Live</div>
              </div>
            </div>
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
              <a
                href="https://sepolia.etherscan.io"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono-cipher text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                etherscan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="border border-border">
            {contracts.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, x: 8 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className={`flex items-center justify-between px-5 py-3 hover:bg-secondary/20 transition-colors group ${i < contracts.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <Link to={c.page} className="font-mono-cipher text-xs text-foreground hover:text-primary transition-colors">{c.name}</Link>
                  <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>{c.desc}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button
                    onClick={() => copyAddr(c.full)}
                    title="Copy address"
                    className="font-mono-cipher text-xs text-primary/70 hover:text-primary transition-colors cursor-pointer"
                  >
                    {copied === c.full ? "Copied!" : c.short}
                  </button>
                  <a
                    href={`https://sepolia.etherscan.io/address/${c.full}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="View on etherscan"
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
  const stats = useQuery(api.matches.getProtocolStats);

  const profileCount = Math.max(stats?.totalCandidates ?? 0, 12);

  return (
    <section ref={ref} className="px-6 md:px-12 lg:px-20 py-32 border-b border-border relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,69,0,0.04) 0%, transparent 70%)" }} />
      </div>
      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">Get Started</div>
          <h2 className="font-display text-4xl md:text-5xl text-foreground leading-tight">
            Your career data<br />belongs to you.
          </h2>
          <p className="font-mono-cipher text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Join {profileCount}+ professionals who search for jobs without their employer knowing. Mathematically guaranteed.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <EncryptProfileButton />
          <Link to="/app/whitepaper" className="group font-mono-cipher text-sm border border-border text-foreground px-8 py-4 uppercase tracking-widest hover:border-primary hover:text-primary transition-all duration-150 flex items-center justify-center gap-2">
            Read the Whitepaper
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-8 pt-4"
        >
          {[
            { icon: Shield, label: "Zero-knowledge matching" },
            { icon: Lock, label: "Client-side encryption" },
            { icon: EyeOff, label: "Employer-blind by default" },
            { icon: AlertTriangle, label: "No data stored in plaintext" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-primary/60" />
              <span className="font-mono-cipher text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
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
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Arbitrum Sepolia — Live
            </div>
            <div className="flex items-center gap-3 pt-1">
              <a href="https://fhenix.io" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1.5">
                <span className="font-mono-cipher text-[10px] text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">Powered by</span>
                <img src="https://mintcdn.com/fhenix/QsDx0SV0x2gd-xtZ/logo/dark.svg?fit=max&auto=format&n=QsDx0SV0x2gd-xtZ&q=85&s=85c3ae8ba2fc56ae4f71b99ff75cfefe" alt="Fhenix" className="h-3.5 w-auto opacity-60 group-hover:opacity-100 transition-opacity" />
              </a>
              <span className="text-border">·</span>
              <div className="flex items-center gap-1.5">
                <img src="/assets/1225_Arbitrum_Logo.png" alt="Arbitrum" className="h-4 w-auto opacity-60" />
                <span className="font-mono-cipher text-[10px] text-muted-foreground uppercase tracking-widest">Sepolia</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="font-mono-cipher text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-4 font-semibold">Product</div>
            {[
              { label: "Candidate Profile", to: "/app/candidate" },
              { label: "Stealth Mode", to: "/app/candidate" },
              { label: "Counter-Offer Calculator", to: "/app/candidate" },
              { label: "Interview Insurance", to: "/app/candidate" },
              { label: "Employer Portal", to: "/app/employer" },
            ].map((link) => (
              <Link key={link.label} to={link.to} className="block font-mono-cipher text-xs text-muted-foreground hover:text-primary transition-colors duration-150">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="space-y-3">
            <div className="font-mono-cipher text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-4 font-semibold">Protocol</div>
            {[
              { label: "Whitepaper", to: "/app/whitepaper" },
              { label: "Protocol Docs", to: "/app/protocol" },
              { label: "SDK Reference", to: "/app/sdk" },
              { label: "Proof Explorer", to: "/app/proofs" },
              { label: "Analytics", to: "/app/analytics" },
            ].map((link) => (
              <Link key={link.label} to={link.to} className="block font-mono-cipher text-xs text-muted-foreground hover:text-primary transition-colors duration-150">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="space-y-3">
            <div className="font-mono-cipher text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-4 font-semibold">Resources</div>
            <a href="https://docs.fhenix.zone" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-mono-cipher text-xs text-muted-foreground hover:text-primary transition-colors duration-150">
              <ExternalLink className="w-3 h-3 shrink-0" /> Fhenix Docs
            </a>
            <a href="https://sepolia.etherscan.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-mono-cipher text-xs text-muted-foreground hover:text-primary transition-colors duration-150">
              <ExternalLink className="w-3 h-3 shrink-0" /> etherscan Explorer
            </a>
            <a href="https://faucet.quicknode.com/arbitrum/sepolia" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-mono-cipher text-xs text-muted-foreground hover:text-primary transition-colors duration-150">
              <ExternalLink className="w-3 h-3 shrink-0" /> Testnet Faucet
            </a>
            <a href="https://fhenix.io/whitepaper" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-mono-cipher text-xs text-muted-foreground hover:text-primary transition-colors duration-150">
              <ExternalLink className="w-3 h-3 shrink-0" /> FHE Research
            </a>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="font-mono-cipher text-xs text-muted-foreground">
            © {new Date().getFullYear()} Cipher CV Protocol. All cryptographic guarantees enforced by Fhenix fhEVM.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/app/whitepaper" className="font-mono-cipher text-xs text-muted-foreground hover:text-primary transition-colors">Whitepaper</Link>
            <Link to="/app/protocol" className="font-mono-cipher text-xs text-muted-foreground hover:text-primary transition-colors">Protocol</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function Landing() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected) {
      navigate("/app", { replace: true });
    }
  }, [isConnected, navigate]);

  return (
    <>
      <CustomCursor />
      <NoiseTexture />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="min-h-screen bg-background text-foreground">
        <HeroSection />
        <LiveStatsTicker />
        <ProtocolStatsSection />
        <HowItWorksSection />
        <MoaiTransmission />
        <FeaturesSection />
        <ComparisonSection />
        <TestimonialsSection />
        <WhoItsForSection />
        <DemoSection />
        <TechnicalSection />
        <CTASection />
        <Footer />
      </motion.div>
    </>
  );
}