import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dialog } from "@radix-ui/react-dialog";
import { ChevronDown, ExternalLink } from "lucide-react";
import React, { useEffect, useState } from "react";

type SyncError = {
  error: string;
  stack: string;
  filename: string;
  lineno: number;
  colno: number;
};

type AsyncError = {
  error: string;
  stack: string;
};

type GenericError = SyncError | AsyncError;

// ─── Wallet/MetaMask error patterns to suppress ───────────────────────────────
const SUPPRESSED_ERROR_PATTERNS = [
  /metamask/i,
  /ethereum/i,
  /web3/i,
  /wallet/i,
  /provider/i,
  /injected/i,
  /window\.ethereum/i,
  /cannot read propert/i,
  /is not a function/i,
  /wagmi/i,
  /walletconnect/i,
  /coinbase/i,
  /rainbow/i,
  /connector/i,
  /eip-?1193/i,
  /user rejected/i,
  /request accounts/i,
  /eth_requestAccounts/i,
  /no ethereum provider/i,
  /non-ethereum browser/i,
];

function isWalletError(message: string, stack?: string): boolean {
  const text = `${message} ${stack ?? ""}`.toLowerCase();
  return SUPPRESSED_ERROR_PATTERNS.some(p => p.test(text));
}

// ─── In-app browser detection ─────────────────────────────────────────────────
function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    /FBAN|FBAV|Instagram|Twitter|TikTok|Snapchat|Line\/|MicroMessenger|Telegram/i.test(ua) ||
    // Generic in-app browser signals
    (!!ua.match(/Mobile/) && !!(window as any).ReactNativeWebView)
  );
}

function getOpenInBrowserUrl(): string {
  return window.location.href;
}

async function reportErrorToVly(errorData: {
  error: string;
  stackTrace?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
}) {
  if (!import.meta.env.VITE_VLY_APP_ID) {
    return;
  }

  try {
    await fetch(import.meta.env.VITE_VLY_MONITORING_URL as string, {
      method: "POST",
      body: JSON.stringify({
        ...errorData,
        url: window.location.href,
        projectSemanticIdentifier: import.meta.env.VITE_VLY_APP_ID,
      }),
    });
  } catch (error) {
    console.error("Failed to report error to Vly:", error);
  }
}

// ─── Open in Browser Banner ───────────────────────────────────────────────────
function OpenInBrowserBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const url = getOpenInBrowserUrl();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#ff4500",
        color: "#fff",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        fontFamily: "monospace",
        fontSize: "12px",
      }}
    >
      <span style={{ flex: 1 }}>
        ⚠️ For the best experience and wallet support, open this app in your browser.
      </span>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: "#fff",
            color: "#ff4500",
            padding: "6px 12px",
            fontWeight: "bold",
            textDecoration: "none",
            fontSize: "11px",
            letterSpacing: "0.05em",
          }}
        >
          Open in Browser →
        </a>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.5)",
            color: "#fff",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "11px",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function ErrorDialog({
  error,
  setError,
}: {
  error: GenericError;
  setError: (error: GenericError | null) => void;
}) {
  return (
    <Dialog
      defaultOpen={true}
      onOpenChange={() => {
        setError(null);
      }}
    >
      <DialogContent className="bg-red-700 text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle>Runtime Error</DialogTitle>
        </DialogHeader>
        A runtime error occurred. Open the vly editor to automatically debug the
        error.
        <div className="mt-4">
          <Collapsible>
            <CollapsibleTrigger>
              <div className="flex items-center font-bold cursor-pointer">
                See error details <ChevronDown />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="max-w-[460px]">
              <div className="mt-2 p-3 bg-neutral-800 rounded text-white text-sm overflow-x-auto max-h-60 max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <pre className="whitespace-pre">{error.stack}</pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        <DialogFooter>
          <a
            href={`https://vly.ai/project/${import.meta.env.VITE_VLY_APP_ID}`}
            target="_blank"
          >
            <Button>
              <ExternalLink /> Open editor
            </Button>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ErrorBoundaryState = {
  hasError: boolean;
  error: GenericError | null;
};

class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
  },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Don't report wallet errors
    if (isWalletError(error.message, error.stack)) {
      this.setState({ hasError: false, error: null });
      return;
    }
    reportErrorToVly({
      error: error.message,
      stackTrace: error.stack,
    });
    this.setState({
      hasError: true,
      error: {
        error: error.message,
        stack: info.componentStack ?? error.stack ?? "",
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDialog
          error={{
            error: "An error occurred",
            stack: "",
          }}
          setError={() => {}}
        />
      );
    }

    return this.props.children;
  }
}

export function InstrumentationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [error, setError] = useState<GenericError | null>(null);
  const [inAppBrowser] = useState(() => isInAppBrowser());

  useEffect(() => {
    const handleError = async (event: ErrorEvent) => {
      try {
        // Suppress wallet/MetaMask errors silently
        if (isWalletError(event.message, event.error?.stack)) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        setError({
          error: event.message,
          stack: event.error?.stack || "",
          filename: event.filename || "",
          lineno: event.lineno,
          colno: event.colno,
        });

        if (import.meta.env.VITE_VLY_APP_ID) {
          await reportErrorToVly({
            error: event.message,
            stackTrace: event.error?.stack,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          });
        }
      } catch (error) {
        console.error("Error in handleError:", error);
      }
    };

    const handleRejection = async (event: PromiseRejectionEvent) => {
      try {
        const msg = event.reason?.message ?? String(event.reason ?? "");
        const stack = event.reason?.stack ?? "";

        // Suppress wallet/MetaMask promise rejections silently
        if (isWalletError(msg, stack)) {
          event.preventDefault();
          return;
        }

        if (import.meta.env.VITE_VLY_APP_ID) {
          await reportErrorToVly({
            error: msg,
            stackTrace: stack,
          });
        }

        setError({
          error: msg,
          stack: stack,
        });
      } catch (error) {
        console.error("Error in handleRejection:", error);
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return (
    <>
      {inAppBrowser && <OpenInBrowserBanner />}
      <ErrorBoundary>{children}</ErrorBoundary>
      {error && <ErrorDialog error={error} setError={setError} />}
    </>
  );
}