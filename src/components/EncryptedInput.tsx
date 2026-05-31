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

export function EncryptedInput({ label, min = 0, max = 100, value, onChange, unit }: EncryptedInputProps) {
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    setIsChanging(true);
    const t = setTimeout(() => setIsChanging(false), 300);
    return () => clearTimeout(t);
  }, [value]);

  const percentage = ((value - min) / (max - min)) * 100;

  // Format display value
  const formatValue = (v: number) => {
    if (unit) return `${v.toLocaleString()} ${unit}`;
    if (max >= 10000) return `$${v.toLocaleString()}`;
    return v.toLocaleString();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono-cipher">{label}</span>
        <motion.span
          key={value}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`font-mono-cipher text-xs font-bold transition-colors duration-200 ${isChanging ? "text-primary/70" : "text-primary"}`}
        >
          {isChanging ? "⊕ encrypting..." : formatValue(value)}
        </motion.span>
      </div>
      <div className="relative h-1.5 bg-secondary rounded-none">
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
        <span className="font-mono-cipher text-xs text-muted-foreground">{formatValue(min)}</span>
        <span className="font-mono-cipher text-xs text-muted-foreground">{formatValue(max)}</span>
      </div>
    </div>
  );
}