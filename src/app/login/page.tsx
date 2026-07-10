"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { LogIn, MapPin } from "lucide-react";
import { saveCurrentUser } from "@/lib/client-auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("resident@neighbourhub.local");
  const [password, setPassword] = useState("resident123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        const user = data.session?.user;
        if (user) router.replace(user.role === "admin" || user.role === "super-admin" ? "/admin" : "/dashboard");
      })
      .catch(() => undefined);
  }, [router]);

  function fillDemo(role: "resident" | "admin") {
    if (role === "admin") {
      setEmail("admin@neighbourhub.local");
      setPassword("admin123");
      return;
    }

    setEmail("resident@neighbourhub.local");
    setPassword("resident123");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.message || "Unable to sign in.");
      return;
    }

    saveCurrentUser(data.user);
    router.push(data.user.role === "admin" || data.user.role === "super-admin" ? "/admin" : "/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-200/70">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#006B3C] text-white">
            <MapPin size={20} />
          </span>
          <span className="text-xl font-bold">NeighbourHub</span>
        </Link>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-zinc-600">Sign in as a resident or admin to continue.</p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => fillDemo("resident")} className="rounded-lg border border-zinc-200 bg-[#F7F8FA] px-3 py-2 text-sm font-bold text-zinc-700 hover:border-[#C8A23A]">
            Resident demo
          </button>
          <button type="button" onClick={() => fillDemo("admin")} className="rounded-lg border border-zinc-200 bg-[#F7F8FA] px-3 py-2 text-sm font-bold text-zinc-700 hover:border-[#C8A23A]">
            Admin demo
          </button>
        </div>

        <label className="mt-6 block text-sm font-semibold">Email</label>
        <input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm shadow-sm" type="email" />

        <label className="mt-4 block text-sm font-semibold">Password</label>
        <input value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm shadow-sm" type="password" />

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

        <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#006B3C] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#00522f] disabled:opacity-60">
          <LogIn size={18} />
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p className="mt-5 text-center text-sm text-zinc-600">
          Need an account? <Link href="/register" className="font-bold text-[#006B3C]">Register here</Link>
        </p>
      </form>
    </main>
  );
}
