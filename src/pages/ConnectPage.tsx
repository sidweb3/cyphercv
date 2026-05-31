import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { useAccount, useConnect } from "wagmi";
import { Shield, Lock, Zap } from "lucide-react";

function detectInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|Twitter|TikTok|Snapchat|Line\/|MicroMessenger|Telegram/i.test(ua) ||
    !!(window as unknown as Record<string, unknown>).ReactNativeWebView;
}

export default function ConnectPage() {
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const navigate = useNavigate();
  const isInApp = detectInAppBrowser();

  // Redirect to app if already connected
  useEffect(() => {
    if (isConnected) {
      navigate("/app", { replace: true });
    }
  }, [isConnected, navigate]);

  const handleConnect = () => {
    try {
      const c = connectors.find(c => c.id === "injected") || connectors[0];
      if (c) connect({ connector: c });
    } catch {
      // Silently ignore connector errors in restricted environments
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(#ff4500 1px, transparent 1px), linear-gradient(90deg, #ff4500 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Subtle orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,69,0,0.06) 0%, transparent 70%)", filter: "blur(60px)" }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-6 relative z-10"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/assets/cypher.jpg" alt="Cipher CV" className="w-8 h-8 object-cover" />
          <span className="font-bold text-lg uppercase tracking-widest" style={{ fontFamily: "Space Grotesk" }}>
            Cipher CV
          </span>
        </Link>

        {isInApp ? (
          <div className="border border-primary/40 bg-primary/5 p-8 space-y-6">
            <div className="space-y-2">
              <div className="text-xs text-primary uppercase tracking-widest font-semibold">Browser Required</div>
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
                Open in Your Browser
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cipher CV requires a Web3 wallet. In-app browsers don't support wallet connections — please open this page in Safari, Chrome, or Firefox.
              </p>
            </div>
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center text-sm font-semibold bg-primary text-primary-foreground py-4 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100"
            >
              Open in Browser →
            </a>
            <div className="space-y-2">
              {[
                "Copy the URL and paste it in your browser",
                "Or tap the ··· menu → Open in Browser",
                "MetaMask, WalletConnect, Coinbase Wallet supported",
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary shrink-0">—</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="border border-border bg-card p-8 space-y-6">
            <div className="space-y-2">
              <div className="text-xs text-primary uppercase tracking-widest font-semibold">Authentication Required</div>
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk" }}>
                Connect Your Wallet
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Access to the Cipher CV protocol requires a Web3 wallet. Your identity remains encrypted — we only verify wallet ownership.
              </p>
            </div>

            {/* Animated code block */}
            <div className="bg-background border border-border p-4 space-y-2 font-mono text-xs">
              <div className="text-muted-foreground">Awaiting authentication...</div>
              <div className="text-primary/70">0x7f3a9b2c4e1d8f5a</div>
              <div className="text-muted-foreground opacity-50">⊕ FHE.verify(wallet_signature)</div>
            </div>

            <button
              onClick={handleConnect}
              disabled={isPending}
              className="w-full text-sm font-semibold bg-primary text-primary-foreground py-4 uppercase tracking-widest hover:bg-foreground hover:text-background transition-all duration-100 disabled:opacity-60"
            >
              {isPending ? "Connecting..." : "Connect Wallet to Enter →"}
            </button>

            <div className="space-y-2">
              {[
                { icon: Shield, text: "MetaMask, WalletConnect, Coinbase Wallet supported" },
                { icon: Lock, text: "No personal data collected — wallet address only" },
                { icon: Zap, text: "All matching computed on encrypted data" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Icon className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          ← Back to Landing
        </Link>
      </motion.div>
    </div>
  );
}
