import { AppLayout } from "./AppLayout";
import { DemoMode } from "@/components/DemoMode";
import { motion } from "framer-motion";

export default function MatchesPage() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="font-mono-cipher text-xs text-primary uppercase tracking-widest">
            Match Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
            Live FHE Matching
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure encrypted utility curves and run the homomorphic matching protocol in real time.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border">
          {[
            { label: "Active Candidates", value: "1,247" },
            { label: "Active Jobs", value: "384" },
            { label: "Matches Today", value: "89" },
            { label: "Privacy Score", value: "100%" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`p-6 text-center ${i < 3 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}
            >
              <div className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "Space Grotesk" }}>
                {stat.value}
              </div>
              <div className="font-mono-cipher text-xs text-muted-foreground uppercase tracking-widest">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Demo Mode embedded */}
        <DemoMode />
      </div>
    </AppLayout>
  );
}
