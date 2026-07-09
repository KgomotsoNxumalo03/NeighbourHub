"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, AlertTriangle, BarChart3, Clock3, Tags } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import type { Ticket, TicketActivity } from "@/lib/types";
import { getCurrentUser } from "@/lib/client-auth";
import { getStoredCommunityId } from "@/lib/community";

type ReportRow = { label: string; count: number };
type AdminActivity = TicketActivity & { ticketId: string; reference: string; title: string };
type Reports = {
  byStatus: ReportRow[];
  byCategory: ReportRow[];
  emergencyTickets: Ticket[];
  averageResolutionHours: number | null;
  recentAdminActivity: AdminActivity[];
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Reports | null>(null);
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);

  useEffect(() => {
    fetch(`/api/reports?communityId=${communityId}`).then((res) => res.json()).then(setReports);
  }, [communityId]);

  return (
    <AppShell allowedRoles={["admin"]}>
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#006B3C]">Operations overview</p>
        <h1 className="mt-1 text-3xl font-bold">Admin reports</h1>
        <p className="mt-2 text-sm text-zinc-600">Simple neighbourhood reporting from local ticket data.</p>
      </div>

      {!reports && <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">Loading reports...</p>}

      {reports && (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Summary title="Emergency tickets" value={reports.emergencyTickets.length} icon={AlertTriangle} tone="red" />
            <Summary title="Status groups" value={reports.byStatus.length} icon={BarChart3} tone="green" />
            <Summary title="Active categories" value={reports.byCategory.length} icon={Tags} tone="gold" />
            <Summary title="Avg resolution" value={reports.averageResolutionHours === null ? "N/A" : `${reports.averageResolutionHours}h`} icon={Clock3} tone="neutral" />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <ReportCard title="Tickets by status" rows={reports.byStatus} />
            <ReportCard title="Tickets by category" rows={reports.byCategory} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-600" />
                <h2 className="text-lg font-bold">Emergency tickets</h2>
              </div>
              <div className="mt-4 space-y-3">
                {reports.emergencyTickets.map((ticket) => (
                  <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block rounded-lg border border-red-100 bg-red-50 p-4 hover:bg-red-100/70">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-red-950">{ticket.reference}: {ticket.title}</p>
                      <div className="flex gap-2"><StatusBadge value={ticket.status} /><PriorityBadge value={ticket.priority} /></div>
                    </div>
                    <p className="mt-2 text-sm text-red-900">{ticket.location} / {ticket.residentName}</p>
                  </Link>
                ))}
                {reports.emergencyTickets.length === 0 && <p className="rounded-lg bg-[#F7F8FA] p-4 text-sm text-zinc-600">No emergency tickets recorded.</p>}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Activity className="text-[#006B3C]" />
                <h2 className="text-lg font-bold">Recent admin activity</h2>
              </div>
              <div className="mt-4 space-y-3">
                {reports.recentAdminActivity.map((item) => (
                  <Link key={item.id} href={`/tickets/${item.ticketId}`} className="block rounded-lg bg-[#F7F8FA] p-4 hover:bg-zinc-50">
                    <p className="text-sm font-bold">{item.reference}: {item.message}</p>
                    <p className="mt-1 text-xs text-zinc-500">{item.actor} / {formatDate(item.createdAt)}</p>
                  </Link>
                ))}
                {reports.recentAdminActivity.length === 0 && <p className="rounded-lg bg-[#F7F8FA] p-4 text-sm text-zinc-600">No admin activity yet.</p>}
              </div>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function Summary({ title, value, icon: Icon, tone }: { title: string; value: number | string; icon: React.ElementType; tone: "red" | "green" | "gold" | "neutral" }) {
  const toneClass = {
    red: "bg-red-50 text-red-700",
    green: "bg-emerald-50 text-[#006B3C]",
    gold: "bg-[#C8A23A]/15 text-[#7A5C08]",
    neutral: "bg-zinc-100 text-zinc-700",
  }[tone];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-600">{title}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}><Icon size={20} /></span>
      </div>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}

function ReportCard({ title, rows }: { title: string; rows: ReportRow[] }) {
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">{row.label}</span>
              <span className="font-bold text-[#006B3C]">{row.count}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-zinc-100">
              <div className="h-2 rounded-full bg-[#C8A23A]" style={{ width: `${(row.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
