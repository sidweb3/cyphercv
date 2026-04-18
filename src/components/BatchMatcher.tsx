import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateHash, computeMatch, PRESET_MATCHES } from "@/lib/demoData";
import { Zap, CheckCircle, XCircle } from "lucide-react";

interface BatchResult {
  candidateLabel: string;
  employerLabel: string;
  compatible: boolean;
  score: number;
  candidateHash: string;
  employerHash: string;
  computing: boolean;
  done: boolean;
}

export function BatchMatcher() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [currentPair, setCurrentPair] = useState(-1);

  const pairs: BatchResult[] = PRESET_MATCHES.map(m => ({
    candidateLabel: m.candidate.label,
    employerLabel: m.employer.label,
    compatible: m.result.compatible,
    score: m.result.score,
    candidateHash: m.candidate.hash,
    employerHash: m.employer.hash,
    computing: false,
    done: false,
  }));

  // Add extra synthetic pairs
  const allPairs: BatchResult[] = [
    ...pairs,
    {
      candidateLabel: "Mid-Level Engineer",
      employerLabel: "Scale-up Tech",
      compatible: true,
      score: 82,
      candidateHash: generateHash(),
      employerHash: generateHash(),
      computing: false,
      done: false,
    },
    {
      candidateLabel: "Staff Engineer",
      employerLabel: "Enterprise Corp",
      compatible: false,
      score: 0,
      candidateHash: generateHash(),
      employerHash: generateHash(),
      computing: false,
      done: false,
    },
    {
      candidateLabel: "Blockchain Dev",
      employerLabel: "DeFi Protocol",
      compatible: true,
      score: 91,
      candidateHash: generateHash(),
      employerHash: generateHash(),
      computing: false,
      done: false,
    },
  ];

  const runBatch = () => {
    setRunning(true);
    setCurrentPair(-1);
    setResults(allPairs.map(p => ({ ...p, computing: false, done: false })));

    let i = 0;
    const interval = setInterval(() => {
      setCurrentPair(i);
      setResults(prev => prev.map((r, idx) => ({
        ...r,
        computing: idx === i,
        done: idx < i,
      })));
      i++;
      if (i >= allPairs.length) {
        clearInterval(interval);
        setTimeout(() => {
          setResults(prev => prev.map(r => ({ ...r, computing: false, done: true })));
          setRunning(false);
          setCurrentPair(-1);
        }, 600);
      }
    }, 700);
  };

  const reset = () => {
    setResults([]);
    setCurrentPair(-1);
    setRunning(false);
  };

  const matchCount = results.filter(r => r.done && r.compatible).length;
  const totalDone = results.filter(r => r.done).length;

  return (
    <div className="border border-border bg-card">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <span className="font-mono-cipher text-xs uppercase tracking-widest text-muted-foreground">
            Batch Tournament
          </span>
          <div className="font-mono-cipher text-muted-foreground mt-0.5" style={{ fontSize: "10px" }}>
            Run all candidate × employer pairs simultaneously
          </div>
        </div>
        <div className="flex items-center gap-3">
          {results.length > 0 && (
            <span className="font-mono-cipher text-xs text-primary">
              {matchCount}/{totalDone} matched
            </span>
          )}
          {!running && results.length === 0 && (
            <motion.button
              onClick={runBatch}
              whileTap={{ scale: 0.97 }}
              className="font-mono-cipher text-xs bg-primary text-primary-foreground px-4 py-2 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 flex items-center gap-2"
            >
              <Zap className="w-3 h-3" />
              Run Batch
            </motion.button>
          )}
          {!running && results.length > 0 && (
            <button
              onClick={reset}
              className="font-mono-cipher text-xs border border-border text-muted-foreground px-3 py-2 hover:border-primary hover:text-foreground transition-all duration-100"
            >
              Reset
            </button>
          )}
          {running && (
            <span className="font-mono-cipher text-xs text-primary animate-pulse flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Computing...
            </span>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <div className="font-mono-cipher text-xs text-muted-foreground">
            {allPairs.length} candidate × employer pairs ready for batch FHE matching
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {results.map((result, i) => (
            <motion.div
              key={`${result.candidateLabel}-${result.employerLabel}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="px-6 py-3 flex items-center gap-4"
            >
              <div className="flex items-center gap-2 w-5">
                {result.computing && (
                  <span className="text-primary animate-pulse font-mono-cipher text-xs">▋</span>
                )}
                {result.done && result.compatible && (
                  <CheckCircle className="w-3.5 h-3.5 text-primary" />
                )}
                {result.done && !result.compatible && (
                  <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                {!result.computing && !result.done && (
                  <span className="w-3.5 h-3.5 border border-border block" />
                )}
              </div>

              <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                <div>
                  <div className="font-mono-cipher text-xs text-foreground truncate">{result.candidateLabel}</div>
                  <div className="font-mono-cipher text-muted-foreground truncate" style={{ fontSize: "10px" }}>
                    {result.candidateHash}
                  </div>
                </div>
                <div>
                  <div className="font-mono-cipher text-xs text-foreground truncate">{result.employerLabel}</div>
                  <div className="font-mono-cipher text-muted-foreground truncate" style={{ fontSize: "10px" }}>
                    {result.employerHash}
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                {result.computing && (
                  <div className="font-mono-cipher text-xs text-muted-foreground animate-pulse">
                    FHE...
                  </div>
                )}
                {result.done && result.compatible && (
                  <div className="font-mono-cipher text-xs text-primary">{result.score}%</div>
                )}
                {result.done && !result.compatible && (
                  <div className="font-mono-cipher text-xs text-muted-foreground">NO MATCH</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary */}
      <AnimatePresence>
        {!running && results.length > 0 && totalDone === allPairs.length && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border-t border-border px-6 py-4 grid grid-cols-3 gap-4"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
                {allPairs.length}
              </div>
              <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>PAIRS EVALUATED</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary" style={{ fontFamily: "Space Grotesk" }}>
                {matchCount}
              </div>
              <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>MATCHES FOUND</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
                0
              </div>
              <div className="font-mono-cipher text-muted-foreground" style={{ fontSize: "10px" }}>BITS LEAKED</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
