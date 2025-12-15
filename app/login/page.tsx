"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const sp = useSearchParams();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: pw, next: sp.get("next") || "/catalog" }),
    });

    if (!res.ok) {
      setErr("Грешна парола.");
      return;
    }

    const data = await res.json();
    window.location.href = data.redirectTo;
  }

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Индивидуална поръчка</h1>
      <p style={{ opacity: 0.8, marginTop: 0 }}>Заявка #0146</p>

      <form onSubmit={submit} style={{ marginTop: 20 }}>
        <label style={{ display: "block", marginBottom: 8 }}>Парола</label>
        <input
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          type="password"
          style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
          placeholder="••••••••"
        />
        {err && <p style={{ color: "crimson", marginTop: 10 }}>{err}</p>}
        <button type="submit" style={{ marginTop: 14, width: "100%", padding: 12, borderRadius: 10, border: 0 }}>
          Вход
        </button>
      </form>
    </main>
  );
}
