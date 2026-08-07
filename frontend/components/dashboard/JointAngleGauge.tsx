"use client";

import { useEffect, useState } from "react";

type Props = {
  label: string;
  sessionId: string;
  field: "finger_angle" | "elbow_angle";
  max: number; // rentang derajat maksimum anatomis
  accent: string;
  strokeHex: string;
};

type SensorState = "waiting" | "disconnected" | "ok" | "error";

export function JointAngleGauge({ label, sessionId, field, max, accent, strokeHex }: Props) {
  const [angle, setAngle] = useState<number | null>(null);
  const [state, setState] = useState<SensorState>("waiting");

  useEffect(() => {
    const es = new EventSource(`/api/vitals?session=${sessionId}`);
    es.onerror = () => setState("error");
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setState(data.status);
      if (data.status === "ok" && typeof data[field] === "number") {
        setAngle(data[field]);
      }
    };
    return () => es.close();
  }, [sessionId, field]);

  const pct = Math.min(1, Math.max(0, (angle ?? 0) / max));
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct * 0.75);

  const statusLabel: Record<SensorState, string> = {
    ok: "",
    waiting: "menunggu sensor",
    disconnected: "DB terputus",
    error: "terputus",
  };

  return (
    <div className="flex flex-col items-center rounded-xl bg-surface p-5 shadow-panel">
      <p className="mb-2 self-start text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-[135deg]">
          <circle
            cx="70" cy="70" r={r} fill="none" stroke="#233355" strokeWidth="10"
            strokeDasharray={`${circumference * 0.75} ${circumference}`} strokeLinecap="round"
          />
          {angle !== null && (
            <circle
              cx="70" cy="70" r={r} fill="none" stroke={strokeHex} strokeWidth="10"
              strokeDasharray={`${circumference * 0.75} ${circumference}`}
              strokeDashoffset={offset} strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.25s linear" }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
          {angle !== null ? (
            <>
              <span className={`font-mono text-2xl font-semibold mono-tabular ${accent}`}>{angle.toFixed(0)}°</span>
              <span className="text-[10px] text-muted">/ {max}°</span>
            </>
          ) : (
            <span className="text-[11px] leading-tight text-muted">{statusLabel[state]}</span>
          )}
        </div>
      </div>
    </div>
  );
}
