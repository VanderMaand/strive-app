"use client";

import { Activity, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CurrentUser = {
  id: number;
  email: string;
  role: string;
};

export function Header({
  patientName,
  sessionLabel,
}: {
  patientName: string;
  sessionLabel: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (!cancelled && json.status === "ok") {
          setUser(json.user);
        }
      } catch {
        // diam-diam abaikan; header tetap tampil tanpa info user
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    if (!confirm("Yakin ingin logout?")) return;

    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-line px-6 py-5 sm:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-trace/10 text-trace ring-1 ring-trace/30">
          <Activity size={20} strokeWidth={2.25} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
            Tim STRIVE — VR Stroke Rehabilitation
          </p>
          <h1 className="font-mono text-lg font-semibold tracking-tight text-ink">
            STRIVE MONITOR
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 rounded-lg bg-surface px-4 py-2 ring-1 ring-surface-line">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-leaf" />
          </span>
          <div className="text-sm leading-tight">
            <p className="text-ink">{patientName}</p>
            <p className="text-xs text-muted">{sessionLabel}</p>
          </div>
        </div>

        {/* ⬇️ TAMBAHAN: info user login + tombol logout */}
        <div className="flex items-center gap-3 rounded-lg bg-surface px-4 py-2 ring-1 ring-surface-line">
          {user && (
            <div className="text-right text-sm leading-tight">
              <p className="text-ink">{user.email}</p>
              <p className="text-xs capitalize text-muted">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Logout"
            className="flex items-center gap-1 rounded-lg border border-surface-line px-3 py-1.5 text-xs text-ink hover:bg-surface-alt disabled:opacity-50"
          >
            <LogOut size={14} />
            {loggingOut ? "..." : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}
