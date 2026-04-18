import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCircle, Zap, Shield, TrendingUp, Calendar, Vote, AlertTriangle } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAccount } from "wagmi";

const TYPE_ICONS = {
  match_found: Zap,
  consent_received: CheckCircle,
  salary_revealed: Shield,
  profile_submitted: CheckCircle,
  job_posted: CheckCircle,
  insurance_activated: Calendar,
  counter_offer_ready: TrendingUp,
  governance_vote: Vote,
  system: AlertTriangle,
};

const TYPE_COLORS = {
  match_found: "text-primary border-primary",
  consent_received: "text-primary border-primary",
  salary_revealed: "text-primary border-primary",
  profile_submitted: "text-foreground border-border",
  job_posted: "text-foreground border-border",
  insurance_activated: "text-foreground border-border",
  counter_offer_ready: "text-primary border-primary",
  governance_vote: "text-foreground border-border",
  system: "text-muted-foreground border-border",
};

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function NotificationCenter() {
  const { address } = useAccount();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const notifications = useQuery(
    api.notifications.getNotifications,
    address ? { walletAddress: address } : "skip"
  );
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    address ? { walletAddress: address } : "skip"
  );
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    setOpen(v => !v);
  };

  const handleMarkRead = async (id: string) => {
    await markRead({ notificationId: id as any });
  };

  const handleMarkAllRead = async () => {
    if (!address) return;
    await markAllRead({ walletAddress: address });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification({ notificationId: id as any });
  };

  const count = unreadCount ?? 0;
  const items = notifications ?? [];

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-8 h-8 border border-border text-muted-foreground hover:border-primary hover:text-foreground transition-all duration-100"
        aria-label="Notifications"
      >
        <Bell className="w-3.5 h-3.5" />
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground font-mono-cipher flex items-center justify-center rounded-full"
            style={{ fontSize: "9px" }}
          >
            {count > 9 ? "9+" : count}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 w-80 bg-card border border-border shadow-xl z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-mono-cipher text-xs uppercase tracking-widest text-foreground">
                  Notifications
                </span>
                {count > 0 && (
                  <span className="font-mono-cipher text-xs text-primary border border-primary/30 px-1.5 py-0.5">
                    {count} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="font-mono-cipher text-muted-foreground hover:text-foreground transition-colors"
                    style={{ fontSize: "10px" }}
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                  <div className="font-mono-cipher text-xs text-muted-foreground">No notifications yet</div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((notif) => {
                    const Icon = TYPE_ICONS[notif.type] ?? AlertTriangle;
                    const colorClass = TYPE_COLORS[notif.type] ?? "text-muted-foreground border-border";
                    return (
                      <motion.div
                        key={notif._id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors ${
                          !notif.read ? "bg-primary/3" : "hover:bg-secondary/30"
                        }`}
                        onClick={() => !notif.read && handleMarkRead(notif._id)}
                      >
                        <div className={`w-6 h-6 border flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-mono-cipher text-xs font-bold ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notif.title}
                          </div>
                          <div className="font-mono-cipher text-muted-foreground leading-relaxed mt-0.5" style={{ fontSize: "10px" }}>
                            {notif.message}
                          </div>
                          <div className="font-mono-cipher text-muted-foreground/50 mt-1" style={{ fontSize: "9px" }}>
                            {timeAgo(notif._creationTime)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                          )}
                          <button
                            onClick={(e) => handleDelete(notif._id, e)}
                            className="text-muted-foreground/40 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-4 py-2 border-t border-border">
                <div className="font-mono-cipher text-muted-foreground text-center" style={{ fontSize: "10px" }}>
                  {items.length} total notifications
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
