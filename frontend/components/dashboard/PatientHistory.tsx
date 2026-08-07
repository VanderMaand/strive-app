"use client";

import Link from "next/link";
import { Patient } from "@/lib/types";

export function PatientHistory({
  patients,
  selectedId,
  onSelect,
}: {
  patients: Patient[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-xl bg-surface shadow-panel">

      <p className="border-b border-surface-line px-5 py-4 text-xs uppercase tracking-[0.16em] text-muted">
        Riwayat Pasien
      </p>

      <ul className="divide-y divide-surface-line">

        {patients.map((p) => {

          const active = p.id === selectedId;

          const last =
            p.sessions.length > 0
              ? p.sessions[p.sessions.length - 1]
              : null;

          return (

            <li key={p.id}>

              <div
                className={`flex items-center justify-between gap-4 px-5 py-3 ${
                  active
                    ? "bg-trace/10"
                    : "hover:bg-surface-alt"
                }`}
              >

                <button
                  onClick={() => onSelect(p.id)}
                  className="flex-1 text-left"
                >

                  <p
                    className={`text-sm font-medium ${
                      active
                        ? "text-trace"
                        : "text-ink"
                    }`}
                  >
                    {p.name}
                  </p>

                  <p className="text-xs text-muted">
                    {p.diagnosis}
                  </p>

                </button>

                <div className="text-right">

                  <p className="font-mono text-sm text-ink mono-tabular">
                    {p.sessionsCompleted} sesi
                  </p>

                  <p className="text-xs text-muted">
                    {last
                      ? new Date(
                          last.date
                        ).toLocaleDateString(
                          "id-ID"
                        )
                      : "-"}
                  </p>

                  <Link
                    href={`/patient/${p.id}`}
                    className="text-blue-500 text-xs hover:underline"
                  >
                    Detail
                  </Link>

                </div>

              </div>

            </li>

          );
        })}

      </ul>

    </div>
  );
}