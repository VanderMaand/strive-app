"use client";

import { useState } from "react";

export default function NewUserPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("therapist");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, role }),
    });
    const data = await res.json();

    if (data.status === "ok") {
      setMessage(`User berhasil dibuat (id: ${data.userId})`);
      setFullName("");
      setEmail("");
      setPassword("");
    } else {
      setMessage(data.message ?? "Gagal membuat user");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl bg-surface p-8 shadow-panel"
      >
        <h1 className="text-lg font-semibold">Tambah User Baru</h1>

        <input
          placeholder="Nama Lengkap"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="therapist">Terapis</option>
          <option value="admin">Admin</option>
        </select>

        {message && <p className="text-sm">{message}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Buat User
        </button>
      </form>
    </div>
  );
}