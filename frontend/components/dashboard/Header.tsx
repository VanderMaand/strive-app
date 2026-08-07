"use client";

import { Activity } from "lucide-react";

export function Header({ patientName, sessionLabel }: { patientName: string; sessionLabel: string }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-line px-6 py-5 sm:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-trace/10 text-trace ring-1 ring-trace/30">
          <Activity size={20} strokeWidth={2.25} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Tim STRIVE — VR Stroke Rehabilitation</p>
          <h1 className="font-mono text-lg font-semibold tracking-tight text-ink">STRIVE MONITOR</h1>
        </div>
      </div>
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
    </header>
  );
}
