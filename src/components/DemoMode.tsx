import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { EncryptedInput } from "./EncryptedInput";
import { MatchingEngine } from "./MatchingEngine";
import { computeMatch, generateHash, PRESET_MATCHES } from "@/lib/demoData";

export function DemoMode() {
  const [candidateExp, setCandidateExp] = useState(5);
  const [candidateSkill, setCandidateSkill] = useState(7);
  const [candidateMin, setCandidateMin] = useState(80000);
  const [candidateMax, setCandidateMax] = useState(120000);

  const [employerBudget, setEmployerBudget] = useState(100000);
  const [employerExp, setEmployerExp] = useState(4);

  const [candidateHash] = useState(generateHash);
  const [employerHash] = useState(generateHash);

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ compatible: boolean; score: number; suggestedSalary?: number } | null>(null);
  const [activePreset, setActivePreset] = useState<number | null>(null);

  const handleCalculate = useCallback(() => {
    setResult(null);
    setIsRunning(true);
  }, []);

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    const r = computeMatch(candidateMin, candidateMax, employerBudget, candidateExp, employerExp);
    setResult(r);
  }, [candidateMin, candidateMax, employerBudget, candidateExp, employerExp]);

  const loadPreset = (index: number) => {
    const preset = PRESET_MATCHES[index];
    setActivePreset(index);
    setResult(null);
    setIsRunning(false);
    if (preset.candidate._minSalary) setCandidateMin(preset.candidate._minSalary);
    if (preset.candidate._maxSalary) setCandidateMax(preset.candidate._maxSalary);
    if (preset.candidate._experience) setCandidateExp(preset.candidate._experience);
    if (preset.candidate._skillLevel) setCandidateSkill(preset.candidate._skillLevel);
    if (preset.employer._budget) setEmployerBudget(preset.employer._budget);
    if (preset.employer._requiredExp) setEmployerExp(preset.employer._requiredExp);
  };

  return (
    <section id="demo" className="py-24 px-6 md:px-12 lg:px-20 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest mb-3">
            § 03 — Live Matching
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: 'Space Grotesk' }}>
            The Engine
          </h2>
          <p className="text-muted-foreground max-w-xl">
            Submit encrypted utility curves. The protocol computes intersection without reading inputs.
          </p>
        </div>

        {/* Preset Scenarios */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <span className="font-mono-cipher text-xs text-muted-foreground self-center mr-2">PRESETS:</span>
          {PRESET_MATCHES.map((preset, i) => (
            <button
              key={i}
              onClick={() => loadPreset(i)}
              className={`font-mono-cipher text-xs px-3 py-1.5 border transition-all duration-100 ${
                activePreset === i
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-border">
          {/* Candidate Panel */}
          <div className="p-6 border-b lg:border-b-0 lg:border-r border-border space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
                Candidate Input
              </span>
              <span className="encrypted-block text-xs">{candidateHash.slice(0, 10)}...</span>
            </div>

            <EncryptedInput
              label="Years of Experience"
              min={0}
              max={20}
              value={candidateExp}
              onChange={setCandidateExp}
            />
            <EncryptedInput
              label="Skill Proficiency"
              min={1}
              max={10}
              value={candidateSkill}
              onChange={setCandidateSkill}
            />
            <EncryptedInput
              label="Min Salary Requirement"
              min={40000}
              max={300000}
              value={candidateMin}
              onChange={setCandidateMin}
            />
            <EncryptedInput
              label="Max Salary Ceiling"
              min={40000}
              max={300000}
              value={candidateMax}
              onChange={setCandidateMax}
            />

            <div className="brutalist-border p-3 bg-muted">
              <div className="font-mono-cipher text-xs text-muted-foreground mb-1">ENCRYPTED PROFILE</div>
              <div className="font-mono-cipher text-xs text-foreground">
                {candidateHash} ████████████████
              </div>
            </div>
          </div>

          {/* Engine Center */}
          <div className="p-6 border-b lg:border-b-0 lg:border-r border-border flex flex-col items-center justify-center space-y-6">
            <div className="text-center space-y-2">
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                FHE Protocol
              </div>
              <div className="font-mono-cipher text-xs text-foreground">
                {candidateHash.slice(0, 8)}... ⊕ {employerHash.slice(0, 8)}...
              </div>
            </div>

            <motion.button
              onClick={handleCalculate}
              disabled={isRunning}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest font-mono-cipher disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 hover:bg-foreground hover:text-background"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              {isRunning ? "COMPUTING..." : "Calculate Match"}
            </motion.button>

            <MatchingEngine
              isRunning={isRunning}
              result={result}
              onComplete={handleComplete}
            />
          </div>

          {/* Employer Panel */}
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
                Employer Input
              </span>
              <span className="encrypted-block text-xs">{employerHash.slice(0, 10)}...</span>
            </div>

            <EncryptedInput
              label="Compensation Budget"
              min={40000}
              max={300000}
              value={employerBudget}
              onChange={setEmployerBudget}
            />
            <EncryptedInput
              label="Required Experience"
              min={0}
              max={20}
              value={employerExp}
              onChange={setEmployerExp}
            />

            <div className="brutalist-border p-3 bg-muted">
              <div className="font-mono-cipher text-xs text-muted-foreground mb-1">ENCRYPTED JOB SPEC</div>
              <div className="font-mono-cipher text-xs text-foreground">
                {employerHash} ████████████████
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest mb-3">
                Privacy Guarantees
              </div>
              {[
                "Salary never transmitted in plaintext",
                "Identity remains encrypted until mutual consent",
                "Rejection reveals zero information",
                "All computation on Fhenix fhEVM",
              ].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <span className="text-primary font-mono-cipher text-xs mt-0.5">—</span>
                  <span className="font-mono-cipher text-xs text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
