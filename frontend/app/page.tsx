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
  patientId: number | null;
  patientSessions: number;
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

  // ⬇️ TAMBAHAN: state untuk modal "Tambah Pasien"
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [addPatientLoading, setAddPatientLoading] = useState(false);
  const [addPatientError, setAddPatientError] = useState("");

  async function startTherapy() {
    if (!selectedId) {
      alert("Pilih pasien terlebih dahulu");
      return;
    }

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: Number(selectedId),
          stage: 1,
          notes: "Therapy started",
        }),
      });

      const data = await res.json();

      if (data.status === "ok") {
        setActiveSessionId(data.sessionId);
        setTherapyRunning(true);
        // ⬇️ DIPERBAIKI: tampilkan nomor urut sesi milik pasien ini,
        // bukan id database global (yang dihitung lintas semua pasien)
        const sessionNumber = (dashboard?.patientSessions ?? 0) + 1;
        alert(`Sesi terapi ke-${sessionNumber} untuk pasien ini dimulai`);
        await loadDashboard(selectedId);
      } else if (res.status === 409) {
        setActiveSessionId(data.sessionId);
        setTherapyRunning(true);
        alert(data.message);
      } else {
        alert(data.message ?? "Gagal membuat sesi");
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function stopTherapy() {
    if (!activeSessionId) {
      alert("Belum ada sesi aktif");
      return;
    }

    try {
      const res = await fetch("/api/sessions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: activeSessionId,
          notes: "Therapy finished",
        }),
      });

      const data = await res.json();

      if (data.status === "ok") {
        setTherapyRunning(false);
        setActiveSessionId(null);
        alert("Sesi terapi selesai");
        if (selectedId) await loadDashboard(selectedId);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function downloadPDF() {
    const res = await fetch(`/api/report/${selectedId}`);
    const data = await res.json();

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    doc.text("STRIVE Therapy Report", 20, 20);
    doc.text(`Nama: ${data.patient.full_name}`, 20, 40);
    doc.text(`Diagnosis: ${data.patient.diagnosis}`, 20, 50);

    doc.save(`report-patient-${selectedId}.pdf`);
  }

  // Diambil keluar dari useEffect supaya bisa dipanggil ulang
  // (misal setelah tambah pasien baru, atau setelah start/stop therapy)
  async function loadPatients(selectNewestId?: string) {
    try {
      const res = await fetch("/api/patients");
      const json = await res.json();

      if (json.status === "disconnected") {
        setStatus("disconnected");
        setMessage(json.message ?? "");
        return;
      }

      if (json.status === "error") {
        setStatus("error");
        setMessage(json.message ?? "");
        return;
      }

      const list: Patient[] = json.patients ?? [];

      setPatients(list);

      if (selectNewestId) {
        setSelectedId(selectNewestId);
      } else {
        setSelectedId((prev) => prev ?? list[0]?.id ?? null);
      }

      setStatus(list.length ? "connected" : "empty");
    } catch (err) {
      setStatus("error");
      setMessage((err as Error).message);
    }
  }

  async function loadDashboard(patientId: string) {
    try {
      const res = await fetch(`/api/dashboard?patientId=${patientId}`);
      const json = await res.json();

      setDashboard(json);
      setActiveSessionId(json.sessionId ?? null);
      setTherapyRunning(Boolean(json.therapyRunning));
    } catch (error) {
      console.log(error);
    }
  }

  // ⬇️ TAMBAHAN: submit form tambah pasien baru
  async function handleAddPatient(form: {
    name: string;
    age: string;
    gender: string;
    diagnosis: string;
  }) {
    setAddPatientLoading(true);
    setAddPatientError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          age: form.age ? Number(form.age) : null,
          gender: form.gender,
          diagnosis: form.diagnosis,
        }),
      });

      const data = await res.json();

      if (data.status === "ok") {
        setShowAddPatient(false);
        // reload daftar pasien, langsung pilih pasien yang baru dibuat
        await loadPatients(String(data.patientId));
      } else {
        setAddPatientError(data.message ?? "Gagal menambahkan pasien.");
      }
    } catch (error) {
      setAddPatientError((error as Error).message);
    } finally {
      setAddPatientLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (cancelled) return;
      await loadPatients();
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  // Reload dashboard setiap kali pasien yang dipilih berubah
  useEffect(() => {
    if (!selectedId) return;

    let cancelled = false;

    async function run() {
      if (cancelled || !selectedId) return;
      await loadDashboard(selectedId);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

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
    return <StatusScreen title="Gagal mengambil data" detail={message} />;
  }

  if (status === "empty" || !selectedId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-semibold">
          SELAMAT DATANG DI STRIVE MONITOR
        </h2>

        <p className="text-muted">
          Silakan registrasi pasien baru untuk memulai terapi.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => setShowAddPatient(true)}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            + Tambah Pasien Baru
          </button>

          <Link
            href="/register"
            className="rounded-lg border border-surface-line px-6 py-3 text-ink hover:bg-surface"
          >
            Halaman Registrasi Lengkap
          </Link>
        </div>

        {showAddPatient && (
          <AddPatientModal
            loading={addPatientLoading}
            error={addPatientError}
            onCancel={() => setShowAddPatient(false)}
            onSubmit={handleAddPatient}
          />
        )}
      </div>
    );
  }

  const selected = patients.find((p) => p.id === selectedId)!;

  const latestSession = selected.sessions[selected.sessions.length - 1];

  return (
    <div className="mx-auto max-w-7xl">
      <Header
        patientName={selected.name}
        sessionLabel={
          latestSession ? `Sesi ${selected.sessions.length}` : "Belum ada sesi"
        }
      />

      <div className="flex flex-wrap items-center gap-3 px-6 py-4">
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

        {/* ⬇️ TAMBAHAN: tombol buka modal tambah pasien, langsung dari dashboard */}
        <button
          onClick={() => setShowAddPatient(true)}
          className="
            rounded-lg
            border
            border-surface-line
            px-4
            py-2
            text-ink
            hover:bg-surface
          "
        >
          + Tambah Pasien
        </button>
      </div>

      <main className="space-y-8 px-6 py-8 sm:px-8">
        {/* DASHBOARD SUMMARY */}
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.16em] text-muted">
            STRIVE System Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-5">
            <SummaryCard title="Patient ID" value={dashboard?.patientId} />

            <SummaryCard title="Sessions" value={dashboard?.patientSessions} />

            <SummaryCard title="ECG" value={dashboard?.latestECG} />

            <SummaryCard
              title="Finger"
              value={dashboard?.latestFingerAngle}
              suffix="°"
            />

            <SummaryCard
              title="Elbow"
              value={dashboard?.latestElbowAngle}
              suffix="°"
            />

            <SummaryCard
              title="Recovery"
              value={dashboard?.latestRecoveryScore}
            />
          </div>
        </section>

        {/* REALTIME */}
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.16em] text-muted">
            Monitoring Real-time
          </h2>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr_1fr]">
            <ECGMonitor sessionId={latestSession?.id ?? null} />

            <JointAngleGauge
              label="Sudut Jari"
              sessionId={latestSession?.id ?? null}
              field="finger_angle"
              max={90}
              accent="text-trace"
              strokeHex="#22D3C8"
            />

            <JointAngleGauge
              label="Sudut Siku"
              sessionId={latestSession?.id ?? null}
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
              selectedId={selectedId}
              onSelect={setSelectedId}
            />

            <div className="rounded-xl bg-surface p-5 shadow-panel">
              <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">
                Grafik Progres
              </p>

              {selected.sessions.length ? (
                <ProgressChart sessions={selected.sessions} />
              ) : (
                <p className="py-8 text-center text-sm text-muted">
                  Belum ada sesi.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-5">
            {latestSession ? (
              <RecoveryScore session={latestSession} />
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

      {showAddPatient && (
        <AddPatientModal
          loading={addPatientLoading}
          error={addPatientError}
          onCancel={() => setShowAddPatient(false)}
          onSubmit={handleAddPatient}
        />
      )}
    </div>
  );
}

// ⬇️ TAMBAHAN: komponen modal form tambah pasien
function AddPatientModal({
  loading,
  error,
  onCancel,
  onSubmit,
}: {
  loading: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (form: {
    name: string;
    age: string;
    gender: string;
    diagnosis: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Laki-laki");
  const [diagnosis, setDiagnosis] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name, age, gender, diagnosis });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-panel">
        <h2 className="mb-4 text-lg font-semibold text-ink">
          Tambah Pasien Baru
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted">
              Nama Lengkap
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-surface-line bg-transparent px-3 py-2 text-ink"
              placeholder="Nama pasien"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Usia</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full rounded-lg border border-surface-line bg-transparent px-3 py-2 text-ink"
                placeholder="55"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted">
                Jenis Kelamin
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border border-surface-line bg-transparent px-3 py-2 text-ink"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Diagnosis</label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-surface-line bg-transparent px-3 py-2 text-ink"
              placeholder="Misal: Stroke ringan, hemiparesis kanan"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-lg border border-surface-line px-4 py-2 text-ink hover:bg-surface-alt disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Pasien"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  suffix = "",
}: {
  title: string;
  value: any;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-5 shadow-panel">
      <p className="text-xs text-muted">{title}</p>

      <p className="mt-2 text-3xl font-bold">
        {value ?? "-"}
        {suffix}
      </p>
    </div>
  );
}

function StatusScreen({
  title,
  detail,
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

        <h1 className="mb-3 text-lg font-medium text-ink">{title}</h1>

        <p className="text-sm leading-relaxed text-muted">{detail}</p>
      </div>
    </div>
  );
}
