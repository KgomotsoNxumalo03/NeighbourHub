"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { MapPin, UserPlus } from "lucide-react";
import { getCurrentUser, saveCurrentUser } from "@/lib/client-auth";
import type { Community, ResidentAddress } from "@/lib/types";
import { addressFieldsForType } from "@/lib/community";
import { Select } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communityId, setCommunityId] = useState("community-oakridge");
  const [address, setAddress] = useState<ResidentAddress>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) router.replace(user.role === "admin" || user.role === "super-admin" ? "/admin" : "/dashboard");
    fetch("/api/communities").then((res) => res.json()).then((data) => setCommunities(data.communities || []));
  }, [router]);

  const selectedCommunity = communities.find((community) => community.id === communityId);
  const addressFields = selectedCommunity ? addressFieldsForType(selectedCommunity.communityType) : [];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, communityId, address }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.message || "Unable to register.");
      return;
    }

    saveCurrentUser(data.user);
    router.push("/dashboard");
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
        <h1 className="text-2xl font-bold">Create resident account</h1>
        <p className="mt-2 text-sm text-zinc-600">Register for the Oakridge Estate neighbourhood portal.</p>

        <label className="mt-6 block text-sm font-semibold">Full name</label>
        <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm shadow-sm" required />

        <label className="mt-4 block text-sm font-semibold">Email</label>
        <input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm shadow-sm" type="email" required />

        <label className="mt-4 block text-sm font-semibold">Password</label>
        <input value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm shadow-sm" type="password" required minLength={6} />

        <label className="mt-4 block text-sm font-semibold">Community</label>
        <Select className="mt-2" value={communityId} onChange={(value) => { setCommunityId(value); setAddress({}); }} options={communities.map((community) => ({ label: `${community.name} / ${community.communityType}`, value: community.id }))} />

        {addressFields.map((field) => (
          <div key={field}>
            <label className="mt-4 block text-sm font-semibold">{field.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}</label>
            <input value={String(address[field as keyof ResidentAddress] || "")} onChange={(event) => setAddress({ ...address, [field]: event.target.value })} className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm shadow-sm" required />
          </div>
        ))}

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

        <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#006B3C] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#00522f] disabled:opacity-60">
          <UserPlus size={18} />
          {loading ? "Creating account..." : "Register"}
        </button>
        <p className="mt-5 text-center text-sm text-zinc-600">
          Already registered? <Link href="/login" className="font-bold text-[#006B3C]">Log in</Link>
        </p>
      </form>
    </main>
  );
}
