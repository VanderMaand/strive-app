"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { ECGMonitor } from "@/components/dashboard/ECGMonitor";
import { JointAngleGauge } from "@/components/dashboard/JointAngleGauge";
import { PatientHistory } from "@/components/dashboard/PatientHistory";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { RecoveryScore } from "@/components/dashboard/RecoveryScore";
import { Patient } from "@/lib/types";
import Link from "next/link";

type ApiStatus =
  | "loading"
  | "disconnected"
  | "empty"
  | "connected"
  | "error";

type DashboardData = {
  totalPatients: number;
  activeSessions: number;
  sessionId: number | null;
  therapyRunning: boolean;
  latestECG: number;
  latestFingerAngle: number;
  latestElbowAngle: number;
  latestRecoveryScore: number;
  latestRecoveryLevel: string;
  latestRecoveryRecommendation: string;
  latestAIRecommendation: string;
  latestAISource: string;
};

export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [status, setStatus] =
    useState<ApiStatus>("loading");

  const [message, setMessage] =
    useState<string>("");

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);
  
  const [activeSessionId, setActiveSessionId] =
  useState<number | null>(null);

  const [therapyRunning, setTherapyRunning] =
  useState(false);

async function startTherapy() {

  if (!selectedId) {

    alert(
      "Pilih pasien terlebih dahulu"
    );

    return;

  }

  try {

    const res = await fetch(
      "/api/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          patientId: Number(selectedId),
          stage: 1,
          notes: "Therapy started"
        })
      }
    );

    const data =
      await res.json();

    if (data.status === "ok") {

      setActiveSessionId(
        data.sessionId
      );

      setTherapyRunning(
        true
      );

      alert(
        `Sesi terapi #${data.sessionId} dimulai`
      );

    } else {

      alert(
        data.message ??
        "Gagal membuat sesi"
      );

    }

  }
  catch(error)
  {

    console.error(error);

  }

}
async function stopTherapy() {

  if (!activeSessionId) {

    alert(
      "Belum ada sesi aktif"
    );

    return;

  }

  try {

    const res = await fetch(
      "/api/sessions",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId:
            activeSessionId,
          notes:
            "Therapy finished"
        })
      }
    );

    const data =
      await res.json();

    if (data.status === "ok") {

      setTherapyRunning(
        false
      );

      setActiveSessionId(
        null
      );

      alert(
        "Sesi terapi selesai"
      );

    }

  }
  catch(error)
  {

    console.error(error);

  }

}
  
async function downloadPDF() {

   const res =
     await fetch(
       `/api/report/${selectedId}`
     );

   const data =
     await res.json();

   const { jsPDF } =
     await import("jspdf");

   const doc =
     new jsPDF();

   doc.text(
     "STRIVE Therapy Report",
     20,
     20
   );

   doc.text(
     `Nama: ${data.patient.full_name}`,
     20,
     40
   );

   doc.text(
     `Diagnosis: ${data.patient.diagnosis}`,
     20,
     50
   );

   doc.save(
     `report-patient-${selectedId}.pdf`
   );

}

  useEffect(() => {
    let cancelled = false;
  
  

    async function loadPatients() {
      try {
        const res =
          await fetch("/api/patients");

        const json =
          await res.json();

        if (cancelled) return;

        if (
          json.status ===
          "disconnected"
        ) {
          setStatus(
            "disconnected"
          );
          setMessage(
            json.message ?? ""
          );
          return;
        }

        if (
          json.status ===
          "error"
        ) {
          setStatus("error");
          setMessage(
            json.message ?? ""
          );
          return;
        }

        const list: Patient[] =
          json.patients ?? [];

        setPatients(list);

        setSelectedId(
          list[0]?.id ?? null
        );

        setStatus(
          list.length
            ? "connected"
            : "empty"
        );
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setMessage(
            (err as Error).message
          );
        }
      }
    }

    async function loadDashboard() {
      try {
        const res =
          await fetch(
            "/api/dashboard"
          );

        const json =
          await res.json();

        if (!cancelled) {
          setDashboard(json);
          setActiveSessionId(json.sessionId ?? null);
          setTherapyRunning(Boolean(json.therapyRunning));
        }
      } catch (error) {
        console.log(error);
        }
    }

    loadPatients();
    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <StatusScreen
        title="Memuat data pasien..."
        detail="Menghubungi PostgreSQL lewat API."
      />
    );
  }

  if (status === "disconnected") {
    return (
      <StatusScreen
        title="Belum terhubung ke database"
        detail={`${message} Isi DATABASE_URL di .env.local lalu restart Next.js`}
      />
    );
  }

  if (status === "error") {
    return (
      <StatusScreen
        title="Gagal mengambil data"
        detail={message}
      />
    );
  }


if (
  status === "empty" ||
  !selectedId
) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">

      <h2 className="text-2xl font-semibold">
        SELAMAT DATANG DI STRIVE MONITOR
      </h2>

      <p className="text-muted">
        Silakan registrasi pasien baru untuk memulai terapi.
      </p>

      <Link
        href="/register"
        className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
      >
        + Registrasi Pasien Baru
      </Link>

    </div>
  );
}
  const selected =
    patients.find(
      (p) => p.id === selectedId
    )!;

  const latestSession =
    selected.sessions[
      selected.sessions.length - 1
    ];

  return (
    <div className="mx-auto max-w-7xl">

     <Header
  patientName={selected.name}
  sessionLabel={
    latestSession
      ? `Sesi ${selected.sessions.length}`
      : "Belum ada sesi"
  }
/>

  <div className="flex gap-3 px-6 py-4">
  <button
    onClick={startTherapy}
    disabled={therapyRunning}
    className="
      rounded-lg
      bg-green-600
      px-4
      py-2
      text-white
      disabled:opacity-50
    "
  >
    Start Therapy
  </button>

  <button
    onClick={stopTherapy}
    disabled={!therapyRunning}
    className="
      rounded-lg
      bg-red-600
      px-4
      py-2
      text-white
      disabled:opacity-50
    "
  >
    Stop Therapy
  </button>

</div>

<main className="space-y-8 px-6 py-8 sm:px-8">

        {/* DASHBOARD SUMMARY */}

        <section>

          <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.16em] text-muted">
            STRIVE System Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-5">

            <SummaryCard
              title="Patients"
              value={
                dashboard?.totalPatients
              }
            />

            <SummaryCard
              title="Sessions"
              value={
                dashboard?.activeSessions
              }
            />

            <SummaryCard
              title="ECG"
              value={
                dashboard?.latestECG
              }
            />

            <SummaryCard
              title="Finger"
              value={
                dashboard?.latestFingerAngle
              }
              suffix="°"
            />

            <SummaryCard
              title="Elbow"
              value={
                dashboard?.latestElbowAngle
              }
              suffix="°"
            />

            <SummaryCard
              title="Recovery"
              value={
                dashboard?.latestRecoveryScore
              }
            />

          </div>

        </section>

        {/* REALTIME */}

        <section>

          <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.16em] text-muted">
            Monitoring Real-time
          </h2>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr_1fr]">

            <ECGMonitor
              sessionId={
                latestSession?.id ??
                selected.id
              }
            />

            <JointAngleGauge
              label="Sudut Jari"
              sessionId={
                latestSession?.id ??
                selected.id
              }
              field="finger_angle"
              max={90}
              accent="text-trace"
              strokeHex="#22D3C8"
            />

            <JointAngleGauge
              label="Sudut Siku"
              sessionId={
                latestSession?.id ??
                selected.id
              }
              field="elbow_angle"
              max={130}
              accent="text-leaf"
              strokeHex="#4ADE80"
            />

          </div>

        </section>

        {/* HISTORY + RECOVERY */}

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          <div className="lg:col-span-2 space-y-5">

            <PatientHistory
              patients={patients}
              selectedId={
                selectedId
              }
              onSelect={
                setSelectedId
              }
            />

            <div className="rounded-xl bg-surface p-5 shadow-panel">

              <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">
                Grafik Progres
              </p>

              {selected.sessions.length ? (
                <ProgressChart
                  sessions={
                    selected.sessions
                  }
                />
              ) : (
                <p className="py-8 text-center text-sm text-muted">
                  Belum ada sesi.
                </p>
              )}

            </div>

          </div>

        <div className="space-y-5">

  {latestSession ? (
    <RecoveryScore
      session={latestSession}
    />
  ) : (
    <div className="rounded-xl bg-surface p-6 text-sm text-muted shadow-panel">
      Recovery Score belum tersedia.
    </div>
  )}

  <div className="rounded-xl bg-surface p-6 shadow-panel">

    <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">
      AI Recommendation
    </p>

    <p className="text-sm leading-relaxed">
      {dashboard?.latestAIRecommendation ??
        "Belum ada rekomendasi AI"}
    </p>

    <p className="mt-4 text-xs text-muted">
      Source: {dashboard?.latestAISource ?? "-"}
    </p>

  </div>

</div>
        </section>

      </main>

      <footer className="border-t border-surface-line px-6 py-5 text-center text-xs text-muted sm:px-8">
        STRIVE Monitor · Universitas Negeri Yogyakarta
      </footer>

    </div>
  );
}

function SummaryCard({
  title,
  value,
  suffix = ""
}: {
  title: string;
  value: any;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-5 shadow-panel">
      <p className="text-xs text-muted">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value ?? "-"}
        {suffix}
      </p>
    </div>
  );
}

function StatusScreen({
  title,
  detail
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">

      <div className="max-w-md rounded-xl bg-surface p-8 text-center shadow-panel">

        <p className="mb-2 font-mono text-sm uppercase tracking-[0.16em] text-trace">
          STRIVE Monitor
        </p>

        <h1 className="mb-3 text-lg font-medium text-ink">
          {title}
        </h1>

        <p className="text-sm leading-relaxed text-muted">
          {detail}
        </p>

      </div>

    </div>
  );
}