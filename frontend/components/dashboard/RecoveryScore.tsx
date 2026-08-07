"use client";

import { TherapySession } from "@/lib/types";
import { recoveryScore } from "@/lib/types";

function Bar({ label, value, hex }: { label: string; value: number; hex: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-ink mono-tabular">{value.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-alt">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${value}%`, backgroundColor: hex }}
        />
      </div>
    </div>
  );
}

export function RecoveryScore({ session }: { session: TherapySession }) {
  const score = recoveryScore(session);

  return (
    <div className="rounded-xl bg-surface p-6 shadow-panel">
      <p className="mb-4 text-xs uppercase tracking-[0.16em] text-muted">Recovery Score</p>

      <div className="mb-5 flex items-baseline gap-2">
        <span className="font-mono text-5xl font-bold text-amber">{score.toFixed(1)}</span>
        <span className="text-lg text-muted">%</span>
      </div>

      <div className="space-y-3">
        <Bar label="Finger Movement" value={session.fingerMovement} hex="#22D3C8" />
        <Bar label="Elbow Movement" value={session.elbowMovement} hex="#4ADE80" />
        <Bar label="Consistency" value={session.consistency} hex="#F2A65A" />
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted">
        Recovery Score = 35% gerakan jari + 35% gerakan siku + 30% konsistensi latihan.
      </p>
    </div>
  );
}
