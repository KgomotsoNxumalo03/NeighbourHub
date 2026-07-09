"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Flame, Phone, PhoneCall, ShieldAlert, Siren, Stethoscope } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/client-auth";
import { emergencyTypes } from "@/lib/constants";
import type { EmergencyContact } from "@/lib/types";
import { getStoredCommunityId } from "@/lib/community";

const emergencyIcons = {
  Security: ShieldAlert,
  Medical: Stethoscope,
  Fire: Flame,
  Police: Siren,
  "Suspicious activity": AlertTriangle,
};

export default function EmergencyPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [selected, setSelected] = useState(emergencyTypes[0]);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/contacts?communityId=${communityId}`).then((res) => res.json()).then((data) => setContacts(data.contacts || []));
  }, [communityId]);

  async function submitEmergency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    if (!location.trim() || !description.trim()) {
      setError("Please add the location and a short description.");
      return;
    }

    setLoading(true);
    setError("");
    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        communityId,
        residentName: user.name,
        title: selected.title,
        description: description.trim(),
        category: selected.category,
        priority: "Emergency",
        location: location.trim(),
        imageName: "Emergency report placeholder",
        imagePreview: "Emergency report placeholder",
      }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.message || "Unable to submit emergency report.");
      return;
    }

    router.push(`/tickets/${data.ticket.id}`);
  }

  return (
    <AppShell allowedRoles={["resident", "admin"]}>
      <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-6 text-red-950 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-600 text-white">
              <Siren size={24} />
            </span>
            <div>
              <p className="text-sm font-bold text-red-700">Emergency reporting</p>
              <h1 className="mt-1 text-3xl font-bold">Report urgent neighbourhood incidents</h1>
            </div>
          </div>
          <a href="tel:10111" className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-700">
            <PhoneCall size={18} />
            Call emergency services
          </a>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <form onSubmit={submitEmergency} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Quick emergency ticket</h2>
          <p className="mt-1 text-sm text-zinc-600">This creates an emergency-priority ticket visible to admins immediately.</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {emergencyTypes.map((type) => {
              const Icon = emergencyIcons[type.label as keyof typeof emergencyIcons];
              const active = selected.label === type.label;
              return (
                <button
                  type="button"
                  key={type.label}
                  onClick={() => setSelected(type)}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left text-sm font-bold ${
                    active ? "border-red-300 bg-red-50 text-red-800 ring-2 ring-red-100" : "border-zinc-200 bg-[#F7F8FA] text-zinc-800 hover:border-[#C8A23A]"
                  }`}
                >
                  <Icon size={20} />
                  {type.label}
                </button>
              );
            })}
          </div>

          <label className="mt-5 block text-sm font-semibold">Location</label>
          <input value={location} onChange={(event) => setLocation(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Gate, street, block, or nearest landmark" />

          <label className="mt-5 block text-sm font-semibold">What is happening?</label>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-28 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Keep it short and clear so responders can act quickly" />

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

          <button disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-60">
            <Siren size={18} />
            {loading ? "Submitting emergency..." : "Submit emergency report"}
          </button>
        </form>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Emergency contacts</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {contacts.map((contact) => (
              <article key={contact.id} className="rounded-lg border border-zinc-100 bg-[#F7F8FA] p-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-bold">{contact.name}</h3>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C8A23A]/20 text-[#006B3C]">
                    <Phone size={18} />
                  </span>
                </div>
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="mt-3 block text-xl font-bold text-[#006B3C]">
                  {contact.phone}
                </a>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{contact.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
