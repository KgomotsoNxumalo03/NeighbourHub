"use client";

import { FormEvent, useEffect, useState } from "react";
import { Search, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/client-auth";
import { lostFoundStatuses, lostFoundTypes } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { LostFoundReport } from "@/lib/types";
import { getStoredCommunityId } from "@/lib/community";
import { Select } from "@/components/ui";

export default function LostFoundPage() {
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [reports, setReports] = useState<LostFoundReport[]>([]);
  const [draft, setDraft] = useState({ type: "Lost pet", title: "", description: "", location: "", imageName: "", contactPreference: "" });

  async function loadReports() {
    const response = await fetch(`/api/lost-found?communityId=${communityId}`);
    const data = await response.json();
    setReports(data.reports || []);
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function createReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const response = await fetch("/api/lost-found", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, communityId, reporterId: user.id, reporterName: user.name }),
    });
    if (response.ok) {
      setDraft({ type: "Lost pet", title: "", description: "", location: "", imageName: "", contactPreference: "" });
      await loadReports();
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/lost-found", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await loadReports();
  }

  return (
    <AppShell allowedRoles={["resident", "admin"]}>
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#006B3C]">Community help</p>
        <h1 className="mt-1 text-3xl font-bold">Lost and found</h1>
        <p className="mt-2 text-sm text-zinc-600">Report missing pets, found pets, lost items, and found items.</p>
      </div>
      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form onSubmit={createReport} className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Create report</h2>
          <Select className="mt-4" value={draft.type} onChange={(value) => setDraft({ ...draft, type: value })} options={lostFoundTypes} />
          <input required className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          <textarea required className="mt-3 min-h-24 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          <input required className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Location" value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} />
          <input className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Image placeholder" value={draft.imageName} onChange={(event) => setDraft({ ...draft, imageName: event.target.value })} />
          <input required className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Contact preference" value={draft.contactPreference} onChange={(event) => setDraft({ ...draft, contactPreference: event.target.value })} />
          <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#006B3C] px-4 py-3 text-sm font-bold text-white hover:bg-[#00522f]"><Send size={17} />Submit report</button>
        </form>
        <div className="grid gap-4 md:grid-cols-2">
          {reports.map((report) => (
            <article key={report.id} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-full bg-[#C8A23A]/15 px-2 py-1 text-xs font-bold text-[#7A5C08]">{report.type}</span>
                  <h2 className="mt-3 text-lg font-bold">{report.title}</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-[#006B3C]">{report.status}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{report.description}</p>
              <p className="mt-3 text-sm text-zinc-500">{report.location} / {report.contactPreference}</p>
              {report.imageName && <p className="mt-3 rounded-lg bg-[#F7F8FA] p-3 text-sm font-semibold text-zinc-700">Image: {report.imageName}</p>}
              <p className="mt-3 text-xs text-zinc-400">{report.reporterName} / {formatDate(report.createdAt)}</p>
              {(user?.role === "admin" || user?.id === report.reporterId) && (
                <Select className="mt-4" value={report.status} onChange={(value) => updateStatus(report.id, value)} options={lostFoundStatuses} />
              )}
            </article>
          ))}
          {reports.length === 0 && <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600"><Search className="mb-3 text-[#006B3C]" />No lost and found reports yet.</p>}
        </div>
      </section>
    </AppShell>
  );
}
