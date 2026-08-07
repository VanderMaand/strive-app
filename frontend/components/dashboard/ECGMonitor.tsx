"use client";

import { useEffect, useRef, useState } from "react";
import { HeartPulse } from "lucide-react";

const BUFFER_SIZE = 220;

type SensorState = "waiting" | "disconnected" | "ok" | "error";

export function ECGMonitor({ sessionId }: { sessionId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<number[]>(new Array(BUFFER_SIZE).fill(0));
  const [bpm, setBpm] = useState<number | null>(null);
  const [state, setState] = useState<SensorState>("waiting");
  const beatTimestamps = useRef<number[]>([]);

  useEffect(() => {
    const es = new EventSource(`/api/vitals?session=${sessionId}`);
    es.onerror = () => setState("error");
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setState(data.status);
      if (data.status !== "ok" || typeof data.ecg_mv !== "number") return;

      const buf = bufferRef.current;
      buf.shift();
      buf.push(data.ecg_mv);

      // Deteksi puncak sederhana untuk estimasi BPM dari data sensor yang masuk.
      if (data.ecg_mv > 0.85) {
        const now = performance.now();
        beatTimestamps.current.push(now);
        beatTimestamps.current = beatTimestamps.current.filter((t) => now - t < 8000);
        if (beatTimestamps.current.length >= 2) {
          const intervals = beatTimestamps.current
            .slice(1)
            .map((t, i) => t - beatTimestamps.current[i]);
          const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          if (avgMs > 0) setBpm(Math.round(60000 / avgMs / 1) * 6);
        }
      }
    };
    return () => es.close();
  }, [sessionId]);

  useEffect(() => {
    let raf: number;
    const draw = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const { width, height } = canvas;
          ctx.clearRect(0, 0, width, height);

          ctx.strokeStyle = "rgba(35,51,85,0.35)";
          ctx.lineWidth = 1;
          for (let x = 0; x < width; x += 24) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }

          if (state === "ok") {
            const buf = bufferRef.current;
            const mid = height / 2;
            ctx.beginPath();
            ctx.strokeStyle = "#22D3C8";
            ctx.lineWidth = 2;
            ctx.shadowColor = "rgba(34,211,200,0.6)";
            ctx.shadowBlur = 6;
            buf.forEach((v, i) => {
              const x = (i / (BUFFER_SIZE - 1)) * width;
              const y = mid - v * (height * 0.38);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.stroke();
          } else {
            // Garis datar saat belum ada data sensor -- bukan gelombang buatan,
            // murni penanda visual "belum ada sinyal".
            ctx.beginPath();
            ctx.strokeStyle = "rgba(124,138,170,0.4)";
            ctx.lineWidth = 1.5;
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  const statusLabel: Record<SensorState, string> = {
    ok: "Terhubung",
    waiting: "Menunggu data sensor",
    disconnected: "Database belum tersambung",
    error: "Terputus",
  };
  const dotClass: Record<SensorState, string> = {
    ok: "bg-leaf animate-pulseDot",
    waiting: "bg-amber",
    disconnected: "bg-coral",
    error: "bg-coral",
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-surface p-5 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted">
          <HeartPulse size={14} className="text-trace" />
          ECG · Real-time
        </div>
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass[state]}`} title={statusLabel[state]} />
      </div>

      <canvas
        ref={canvasRef}
        width={640}
        height={160}
        className="w-full rounded-lg bg-[#0B1424]"
        aria-label="Grafik ECG real-time"
      />

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="font-mono text-3xl font-semibold text-ink mono-tabular">{bpm ?? "--"}</p>
          <p className="text-xs text-muted">{bpm ? "bpm" : statusLabel[state]}</p>
        </div>
        <p className="text-xs text-muted">sesi: {sessionId}</p>
      </div>
    </div>
  );
}
