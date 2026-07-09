"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Pin, Search, ShieldCheck, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { lostFoundStatuses } from "@/lib/constants";
import type { CommunityEvent, CommunityPost, LostFoundReport } from "@/lib/types";
import { getCurrentUser } from "@/lib/client-auth";
import { getStoredCommunityId } from "@/lib/community";
import { Select } from "@/components/ui";

export default function CommunityModerationPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [reports, setReports] = useState<LostFoundReport[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);

  async function loadAll() {
    const [feedRes, lostRes, eventsRes] = await Promise.all([
      fetch(`/api/feed?communityId=${communityId}`),
      fetch(`/api/lost-found?communityId=${communityId}`),
      fetch(`/api/events?communityId=${communityId}`),
    ]);
    setPosts((await feedRes.json()).posts || []);
    setReports((await lostRes.json()).reports || []);
    setEvents((await eventsRes.json()).events || []);
  }

  useEffect(() => {
    loadAll();
  }, [communityId]);

  async function moderatePost(id: string, action: string, pinned?: boolean) {
    await fetch("/api/feed", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, pinned }),
    });
    await loadAll();
  }

  async function updateReport(id: string, status: string) {
    await fetch("/api/lost-found", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await loadAll();
  }

  async function deleteEvent(id: string) {
    await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "delete" }),
    });
    await loadAll();
  }

  return (
    <AppShell allowedRoles={["admin"]}>
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#006B3C]">Admin moderation</p>
        <h1 className="mt-1 text-3xl font-bold">Community tools</h1>
        <p className="mt-2 text-sm text-zinc-600">Review posts, manage lost and found reports, and maintain community events.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-[#006B3C]" />
            <h2 className="text-lg font-bold">Community posts</h2>
          </div>
          <div className="mt-4 space-y-3">
            {posts.map((post) => (
              <article key={post.id} className="rounded-lg bg-[#F7F8FA] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {post.pinned && <span className="rounded-full bg-[#C8A23A]/15 px-2 py-1 text-xs font-bold text-[#7A5C08]">Pinned</span>}
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-zinc-600">{post.type}</span>
                </div>
                <p className="mt-3 font-bold">{post.title}</p>
                <p className="mt-1 text-sm text-zinc-600">{post.authorName}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => moderatePost(post.id, "pin", !post.pinned)} className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-bold ring-1 ring-zinc-200"><Pin size={13} />{post.pinned ? "Unpin" : "Pin"}</button>
                  <button onClick={() => moderatePost(post.id, "delete")} className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-bold text-red-700 ring-1 ring-red-200"><Trash2 size={13} />Remove</button>
                </div>
              </article>
            ))}
            {posts.length === 0 && <p className="rounded-lg bg-[#F7F8FA] p-4 text-sm text-zinc-600">No posts to review.</p>}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Search className="text-[#006B3C]" />
            <h2 className="text-lg font-bold">Lost and found</h2>
          </div>
          <div className="mt-4 space-y-3">
            {reports.map((report) => (
              <article key={report.id} className="rounded-lg bg-[#F7F8FA] p-4">
                <p className="font-bold">{report.title}</p>
                <p className="mt-1 text-sm text-zinc-600">{report.type} / {report.location}</p>
                <Select className="mt-3" value={report.status} onChange={(value) => updateReport(report.id, value)} options={lostFoundStatuses} />
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="text-[#006B3C]" />
              <h2 className="text-lg font-bold">Events</h2>
            </div>
            <Link href="/events" className="text-sm font-bold text-[#006B3C]">Create</Link>
          </div>
          <div className="mt-4 space-y-3">
            {events.map((event) => (
              <article key={event.id} className="rounded-lg bg-[#F7F8FA] p-4">
                <p className="font-bold">{event.title}</p>
                <p className="mt-1 text-sm text-zinc-600">{event.date} at {event.time}</p>
                <button onClick={() => deleteEvent(event.id)} className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-bold text-red-700 ring-1 ring-red-200">Delete event</button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
