"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, Inbox, PlusCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { getCurrentUser } from "@/lib/client-auth";
import type { Ticket } from "@/lib/types";
import { getStoredCommunityId } from "@/lib/community";
import { getTicketSla } from "@/lib/tickets";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/tickets?userId=${user.id}&communityId=${communityId}`).then((res) => res.json()).then((data) => {
      setTickets(data.tickets || []);
      setLoading(false);
    });
  }, [user?.id, communityId]);

  const emergencyTickets = tickets.filter((ticket) => ticket.priority === "Emergency");

  return (
    <AppShell allowedRoles={["resident"]}>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-[#006B3C]">Ticket tracking</p>
          <h1 className="mt-1 text-3xl font-bold">My tickets</h1>
        </div>
        <Link href="/tickets/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#006B3C] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#00522f]">
          <PlusCircle size={18} />
          Log ticket
        </Link>
      </div>

      {emergencyTickets.length > 0 && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle size={18} />
            {emergencyTickets.length} emergency ticket{emergencyTickets.length === 1 ? "" : "s"} require attention
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {loading && <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">Loading tickets...</p>}
        {tickets.map((ticket) => (
          <Link key={ticket.id} href={`/tickets/${ticket.id}`} className={`rounded-lg border bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md ${getTicketSla(ticket).overdue ? "border-red-200 ring-2 ring-red-100" : "border-zinc-200"}`}>
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-bold text-[#006B3C]">{ticket.reference}</p>
                <h2 className="text-lg font-bold">{ticket.title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{ticket.description}</p>
              </div>
              <div className="flex shrink-0 gap-2"><StatusBadge value={ticket.status} /><PriorityBadge value={ticket.priority} /></div>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-zinc-600 sm:grid-cols-3">
              <p><span className="font-semibold text-zinc-900">Category:</span> {ticket.category}</p>
              <p><span className="font-semibold text-zinc-900">Location:</span> {ticket.location}</p>
              <p><span className="font-semibold text-zinc-900">Updated:</span> {new Date(ticket.updatedAt).toLocaleDateString()}</p>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs font-bold text-zinc-500">
                <span>SLA progress</span>
                <span>{getTicketSla(ticket).overdue ? "Overdue" : `${getTicketSla(ticket).hoursRemaining}h remaining`}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-zinc-100">
                <div className={`h-2 rounded-full ${getTicketSla(ticket).overdue ? "bg-red-600" : "bg-[#C8A23A]"}`} style={{ width: `${getTicketSla(ticket).progress}%` }} />
              </div>
            </div>
            {ticket.adminNotes && <p className="mt-4 rounded-lg bg-[#F7F8FA] p-3 text-sm text-zinc-700"><span className="font-bold">Admin note:</span> {ticket.adminNotes}</p>}
          </Link>
        ))}
        {!loading && tickets.length === 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <Inbox className="mx-auto text-[#006B3C]" size={34} />
            <p className="mt-3 font-bold">No tickets yet</p>
            <p className="mt-1 text-sm text-zinc-600">When you log an issue, it will appear here with its reference number and status.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
