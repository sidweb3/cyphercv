import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface EncryptedInputProps {
  label: string;
  min?: number;
  max?: number;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
}

const HASHES = [
  "0x7f3a9b2c", "0x9b2c4e1d", "0x3d8e2f1a", "0x5c9f2e8a",
  "0x1a9c7b4e", "0x8a1b4d7e", "0x2f5e9c3b", "0x4e1d8f5a",
];

export function EncryptedInput({ label, min = 0, max = 100, value, onChange }: EncryptedInputProps) {
  const [hashIndex, setHashIndex] = useState(0);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    setIsChanging(true);
    const t = setTimeout(() => setIsChanging(false), 300);
    const interval = setInterval(() => {
      setHashIndex(i => (i + 1) % HASHES.length);
    }, 800);
    return () => { clearTimeout(t); clearInterval(interval); };
  }, [value]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono-cipher">{label}</span>
        <motion.span
          key={hashIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="encrypted-block"
        >
          {isChanging ? "COMPUTING..." : "[ENCRYPTED]"}
        </motion.span>
      </div>
      <div className="relative h-1 bg-secondary">
        <motion.div
          className="absolute top-0 left-0 h-full bg-primary"
          style={{ width: `${percentage}%` }}
          transition={{ duration: 0.1 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ height: "100%" }}
        />
      </div>
      <div className="flex justify-between">
        <span className="font-mono-cipher text-xs text-muted-foreground">MIN</span>
        <span className="font-mono-cipher text-xs text-muted-foreground">MAX</span>
      </div>
    </div>
  );
}
