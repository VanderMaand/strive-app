import { Patient } from "../lib/types";

export const patients: Patient[] = [
  {
    id: "PT-001",
    name: "Bapak Suherman",
    diagnosis: "Stroke iskemik, hemiparesis kanan",
    sessionsCompleted: 8,
    lastSession: "2026-08-01",
    sessions: [
      { id: "S1", date: "2026-07-10", durationMin: 18, fingerMovement: 42, elbowMovement: 38, consistency: 60 },
      { id: "S2", date: "2026-07-14", durationMin: 20, fingerMovement: 48, elbowMovement: 44, consistency: 65 },
      { id: "S3", date: "2026-07-18", durationMin: 22, fingerMovement: 55, elbowMovement: 49, consistency: 70 },
      { id: "S4", date: "2026-07-22", durationMin: 22, fingerMovement: 58, elbowMovement: 52, consistency: 74 },
      { id: "S5", date: "2026-07-26", durationMin: 25, fingerMovement: 63, elbowMovement: 56, consistency: 78 },
      { id: "S6", date: "2026-07-29", durationMin: 25, fingerMovement: 67, elbowMovement: 58, consistency: 82 },
      { id: "S7", date: "2026-08-01", durationMin: 27, fingerMovement: 70, elbowMovement: 60, consistency: 85 },
    ],
  },
  {
    id: "PT-002",
    name: "Ibu Wulandari",
    diagnosis: "Stroke iskemik, hemiparesis kiri ringan",
    sessionsCompleted: 5,
    lastSession: "2026-07-30",
    sessions: [
      { id: "S1", date: "2026-07-12", durationMin: 15, fingerMovement: 50, elbowMovement: 45, consistency: 66 },
      { id: "S2", date: "2026-07-17", durationMin: 18, fingerMovement: 54, elbowMovement: 50, consistency: 70 },
      { id: "S3", date: "2026-07-22", durationMin: 20, fingerMovement: 59, elbowMovement: 55, consistency: 75 },
      { id: "S4", date: "2026-07-26", durationMin: 21, fingerMovement: 63, elbowMovement: 58, consistency: 79 },
      { id: "S5", date: "2026-07-30", durationMin: 23, fingerMovement: 68, elbowMovement: 62, consistency: 83 },
    ],
  },
  {
    id: "PT-003",
    name: "Bapak Ahmad Zaini",
    diagnosis: "Stroke hemoragik, kelemahan ekstremitas atas kanan",
    sessionsCompleted: 3,
    lastSession: "2026-07-28",
    sessions: [
      { id: "S1", date: "2026-07-18", durationMin: 12, fingerMovement: 30, elbowMovement: 28, consistency: 50 },
      { id: "S2", date: "2026-07-23", durationMin: 14, fingerMovement: 35, elbowMovement: 33, consistency: 56 },
      { id: "S3", date: "2026-07-28", durationMin: 16, fingerMovement: 40, elbowMovement: 37, consistency: 61 },
    ],
  },
];
