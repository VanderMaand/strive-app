"use client";

import { useEffect, useRef, useState } from "react";
import { HeartPulse } from "lucide-react";

const BUFFER_SIZE = 220;

type SensorState = "waiting" | "disconnected" | "ok" | "error" | "empty";

export function ECGMonitor({ sessionId }: { sessionId: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<number[]>(new Array(BUFFER_SIZE).fill(0));
  const [bpm, setBpm] = useState<number | null>(null);
  const [state, setState] = useState<SensorState>("waiting");
  const beatTimestamps = useRef<number[]>([]);

  useEffect(() => {
    // TAMBAH: reset semua state lama setiap kali sessionId berganti
    // (termasuk saat berganti ke pasien baru yang belum punya sesi sama sekali)
    bufferRef.current = new Array(BUFFER_SIZE).fill(0);
    beatTimestamps.current = [];
    setBpm(null);

    // TAMBAH: kalau belum ada sesi (pasien baru), jangan connect SSE sama sekali
    if (!sessionId) {
      setState("empty");
      return;
    }

    setState("waiting");

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
        beatTimestamps.current = beatTimestamps.current.filter(
          (t) => now - t < 8000
        );
        if (beatTimestamps.current.length >= 2) {
          const intervals = beatTimestamps.current
            .slice(1)
            .map((t, i) => t - beatTimestamps.current[i]);
          const avgMs =
            intervals.reduce((a, b) => a + b, 0) / intervals.length;
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
            buf.forEach((v, i) => {
              const x = (i / (BUFFER_SIZE - 1)) * width;
              const y = mid - v * (height / 3);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
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
    ok: "",
    waiting: "menunggu sensor",
    disconnected: "DB terputus",
    error: "terputus",
    empty: "belum ada sesi terapi",
  };

  return (
    <div className="rounded-xl bg-surface p-5 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          ECG Monitor
        </p>
        <div className="flex items-center gap-2 text-sm text-ink">
          <HeartPulse size={16} className="text-red-400" />
          <span className="font-mono">{bpm ?? "--"} bpm</span>
        </div>
      </div>

      <canvas ref={canvasRef} width={520} height={160} className="w-full" />

      {state !== "ok" && (
        <p className="mt-2 text-xs text-muted">{statusLabel[state]}</p>
      )}

      <p className="text-xs text-muted">sesi: {sessionId ?? "-"}</p>
    </div>
  );
}
