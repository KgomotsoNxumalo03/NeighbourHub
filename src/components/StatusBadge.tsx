import type { TicketPriority, TicketStatus } from "@/lib/types";
import { AlertTriangle, CheckCircle2, Circle, Clock3, Flame, Gauge, Loader2, XCircle } from "lucide-react";

const statusStyles: Record<TicketStatus, string> = {
  New: "bg-slate-100 text-slate-700 ring-slate-200",
  Acknowledged: "bg-cyan-50 text-cyan-800 ring-cyan-200",
  Assigned: "bg-violet-50 text-violet-800 ring-violet-200",
  Open: "bg-amber-50 text-amber-800 ring-amber-200",
  "In Progress": "bg-blue-50 text-blue-800 ring-blue-200",
  "Waiting on Resident": "bg-orange-50 text-orange-800 ring-orange-200",
  "Waiting on Contractor": "bg-purple-50 text-purple-800 ring-purple-200",
  Resolved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Closed: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  Reopened: "bg-red-50 text-red-800 ring-red-200",
};

const priorityStyles: Record<TicketPriority, string> = {
  Low: "bg-slate-100 text-slate-700 ring-slate-200",
  Medium: "bg-[#C8A23A]/15 text-[#7A5C08] ring-[#C8A23A]/25",
  High: "bg-orange-50 text-orange-800 ring-orange-200",
  Emergency: "bg-red-50 text-red-800 ring-red-200",
};

export function StatusBadge({ value }: { value: TicketStatus }) {
  const Icon = {
    New: Circle,
    Acknowledged: Clock3,
    Assigned: Gauge,
    Open: Clock3,
    "In Progress": Loader2,
    "Waiting on Resident": Clock3,
    "Waiting on Contractor": Clock3,
    Resolved: CheckCircle2,
    Closed: XCircle,
    Reopened: AlertTriangle,
  }[value];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyles[value]}`}>
      <Icon size={13} />
      {value}
    </span>
  );
}

export function PriorityBadge({ value }: { value: TicketPriority }) {
  const Icon = value === "Emergency" ? Flame : value === "High" ? AlertTriangle : Gauge;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${priorityStyles[value]}`}>
      <Icon size={13} />
      {value}
    </span>
  );
}
