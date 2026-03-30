import { useState } from "react";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { WalletButton } from "@/components/WalletButton";
import {
  Lock,
  User,
  Briefcase,
  Zap,
  Code2,
  ChevronLeft,
  ChevronRight,
  Home,
  Menu,
  X,
  LayoutDashboard,
  FileText,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Landing", icon: Home, external: false },
  { path: "/app", label: "Dashboard", icon: LayoutDashboard, external: false },
  { path: "/app/candidate", label: "Candidate", icon: User, external: false },
  { path: "/app/employer", label: "Employer", icon: Briefcase, external: false },
  { path: "/app/matches", label: "Match Engine", icon: Zap, external: false },
  { path: "/app/protocol", label: "Protocol", icon: Code2, external: false },
  { path: "/app/whitepaper", label: "Whitepaper", icon: FileText, external: false },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 56 : 220 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden md:flex flex-col border-r border-border bg-card shrink-0 relative z-10"
        style={{ minHeight: "100vh" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border overflow-hidden">
          <img src="/assets/cypher.jpg" alt="Cipher CV" className="w-7 h-7 object-cover shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-sm uppercase tracking-widest whitespace-nowrap overflow-hidden"
                style={{ fontFamily: "Space Grotesk" }}
              >
                Cipher CV
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const active = item.path === "/app"
              ? location.pathname === "/app"
              : location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-2 py-2.5 transition-all duration-100 group ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="font-mono-cipher text-xs uppercase tracking-widest whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center p-3 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -220 }}
            animate={{ x: 0 }}
            exit={{ x: -220 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 top-0 bottom-0 w-[220px] bg-card border-r border-border z-50 flex flex-col md:hidden"
          >
            <div className="flex items-center justify-between px-4 py-5 border-b border-border">
              <div className="flex items-center gap-2">
                <img src="/assets/cypher.jpg" alt="Cipher CV" className="w-7 h-7 object-cover" />
                <span className="font-bold text-sm uppercase tracking-widest" style={{ fontFamily: "Space Grotesk" }}>
                  Cipher CV
                </span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 px-2">
              {NAV_ITEMS.map((item) => {
                  const active = item.path === "/app"
                    ? location.pathname === "/app"
                    : location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-2 py-2.5 transition-all duration-100 ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="font-mono-cipher text-xs uppercase tracking-widest">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="font-mono-cipher text-xs text-muted-foreground">
              {NAV_ITEMS.find((n) => n.path === location.pathname)?.label ?? "App"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-mono-cipher text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Fhenix Testnet
            </div>
            <WalletButton />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
