export type VitalsSample = {
  t: number; // ms timestamp offset
  ecg: number; // millivolt-scale reading
  fingerAngle: number; // degrees, 0-90
  elbowAngle: number; // degrees, 0-130
};

export type TherapySession = {
  id: string;
  date: string; // ISO date
  durationMin: number;
  fingerMovement: number; // %
  elbowMovement: number; // %
  consistency: number; // %
};

export type Patient = {
  id: string;
  name: string;
  diagnosis: string;
  sessionsCompleted: number;
  lastSession: string;
  sessions: TherapySession[];
};

export function recoveryScore(s: {
  fingerMovement: number;
  elbowMovement: number;
  consistency: number;
}) {
  // Weighted composite: gerakan halus (jari) dan gerakan besar (siku)
  // ditimbang sedikit lebih rendah dari konsistensi, karena konsistensi
  // latihan adalah prediktor pemulihan jangka panjang yang paling stabil.
  const raw =
    s.fingerMovement * 0.35 + s.elbowMovement * 0.35 + s.consistency * 0.3;
  return Math.round(raw * 10) / 10;
}
