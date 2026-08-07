"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TherapySession } from "@/lib/types";

export function ProgressChart({ sessions }: { sessions: TherapySession[] }) {
  const data = sessions.map((s) => ({
    date: new Date(s.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
    Jari: s.fingerMovement,
    Siku: s.elbowMovement,
    Konsistensi: s.consistency,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#233355" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#7C8AAA", fontSize: 11 }} axisLine={{ stroke: "#233355" }} tickLine={false} />
          <YAxis tick={{ fill: "#7C8AAA", fontSize: 11 }} axisLine={{ stroke: "#233355" }} tickLine={false} domain={[0, 100]} />
          <Tooltip
            contentStyle={{ background: "#16223A", border: "1px solid #233355", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#E7EDF7" }}
          />
          <Line type="monotone" dataKey="Jari" stroke="#22D3C8" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Siku" stroke="#4ADE80" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Konsistensi" stroke="#F2A65A" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
