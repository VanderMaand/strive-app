"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {

  const router = useRouter();

  const [name,setName] = useState("");
  const [age,setAge] = useState("");
  const [gender,setGender] = useState("Laki-laki");
  const [diagnosis,setDiagnosis] = useState("Stroke Iskemik");

  async function submitPatient() {

    const res = await fetch(
      "/api/register",
      {
        method: "POST",
        headers: {
          "Content-Type":"application/json"
        },
        body: JSON.stringify({
          name,
          age,
          gender,
          diagnosis
        })
      }
    );

    const data = await res.json();

    if(data.status === "ok") {

  router.push("/");

  }

  }

  return (

    <main className="mx-auto max-w-xl p-8">

      <h1 className="mb-6 text-3xl font-bold">
        Registrasi Pasien STRIVE
      </h1>

      <div className="space-y-4">

        <input
          className="w-full border p-3"
          placeholder="Nama Pasien"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          className="w-full border p-3"
          placeholder="Umur"
          value={age}
          onChange={(e)=>setAge(e.target.value)}
        />

        <select
          className="w-full border p-3"
          value={gender}
          onChange={(e)=>setGender(e.target.value)}
        >
          <option>Laki-laki</option>
          <option>Perempuan</option>
        </select>

        <select
          className="w-full border p-3"
          value={diagnosis}
          onChange={(e)=>setDiagnosis(e.target.value)}
        >
          <option>Stroke Iskemik</option>
          <option>Stroke Hemoragik</option>
        </select>

        <button
          onClick={submitPatient}
          className="rounded bg-blue-600 px-6 py-3 text-white"
        >
          Simpan & Mulai Terapi
        </button>

      </div>

    </main>

  );

}