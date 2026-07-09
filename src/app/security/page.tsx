"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { getCurrentUser } from "@/lib/client-auth";
import { getStoredCommunityId } from "@/lib/community";
import type { Announcement, EmergencyContact, Ticket } from "@/lib/types";

export default function SecurityPage() {
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  useEffect(() => {
    fetch(`/api/tickets?communityId=${communityId}`).then((res) => res.json()).then((data) => setTickets((data.tickets || []).filter((ticket: Ticket) => ticket.category.includes("Security") || ticket.category.includes("Suspicious") || ticket.priority === "Emergency")));
    fetch(`/api/announcements?communityId=${communityId}&active=true`).then((res) => res.json()).then((data) => setAnnouncements((data.announcements || []).filter((item: Announcement) => item.priority !== "Normal")));
    fetch(`/api/contacts?communityId=${communityId}`).then((res) => res.json()).then((data) => setContacts(data.contacts || []));
  }, [communityId]);

  return (
    <AppShell allowedRoles={["resident", "admin"]}>
      <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-6 text-red-950">
        <div className="flex items-center gap-3">
          <ShieldAlert size={30} />
          <div>
            <p className="text-sm font-bold text-red-700">Security centre</p>
            <h1 className="text-3xl font-bold">Safety and incident overview</h1>
          </div>
        </div>
      </div>
      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Security alerts</h2>
            <div className="mt-4 space-y-3">
              {announcements.map((item) => <article key={item.id} className="rounded-lg bg-red-50 p-4"><p className="font-bold">{item.title}</p><p className="mt-1 text-sm text-red-900">{item.body}</p></article>)}
              {announcements.length === 0 && <p className="text-sm text-zinc-600">No active security alerts.</p>}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Security-related tickets</h2>
            <div className="mt-4 space-y-3">
              {tickets.map((ticket) => <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block rounded-lg bg-[#F7F8FA] p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-bold">{ticket.reference}: {ticket.title}</p><div className="flex gap-2"><StatusBadge value={ticket.status} /><PriorityBadge value={ticket.priority} /></div></div><p className="mt-2 text-sm text-zinc-600">{ticket.location}</p></Link>)}
            </div>
          </div>
        </div>
        <aside className="space-y-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Wanted vehicle placeholder</h2>
            <p className="mt-2 text-sm text-zinc-600">No active wanted vehicle details. This panel is ready for security uploads.</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Road closures</h2>
            <p className="mt-2 text-sm text-zinc-600">No road closures currently recorded.</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Emergency contacts</h2>
            <div className="mt-3 space-y-2">{contacts.slice(0, 4).map((contact) => <p key={contact.id} className="text-sm"><span className="font-bold">{contact.name}</span>: {contact.phone}</p>)}</div>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
