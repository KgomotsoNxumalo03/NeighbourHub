"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Megaphone } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/client-auth";
import type { Announcement } from "@/lib/types";
import { getStoredCommunityId } from "@/lib/community";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);

  useEffect(() => {
    fetch(`/api/announcements?active=true&communityId=${communityId}`).then((res) => res.json()).then((data) => setAnnouncements(data.announcements || []));
  }, [communityId]);

  return (
    <AppShell allowedRoles={["resident", "admin"]}>
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#006B3C]">Community updates</p>
        <h1 className="mt-1 text-3xl font-bold">Announcements</h1>
        <p className="mt-2 text-sm text-zinc-600">Latest notices for {user?.role === "admin" ? "the neighbourhood team" : "residents"}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {announcements.map((announcement) => (
          <article key={announcement.id} className={`rounded-lg border bg-white p-5 shadow-sm hover:shadow-md ${announcement.priority === "Emergency" ? "border-red-200 ring-2 ring-red-100" : announcement.priority === "Important" ? "border-[#C8A23A]/50" : "border-zinc-200"}`}>
            <div className="flex items-start gap-4">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${announcement.priority === "Emergency" ? "bg-red-100 text-red-700" : "bg-[#C8A23A]/20 text-[#006B3C]"}`}>
                {announcement.priority === "Emergency" ? <AlertTriangle size={22} /> : <Megaphone size={22} />}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold">{announcement.title}</h2>
                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600">{announcement.audience}</span>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${announcement.priority === "Emergency" ? "bg-red-100 text-red-800" : announcement.priority === "Important" ? "bg-[#C8A23A]/15 text-[#7A5C08]" : "bg-emerald-50 text-[#006B3C]"}`}>{announcement.priority}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{announcement.body}</p>
                <p className="mt-3 text-xs font-medium text-zinc-400">Posted {new Date(announcement.createdAt).toLocaleString()} / Expires {announcement.expiresAt}</p>
              </div>
            </div>
          </article>
        ))}
        {announcements.length === 0 && <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">No active announcements.</p>}
      </div>
    </AppShell>
  );
}
