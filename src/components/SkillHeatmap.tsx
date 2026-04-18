import { motion } from "framer-motion";

const SKILLS = [
  "Solidity", "Rust", "TypeScript", "React", "Node.js",
  "Python", "Go", "ZK Proofs", "FHE", "Smart Contracts",
  "DeFi", "Layer 2", "Cryptography", "Distributed Systems",
];

interface SkillHeatmapProps {
  candidateSkills: string[];
  employerSkills: string[];
  animated?: boolean;
}

export function SkillHeatmap({ candidateSkills, employerSkills, animated = true }: SkillHeatmapProps) {
  const getStatus = (skill: string) => {
    const inCandidate = candidateSkills.includes(skill);
    const inEmployer = employerSkills.includes(skill);
    if (inCandidate && inEmployer) return "match";
    if (inCandidate) return "candidate";
    if (inEmployer) return "employer";
    return "none";
  };

  const matchCount = SKILLS.filter(s => getStatus(s) === "match").length;

  return (
    <div className="border border-border bg-card">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
          Skill Vector Intersection
        </span>
        <span className="font-mono-cipher text-xs text-primary">
          {matchCount}/{SKILLS.length} overlap
        </span>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {SKILLS.map((skill, i) => {
            const status = getStatus(skill);
            return (
              <motion.div
                key={skill}
                initial={animated ? { opacity: 0, scale: 0.8 } : {}}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`font-mono-cipher text-xs px-2.5 py-1.5 border transition-all duration-200 ${
                  status === "match"
                    ? "border-primary bg-primary/10 text-primary"
                    : status === "candidate"
                    ? "border-border text-foreground bg-secondary/50"
                    : status === "employer"
                    ? "border-border/50 text-muted-foreground"
                    : "border-border/20 text-muted-foreground/40"
                }`}
              >
                {status === "match" && "✓ "}
                {skill}
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-3 border-t border-border">
          {[
            { color: "border-primary bg-primary/10 text-primary", label: "Intersection (match)" },
            { color: "border-border text-foreground bg-secondary/50", label: "Candidate only" },
            { color: "border-border/50 text-muted-foreground", label: "Employer only" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-3 h-3 border ${item.color}`} />
              <span className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
