"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/client-auth";
import { ticketCategoryGroups, ticketPriorities } from "@/lib/constants";
import { getStoredCommunityId } from "@/lib/community";
import type { Ticket } from "@/lib/types";
import { Select } from "@/components/ui";

export default function NewTicketPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "General complaint",
    priority: "Medium",
    location: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [similarTickets, setSimilarTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      setError("Please complete the title, description, and location.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const photoData = photo ? await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Unable to read the photo."));
        reader.readAsDataURL(photo);
      }) : undefined;
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photoData, imageName: photo?.name, communityId, userId: user.id, residentName: user.name }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Unable to create ticket.");
        return;
      }
      setSuccess(`Ticket ${data.ticket.reference} created.`);
      router.push(`/tickets/${data.ticket.id}`);
    } catch {
      setError("Unable to submit the report. Check your connection and photo, then try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!form.title.trim() && !form.location.trim()) {
      setSimilarTickets([]);
      return;
    }
    fetch(`/api/tickets?communityId=${communityId}&category=${encodeURIComponent(form.category)}`).then((res) => res.json()).then((data) => {
      const query = `${form.title} ${form.location}`.toLowerCase();
      setSimilarTickets((data.tickets || []).filter((ticket: Ticket) => `${ticket.title} ${ticket.location}`.toLowerCase().split(" ").some((word: string) => word.length > 3 && query.includes(word))).slice(0, 3));
    });
  }, [form.title, form.location, form.category, communityId]);

  async function supportTicket(id: string) {
    if (!user) return;
    await fetch("/api/tickets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "support", actorId: user.id, actorName: user.name, actorRole: user.role }) });
    router.push(`/tickets/${id}`);
  }

  return (
    <AppShell allowedRoles={["resident"]}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="text-sm font-semibold text-[#006B3C]">Resident ticket</p>
          <h1 className="mt-1 text-3xl font-bold">Log a new ticket</h1>
          <p className="mt-2 text-sm text-zinc-600">Add the details your neighbourhood team needs to triage the issue.</p>
        </div>

        <form onSubmit={submit} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <label className="block text-sm font-semibold">Title</label>
          <input className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />

          <label className="mt-5 block text-sm font-semibold">Description</label>
          <textarea className="mt-2 min-h-32 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold">Category</label>
              <Select className="mt-2" value={form.category} onChange={(value) => setForm({ ...form, category: value })} groups={ticketCategoryGroups.map((group) => ({ label: group.label, options: group.categories }))} />
            </div>
            <div>
              <label className="block text-sm font-semibold">Priority</label>
              <Select className="mt-2" value={form.priority} onChange={(value) => setForm({ ...form, priority: value })} options={ticketPriorities} />
            </div>
          </div>

          <label className="mt-5 block text-sm font-semibold">Location / address</label>
          <input className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required />

          <label htmlFor="ticket-photo" className="mt-5 block text-sm font-semibold">Photo (optional)</label>
          <p id="ticket-photo-help" className="mt-1 text-sm text-zinc-600">JPG, PNG or WebP, up to 2 MB.</p>
          <div className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-zinc-300 bg-[#F7F8FA] p-4">
            <ImagePlus aria-hidden="true" className="text-[#006B3C]" />
            <input id="ticket-photo" aria-describedby="ticket-photo-help" type="file" accept="image/jpeg,image/png,image/webp" className="w-full bg-transparent text-sm" onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file && (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024)) {
                event.currentTarget.value = "";
                setPhoto(null);
                setError("Choose a JPG, PNG or WebP photo up to 2 MB.");
                return;
              }
              setPhoto(file ?? null);
              setError("");
            }} />
          </div>

          {similarTickets.length > 0 && (
            <div className="mt-5 rounded-lg border border-[#C8A23A]/40 bg-[#C8A23A]/10 p-4">
              <p className="font-bold text-[#6C5107]">Possible similar tickets</p>
              <div className="mt-3 space-y-2">
                {similarTickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-lg bg-white p-3 text-sm">
                    <Link href={`/tickets/${ticket.id}`} className="font-bold text-[#006B3C]">{ticket.reference}: {ticket.title}</Link>
                    <p className="mt-1 text-zinc-600">{ticket.location} / {ticket.supporters?.length || 0} residents affected</p>
                    <button type="button" onClick={() => supportTicket(ticket.id)} className="mt-2 rounded-lg bg-[#006B3C] px-3 py-2 text-xs font-bold text-white">Support this instead</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
          {success && <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"><CheckCircle2 size={16} />{success}</p>}

          <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#006B3C] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#00522f] disabled:opacity-60">
            <Send size={18} />
            {loading ? "Creating ticket..." : "Submit ticket"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
