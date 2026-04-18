import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 0 | 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { num: "01", label: "INTENT", sub: "Raw preference captured" },
  { num: "02", label: "ENCRYPT", sub: "Mathematical sealing" },
  { num: "03", label: "TRANSIT", sub: "Secure transmission" },
  { num: "04", label: "VALIDATE", sub: "Blind computation" },
  { num: "05", label: "RESOLVE", sub: "Privacy-preserving match" },
];

const PHASE_TIMES = [0, 2, 4, 6, 9, 11];
const TOTAL_DURATION = 13;

// ─── Easing functions ─────────────────────────────────────────────────────────
const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeInExpo = (t: number) => t === 0 ? 0 : Math.pow(2, 10 * t - 10);
const easeOutElastic = (t: number) => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

// ─── Color utilities ──────────────────────────────────────────────────────────
function parseColor(color: string): [number, number, number] {
  // Handle hex: #rrggbb
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
  }
  // Handle rgb(r,g,b)
  const m = color.match(/rgb\((\d+),(\d+),(\d+)\)/);
  if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
  return [0, 0, 0];
}
// Keep hexToRgb as alias for backward compat
const hexToRgb = parseColor;

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseColor(a);
  const [br, bg, bb] = parseColor(b);
  return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`;
}

// ─── Canvas Engine ────────────────────────────────────────────────────────────
function TransmissionCanvas({
  containerWidth,
  containerHeight,
  onPhaseChange,
  paused,
  animKey,
}: {
  containerWidth: number;
  containerHeight: number;
  onPhaseChange: (p: Phase) => void;
  paused: boolean;
  animKey: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastPhaseRef = useRef<Phase>(0);
  const pausedRef = useRef(paused);
  const pausedTimeRef = useRef(0);
  const pausedElapsedRef = useRef(0);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth === 0) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const W = containerWidth;
    const H = containerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.scale(DPR, DPR);

    const isMobile = W < 640;
    const MOAI_W = isMobile ? 150 : 240;
    const GAP_START = MOAI_W;
    const GAP_END = W - MOAI_W;
    const GAP_W = GAP_END - GAP_START;
    const CX = W / 2;
    const CY = H * 0.44;

    // ── Particle pools ──────────────────────────────────────────────────────
    type Particle = {
      x: number; y: number; vx: number; vy: number;
      life: number; decay: number; color: string;
      size: number; type: "spark" | "dust" | "data";
      char?: string;
    };
    const particles: Particle[] = [];
    const DATA_CHARS = "0123456789ABCDEF█▓▒░";

    const burst = (x: number, y: number, count: number, color: string, speed = 4, type: Particle["type"] = "spark") => {
      for (let i = 0; i < Math.min(count, 20); i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const spd = speed * (0.5 + Math.random() * 0.8);
        particles.push({
          x, y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - (type === "spark" ? 1.5 : 0.5),
          life: 1,
          decay: 0.012 + Math.random() * 0.018,
          color,
          size: type === "data" ? 1.5 : (1 + Math.random() * 2.5),
          type,
          char: type === "data" ? DATA_CHARS[Math.floor(Math.random() * DATA_CHARS.length)] : undefined,
        });
      }
    };

    // ── Ambient data stream ─────────────────────────────────────────────────
    type StreamNode = { x: number; y: number; vy: number; life: number; char: string; opacity: number };
    const streamNodes: StreamNode[] = [];
    let streamTimer = 0;

    // ── Shockwaves ──────────────────────────────────────────────────────────
    type Shockwave = { x: number; y: number; r: number; maxR: number; life: number; color: string; width: number };
    const shockwaves: Shockwave[] = [];

    const addShockwave = (x: number, y: number, maxR: number, color: string, width = 2) => {
      shockwaves.push({ x, y, r: 0, maxR, life: 1, color, width });
    };

    // ── Hex ring state ──────────────────────────────────────────────────────
    let hexRingOpacity = 0;
    let hexRingScale = 1;

    // ── Right moai flash ────────────────────────────────────────────────────
    let rightFlash = 0;
    let leftConfirm = 0;

    // ── Singularity swirl chars ─────────────────────────────────────────────
    const swirlChars: { angle: number; r: number; char: string; opacity: number; speed: number }[] = [];
    for (let i = 0; i < 12; i++) {
      swirlChars.push({
        angle: (i / 12) * Math.PI * 2,
        r: 28 + Math.random() * 16,
        char: DATA_CHARS[Math.floor(Math.random() * DATA_CHARS.length)],
        opacity: 0,
        speed: 0.8 + Math.random() * 0.6,
      });
    }

    // ── Connection beam ─────────────────────────────────────────────────────
    let beamOpacity = 0;

    // ── Phase transition handler ─────────────────────────────────────────────
    const onTransition = (phase: Phase) => {
      if (phase === 1) {
        hexRingOpacity = 1;
        hexRingScale = 1;
      }
      if (phase === 2) {
        addShockwave(CX, CY, W * 0.6, "#ff4d00", 2.5);
        addShockwave(CX, CY, W * 0.35, "#ff8800", 1.5);
        burst(CX, CY, 18, "#ff4d00", 5, "spark");
        burst(CX, CY, 10, "#ff8800", 3, "data");
        swirlChars.forEach(s => { s.opacity = 1; });
      }
      if (phase === 3) {
        beamOpacity = 1;
        swirlChars.forEach(s => { s.opacity = 0; });
      }
      if (phase === 4) {
        addShockwave(GAP_END + 20, CY, 120, "#00d4ff", 2);
        addShockwave(GAP_END + 20, CY, 70, "#ffffff", 1);
        burst(GAP_END + 10, CY, 16, "#00d4ff", 4, "spark");
        burst(GAP_END + 10, CY, 8, "#00ff88", 2.5, "data");
        rightFlash = 1;
        beamOpacity = 0;
      }
      if (phase === 5) {
        leftConfirm = 1;
      }
    };

    // ── Draw helpers ─────────────────────────────────────────────────────────
    const drawGlow = (x: number, y: number, r: number, color: string, alpha: number) => {
      const [cr, cg, cb] = hexToRgb(color);
      const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`);
      grd.addColorStop(0.4, `rgba(${cr},${cg},${cb},${alpha * 0.4})`);
      grd.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawHexagon = (x: number, y: number, r: number, rotation: number, strokeColor: string, lineW: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const hx = Math.cos(a) * r;
        const hy = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineW;
      ctx.stroke();
      ctx.restore();
    };

    // ── Main draw loop ────────────────────────────────────────────────────────
    const draw = (now: number) => {
      if (pausedRef.current) {
        pausedTimeRef.current = now;
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      // Adjust for pause time
      if (pausedTimeRef.current > 0) {
        startTimeRef.current += now - pausedTimeRef.current;
        pausedTimeRef.current = 0;
      }

      ctx.clearRect(0, 0, W, H);

      const elapsed = (now - startTimeRef.current) / 1000;
      const t = elapsed % TOTAL_DURATION;

      // Phase detection
      let currentPhase: Phase = 0;
      if (t >= PHASE_TIMES[5]) currentPhase = 5;
      else if (t >= PHASE_TIMES[4]) currentPhase = 4;
      else if (t >= PHASE_TIMES[3]) currentPhase = 3;
      else if (t >= PHASE_TIMES[2]) currentPhase = 2;
      else if (t >= PHASE_TIMES[1]) currentPhase = 1;

      if (currentPhase !== lastPhaseRef.current) {
        lastPhaseRef.current = currentPhase;
        onPhaseChange(currentPhase);
        onTransition(currentPhase);
      }

      // ── Background ambient grid ──────────────────────────────────────────
      const gridAlpha = 0.025;
      ctx.strokeStyle = `rgba(255,77,0,${gridAlpha})`;
      ctx.lineWidth = 0.5;
      const GRID = 40;
      for (let gx = 0; gx <= W; gx += GRID) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let gy = 0; gy <= H; gy += GRID) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      // ── Ambient data stream ──────────────────────────────────────────────
      streamTimer += 0.016;
      if (streamTimer > 0.08) {
        streamTimer = 0;
        const sx = GAP_START + Math.random() * GAP_W;
        streamNodes.push({
          x: sx, y: CY - 60 + Math.random() * 120,
          vy: -0.4 - Math.random() * 0.3,
          life: 1,
          char: DATA_CHARS[Math.floor(Math.random() * DATA_CHARS.length)],
          opacity: 0.15 + Math.random() * 0.1,
        });
      }
      for (let i = streamNodes.length - 1; i >= 0; i--) {
        const sn = streamNodes[i];
        sn.y += sn.vy;
        sn.life -= 0.008;
        if (sn.life <= 0) { streamNodes.splice(i, 1); continue; }
        ctx.globalAlpha = sn.life * sn.opacity;
        ctx.fillStyle = "#00d4ff";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.fillText(sn.char, sn.x, sn.y);
        ctx.globalAlpha = 1;
      }

      // ── Moai breathing glow ──────────────────────────────────────────────
      const breathe = 0.08 + 0.18 * (0.5 + 0.5 * Math.sin(t * 0.9));
      const breatheRight = rightFlash > 0 ? Math.min(1, breathe + rightFlash * 0.5) : breathe;
      drawGlow(MOAI_W / 2, H * 0.82, MOAI_W * 0.9, "#ff4d00", breathe);
      drawGlow(W - MOAI_W / 2, H * 0.82, MOAI_W * 0.9, "#ff4d00", breatheRight);
      if (rightFlash > 0) rightFlash *= 0.88;

      // Left confirm glow
      if (leftConfirm > 0) {
        drawGlow(MOAI_W / 2, H * 0.82, MOAI_W * 1.1, "#00ff88", leftConfirm * 0.4);
        leftConfirm *= 0.92;
      }

      // ── Shockwaves ───────────────────────────────────────────────────────
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.r += (sw.maxR - sw.r) * 0.1;
        sw.life *= 0.91;
        if (sw.life < 0.01) { shockwaves.splice(i, 1); continue; }
        const [sr, sg, sb] = hexToRgb(sw.color);
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${sr},${sg},${sb},${sw.life * 0.7})`;
        ctx.lineWidth = sw.width;
        ctx.stroke();
        // Inner glow ring
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.r * 0.85, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${sr},${sg},${sb},${sw.life * 0.2})`;
        ctx.lineWidth = sw.width * 3;
        ctx.stroke();
      }

      // ── Orb state machine ─────────────────────────────────────────────────
      let orbX = GAP_START + 10;
      let orbY = CY;
      let orbR = 18;
      let orbColor = "#ff4d00";
      let orbGlowColor = "#ff4d00";
      let orbAlpha = 1;
      let orbText = "";
      let orbTextColor = "#ffffff";
      let showTrail = false;
      let trailColor = "#00d4ff";
      let showHexShield = false;
      let showSingularity = false;
      let showReturnOrb = false;

      if (t < PHASE_TIMES[1]) {
        // Phase 0: Intent — orb emerges from left moai
        const p = easeInOutCubic(t / PHASE_TIMES[1]);
        orbX = GAP_START + GAP_W * 0.0 + p * GAP_W * 0.28;
        orbR = 18 + Math.sin(t * 5) * 2.5;
        orbText = "$120k · 5yrs · React";
        orbColor = "#ff4d00";
        orbGlowColor = "#ff6600";
        orbAlpha = Math.min(1, t * 2);
      } else if (t < PHASE_TIMES[2]) {
        // Phase 1: Encryption — text fragments, hex shield appears
        const p = easeInOutCubic((t - PHASE_TIMES[1]) / (PHASE_TIMES[2] - PHASE_TIMES[1]));
        orbX = GAP_START + GAP_W * 0.28 + p * GAP_W * 0.22;
        orbR = 18;
        showHexShield = true;
        hexRingOpacity = Math.max(0, hexRingOpacity - 0.005);
        if (p < 0.3) {
          orbText = "$120k · 5yrs · React";
          orbTextColor = "#ffffff";
          orbColor = "#ff4d00";
          orbGlowColor = "#ff4d00";
        } else if (p < 0.6) {
          orbText = "$1██k · ████ · ████";
          orbTextColor = "#ffaa00";
          orbColor = lerpColor("#ff4d00", "#00d4ff", (p - 0.3) / 0.3);
          orbGlowColor = orbColor;
        } else {
          orbText = "0x9f3a2b1c...";
          orbTextColor = "#00d4ff";
          orbColor = "#00d4ff";
          orbGlowColor = "#00d4ff";
        }
      } else if (t < PHASE_TIMES[3]) {
        // Phase 2: Black hole — expand, implode, singularity
        const p = (t - PHASE_TIMES[2]) / (PHASE_TIMES[3] - PHASE_TIMES[2]);
        orbX = CX;
        orbY = CY;
        showSingularity = true;
        if (p < 0.25) {
          const ep = easeOutExpo(p / 0.25);
          orbR = 18 + ep * 62;
          orbColor = lerpColor("#00d4ff", "#ff4d00", ep);
          orbGlowColor = orbColor;
          orbAlpha = 1;
        } else if (p < 0.55) {
          const ep = easeInExpo((p - 0.25) / 0.3);
          orbR = 80 - ep * 76;
          orbColor = "#000000";
          orbGlowColor = "#ffffff";
          orbAlpha = 1;
        } else {
          orbR = 4 + Math.sin(t * 30) * 1.5;
          orbColor = "#000000";
          orbGlowColor = "#00d4ff";
          orbAlpha = 1;
          // Swirl chars
          swirlChars.forEach(s => {
            s.angle += s.speed * 0.04;
            if (s.opacity > 0) {
              const sx = CX + Math.cos(s.angle) * s.r;
              const sy = CY + Math.sin(s.angle) * s.r;
              ctx.globalAlpha = s.opacity * 0.7;
              ctx.fillStyle = "#00d4ff";
              ctx.font = "9px monospace";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(s.char, sx, sy);
              ctx.globalAlpha = 1;
            }
          });
        }
      } else if (t < PHASE_TIMES[4]) {
        // Phase 3: Transmission — fast packet with trail
        const p = easeOutExpo((t - PHASE_TIMES[3]) / (PHASE_TIMES[4] - PHASE_TIMES[3]));
        orbX = CX + p * (GAP_END - CX - 10);
        orbY = CY;
        orbR = 9;
        orbColor = "#00d4ff";
        orbGlowColor = "#00d4ff";
        showTrail = true;
        trailColor = "#00d4ff";
        beamOpacity *= 0.97;

        // Draw connection beam
        if (beamOpacity > 0.01) {
          const bgrd = ctx.createLinearGradient(CX, CY, GAP_END, CY);
          bgrd.addColorStop(0, `rgba(0,212,255,0)`);
          bgrd.addColorStop(0.5, `rgba(0,212,255,${beamOpacity * 0.15})`);
          bgrd.addColorStop(1, `rgba(0,212,255,0)`);
          ctx.fillStyle = bgrd;
          ctx.fillRect(CX, CY - 8, GAP_END - CX, 16);
        }
      } else if (t < PHASE_TIMES[5]) {
        // Phase 4: Reception — packet sinks into right moai
        const p = easeInExpo((t - PHASE_TIMES[4]) / (PHASE_TIMES[5] - PHASE_TIMES[4]));
        orbX = GAP_END + p * 40;
        orbY = CY;
        orbR = 9 * (1 - p * 0.8);
        orbColor = "#00d4ff";
        orbGlowColor = "#00d4ff";
        orbAlpha = 1 - p;
      } else {
        // Phase 5: Return confirmation — green packet
        const p = easeOutElastic(Math.min(1, (t - PHASE_TIMES[5]) / (TOTAL_DURATION - PHASE_TIMES[5] - 0.5)));
        orbX = GAP_END - p * GAP_W * 0.95;
        orbY = CY;
        orbR = 7;
        orbColor = "#00ff88";
        orbGlowColor = "#00ff88";
        showReturnOrb = true;
        showTrail = true;
        trailColor = "#00ff88";
        const fadeP = (t - PHASE_TIMES[5]) / (TOTAL_DURATION - PHASE_TIMES[5]);
        orbAlpha = fadeP > 0.85 ? 1 - (fadeP - 0.85) / 0.15 : 1;
      }

      // ── Draw trail ───────────────────────────────────────────────────────
      if (showTrail) {
        const TRAIL_STEPS = 8;
        const TRAIL_SPACING = showReturnOrb ? 8 : 14;
        const dir = showReturnOrb ? 1 : -1;
        for (let i = 1; i <= TRAIL_STEPS; i++) {
          const tx = orbX + dir * i * TRAIL_SPACING;
          const tf = (TRAIL_STEPS - i) / TRAIL_STEPS;
          const [tr, tg, tb] = hexToRgb(trailColor);
          const tgrd = ctx.createRadialGradient(tx, orbY, 0, tx, orbY, orbR * tf + 3);
          tgrd.addColorStop(0, `rgba(${tr},${tg},${tb},${tf * 0.5 * orbAlpha})`);
          tgrd.addColorStop(1, `rgba(${tr},${tg},${tb},0)`);
          ctx.fillStyle = tgrd;
          ctx.beginPath();
          ctx.arc(tx, orbY, orbR * tf + 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Draw hex shield ──────────────────────────────────────────────────
      if (showHexShield) {
        const shieldAlpha = 0.5 + 0.3 * Math.sin(t * 4);
        drawHexagon(orbX, orbY, orbR + 14, t * 1.8, `rgba(255,77,0,${shieldAlpha * 0.7})`, 1);
        drawHexagon(orbX, orbY, orbR + 22, -t * 1.2, `rgba(0,212,255,${shieldAlpha * 0.4})`, 0.8);
      }

      // ── Draw orb ─────────────────────────────────────────────────────────
      if (orbR > 0.5) {
        ctx.save();
        ctx.globalAlpha = orbAlpha;

        // Outer glow (large, soft)
        drawGlow(orbX, orbY, orbR * 5, orbGlowColor, 0.12 * orbAlpha);
        // Mid glow
        drawGlow(orbX, orbY, orbR * 2.5, orbGlowColor, 0.3 * orbAlpha);

        // Core
        if (orbColor === "#000000") {
          // Singularity: black core with white ring
          ctx.beginPath();
          ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
          ctx.fillStyle = "#000000";
          ctx.fill();
          ctx.strokeStyle = `rgba(255,255,255,0.9)`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Inner cyan ring
          ctx.beginPath();
          ctx.arc(orbX, orbY, orbR + 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0,212,255,0.4)`;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          // Normal orb with radial gradient
          const [or, og, ob] = hexToRgb(orbColor);
          const ogrd = ctx.createRadialGradient(orbX - orbR * 0.3, orbY - orbR * 0.3, 0, orbX, orbY, orbR);
          ogrd.addColorStop(0, `rgba(255,255,255,0.9)`);
          ogrd.addColorStop(0.3, `rgba(${or},${og},${ob},1)`);
          ogrd.addColorStop(1, `rgba(${Math.round(or * 0.5)},${Math.round(og * 0.5)},${Math.round(ob * 0.5)},1)`);
          ctx.beginPath();
          ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
          ctx.fillStyle = ogrd;
          ctx.fill();
        }

        // Orb text (rendered outside orb, above)
        if (orbText) {
          const fontSize = isMobile ? 7 : 8.5;
          ctx.font = `${fontSize}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          // Text background pill
          const tw = ctx.measureText(orbText).width;
          ctx.fillStyle = "rgba(0,0,0,0.75)";
          ctx.fillRect(orbX - tw / 2 - 4, orbY - orbR - 18, tw + 8, 14);
          ctx.fillStyle = orbTextColor;
          ctx.fillText(orbText, orbX, orbY - orbR - 6);
        }

        ctx.restore();
      }

      // ── Draw particles ───────────────────────────────────────────────────
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.98;
        p.life -= p.decay;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.life * p.life;
        if (p.type === "data" && p.char) {
          ctx.fillStyle = p.color;
          ctx.font = "8px monospace";
          ctx.textAlign = "center";
          ctx.fillText(p.char, p.x, p.y);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // ── Phase label overlay ──────────────────────────────────────────────
      const phaseLabels = ["INTENT", "ENCRYPTING", "SEALING", "TRANSMITTING", "VALIDATING", "RESOLVED"];
      const labelAlpha = 0.18;
      ctx.font = `bold ${isMobile ? 28 : 42}px monospace`;
      ctx.textAlign = "center";
      ctx.fillStyle = `rgba(255,255,255,${labelAlpha})`;
      ctx.fillText(phaseLabels[currentPhase], CX, H * 0.88);

      animRef.current = requestAnimationFrame(draw);
    };

    startTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [containerWidth, containerHeight, onPhaseChange, animKey]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ willChange: "transform, opacity" }}
    />
  );
}

// ─── Step Tracker ─────────────────────────────────────────────────────────────
function StepTracker({ phase, t }: { phase: Phase; t: number }) {
  const activeStep = Math.min(phase, 4);
  const progressPct = (activeStep / 4) * 100;

  return (
    <div className="relative w-full px-4 sm:px-6 md:px-12 py-3 md:py-4">
      {/* Top progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "rgba(255,255,255,0.04)" }}>
        <motion.div
          className="absolute top-0 left-0 h-full"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          style={{
            background: "linear-gradient(90deg, #ff4d00 0%, #ff8800 30%, #00d4ff 70%, #00ff88 100%)",
            boxShadow: "0 0 6px rgba(0,212,255,0.5)",
          }}
        />
      </div>

      {/* Steps row */}
      <div className="flex items-start justify-between gap-2">
        {STEPS.map((step, i) => {
          const isComplete = i < activeStep;
          const isActive = i === activeStep;
          const isIdle = i > activeStep;

          return (
            <div key={step.num} className="flex-1 flex flex-col items-center gap-1 relative min-w-0">
              {/* Step number + check */}
              <div className="flex items-center gap-1">
                <AnimatePresence mode="wait">
                  {isComplete && (
                    <motion.span
                      key="check"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ color: "#00ff88", fontSize: 10, lineHeight: 1 }}
                    >
                      ✓
                    </motion.span>
                  )}
                </AnimatePresence>
                <motion.span
                  className="font-mono-cipher font-bold tabular-nums"
                  style={{ fontSize: 12 }}
                  animate={{
                    color: isActive ? "#ff4d00" : isComplete ? "#00ff88" : "#333",
                  }}
                  transition={{ duration: 0.4 }}
                >
                  {step.num}
                </motion.span>
                {isActive && (
                  <motion.span
                    className="w-1 h-1 rounded-full"
                    style={{ background: "#ff4d00", flexShrink: 0 }}
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Label */}
              <motion.span
                className="font-mono-cipher uppercase tracking-wider text-center leading-tight hidden sm:block"
                style={{ fontSize: 8 }}
                animate={{
                  color: isActive ? "#e0e0e0" : isComplete ? "#555" : "#2a2a2a",
                }}
                transition={{ duration: 0.4 }}
              >
                {step.label}
              </motion.span>

              {/* Sub-label — only active */}
              <motion.span
                className="font-mono-cipher text-center leading-tight hidden md:block"
                style={{ fontSize: 7 }}
                animate={{
                  color: "#666",
                  opacity: isActive ? 1 : 0,
                  height: isActive ? "auto" : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                {step.sub}
              </motion.span>

              {/* Active bottom accent */}
              {isActive && (
                <motion.div
                  layoutId="stepAccent"
                  className="absolute -bottom-[20px] left-1/2 -translate-x-1/2 w-[1px] h-[12px]"
                  style={{ background: "linear-gradient(to bottom, #ff4d00, transparent)" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Phase Info Panel ─────────────────────────────────────────────────────────
function PhaseInfoPanel({ phase }: { phase: Phase }) {
  const info = [
    { title: "Intent Captured", detail: "Plaintext preference encoded into structured payload", color: "#ff4d00" },
    { title: "Encryption Active", detail: "FHE sealing initiated — data becomes mathematically opaque", color: "#ff8800" },
    { title: "Singularity Formed", detail: "256-bit encrypted packet compressed to transmission state", color: "#00d4ff" },
    { title: "Secure Transit", detail: "Encrypted packet traverses protocol layer — zero knowledge exposed", color: "#00d4ff" },
    { title: "Blind Validation", detail: "Employer circuit evaluates match without decrypting candidate data", color: "#00aaff" },
    { title: "Match Resolved", detail: "Mutual consent confirmed — both parties notified privately", color: "#00ff88" },
  ];

  const current = info[phase];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 px-4 py-2"
        style={{
          background: "rgba(0,0,0,0.6)",
          border: `1px solid ${current.color}22`,
          borderLeft: `2px solid ${current.color}`,
        }}
      >
        <motion.div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: current.color }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
        <div>
          <div className="font-mono-cipher text-[10px] font-bold uppercase tracking-widest" style={{ color: current.color }}>
            {current.title}
          </div>
          <div className="font-mono-cipher text-[9px] text-muted-foreground mt-0.5">
            {current.detail}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function HoverTooltip({ x, y, label, sub }: { x: number; y: number; label: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute pointer-events-none z-30 font-mono-cipher"
      style={{
        left: Math.min(x + 14, 9999),
        top: y - 36,
        background: "rgba(0,0,0,0.92)",
        border: "1px solid rgba(255,77,0,0.4)",
        padding: "5px 10px",
        minWidth: 120,
      }}
    >
      <div className="text-[10px] text-primary uppercase tracking-widest font-bold">{label}</div>
      {sub && <div className="text-[8px] text-muted-foreground mt-0.5">{sub}</div>}
    </motion.div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function MoaiTransmission() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [phase, setPhase] = useState<Phase>(0);
  const [paused, setPaused] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; sub?: string } | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const tRef = useRef(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setDims({ w: r.width, h: r.height });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const isMobile = dims.w < 640;
  const MOAI_W = isMobile ? 150 : 240;
  const H = isMobile ? 320 : 420;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < MOAI_W) {
      setTooltip({ x, y, label: "Candidate Entity", sub: "Encrypted profile holder" });
    } else if (x > rect.width - MOAI_W) {
      setTooltip({ x, y, label: "Employer Entity", sub: "Blind computation receiver" });
    } else if (Math.abs(x - rect.width / 2) < 80 && Math.abs(y - rect.height * 0.44) < 80) {
      setTooltip({ x, y, label: "Encrypted Payload", sub: "256-bit FHE sealed packet" });
    } else {
      setTooltip(null);
    }
  }, [MOAI_W]);

  const handleClick = useCallback(() => {
    setAnimKey(k => k + 1);
    setPhase(0);
    setPaused(false);
  }, []);

  return (
    <div className="w-full py-12 md:py-16 border-t border-border relative overflow-hidden">
      {/* Section header */}
      <div className="text-center mb-8 md:mb-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 border border-primary/25 bg-primary/5 px-3 py-1.5 mb-5"
        >
          <motion.span
            className="w-1.5 h-1.5 bg-primary rounded-full"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span className="font-mono-cipher text-[10px] text-primary uppercase tracking-[0.2em]">
            Live Protocol Visualization
          </span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-[clamp(2rem,5vw,4rem)] leading-[0.95] text-foreground"
        >
          Privacy in Motion
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-mono-cipher text-[10px] text-muted-foreground mt-3 uppercase tracking-[0.15em]"
        >
          Hover to inspect · Click to replay
        </motion.p>
      </div>

      {/* Main stage */}
      <div
        ref={containerRef}
        className="relative w-full cursor-pointer select-none overflow-hidden"
        style={{
          height: H,
          background: "linear-gradient(180deg, #080808 0%, #0d0d0d 60%, #0a0a0a 100%)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setTooltip(null); setPaused(false); }}
        onMouseEnter={() => setPaused(true)}
        onClick={handleClick}
      >
        {/* Canvas */}
        {dims.w > 0 && (
          <TransmissionCanvas
            animKey={animKey}
            containerWidth={dims.w}
            containerHeight={H}
            onPhaseChange={setPhase}
            paused={paused}
          />
        )}

        {/* Left Moai */}
        <div
          className="absolute top-0 overflow-hidden pointer-events-none"
          style={{ left: 0, width: MOAI_W, bottom: 0 }}
        >
          <img
            src="/assets/moai.jpg"
            alt="Candidate"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
              filter: "grayscale(30%) contrast(1.15) brightness(0.65)",
              maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
            }}
          />
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <div className="font-mono-cipher text-[8px] text-muted-foreground/60 uppercase tracking-[0.2em]">
              Candidate
            </div>
          </div>
        </div>

        {/* Right Moai */}
        <div
          className="absolute top-0 overflow-hidden pointer-events-none"
          style={{ right: 0, width: MOAI_W, bottom: 0 }}
        >
          <img
            src="/assets/moai.jpg"
            alt="Employer"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
              filter: "grayscale(30%) contrast(1.15) brightness(0.65)",
              transform: "scaleX(-1)",
              maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
            }}
          />
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <div className="font-mono-cipher text-[8px] text-muted-foreground/60 uppercase tracking-[0.2em]">
              Employer
            </div>
          </div>
        </div>

        {/* Pause indicator */}
        <AnimatePresence>
          {paused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 md:top-4 right-4 font-mono-cipher text-[8px] text-muted-foreground/50 uppercase tracking-widest border border-border/20 px-2 py-1"
            >
              ⏸ Paused
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tooltip */}
        <AnimatePresence>
          {tooltip && (
            <HoverTooltip x={tooltip.x} y={tooltip.y} label={tooltip.label} sub={tooltip.sub} />
          )}
        </AnimatePresence>
      </div>

      {/* Phase info panel — between animation and step tracker */}
      <div className="w-full px-4 sm:px-6 md:px-12 py-3" style={{ background: "#080808", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-2xl mx-auto">
          <PhaseInfoPanel phase={phase} />
        </div>
      </div>

      {/* Step tracker — below animation */}
      <div className="w-full" style={{ background: "#080808", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <StepTracker phase={phase} t={tRef.current} />
      </div>

      {/* Bottom metadata row */}
      <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-8 mt-4 md:mt-5 px-4">
        {[
          { label: "Protocol", value: "FHE / fhEVM" },
          { label: "Encryption", value: "256-bit TFHE" },
          { label: "Network", value: "Fhenix Testnet" },
          { label: "Latency", value: "~12s cycle" },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div className="font-mono-cipher text-[8px] text-muted-foreground/40 uppercase tracking-widest">{item.label}</div>
            <div className="font-mono-cipher text-[10px] text-foreground/60 mt-0.5">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}