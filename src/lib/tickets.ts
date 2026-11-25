import type { Ticket, TicketActivity } from "@/lib/types";

const priorityRank = {
  Low: 1,
  Medium: 2,
  High: 3,
  Emergency: 4,
};

const statusRank = {
  New: 1,
  Acknowledged: 2,
  Assigned: 3,
  Open: 4,
  "In Progress": 5,
  "Waiting on Resident": 6,
  "Waiting on Contractor": 7,
  Resolved: 8,
  Closed: 9,
  Reopened: 10,
};

export function formatTicketReference(index: number) {
  return `NH-${String(index + 1).padStart(4, "0")}`;
}

export function normalizeTickets(tickets: Ticket[]) {
  let changed = false;

  const normalized = tickets.map((ticket, index) => {
    const createdAt = ticket.createdAt || new Date().toISOString();
    const timeline = ticket.timeline?.length
      ? ticket.timeline
      : [
          {
            id: `${ticket.id}-created`,
            type: "created",
            message: "Ticket created",
            actor: ticket.residentName || "Resident",
            createdAt,
          } satisfies TicketActivity,
        ];

    const nextTicket: Ticket = {
      ...ticket,
      communityId: ticket.communityId || "community-oakridge",
      reference: ticket.reference || formatTicketReference(index),
      imagePreview: ticket.imagePreview || ticket.imageName || "",
      ownerName: ticket.ownerName || "Unassigned",
      supporters: ticket.supporters || [],
      estimatedCompletionAt: ticket.estimatedCompletionAt || "",
      resolutionNotes: ticket.resolutionNotes || "",
      adminNotes: ticket.adminNotes || "",
      adminNotesHistory: ticket.adminNotesHistory || [],
      comments: ticket.comments || [],
      timeline,
      createdAt,
      updatedAt: ticket.updatedAt || createdAt,
    };

    if (
      !ticket.reference ||
      !ticket.timeline ||
      !ticket.comments ||
      !ticket.adminNotesHistory ||
      !ticket.imagePreview
    ) {
      changed = true;
    }

    return nextTicket;
  });

  return { tickets: normalized, changed };
}

export function sortTickets(tickets: Ticket[], sortBy: string) {
  return [...tickets].sort((a, b) => {
    if (sortBy === "oldest") return Date.parse(a.createdAt) - Date.parse(b.createdAt);
    if (sortBy === "priority") return priorityRank[b.priority] - priorityRank[a.priority];
    if (sortBy === "status") return statusRank[a.status] - statusRank[b.status];
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
}

export function isOpenStatus(status: Ticket["status"]) {
  return ["New", "Acknowledged", "Assigned", "Open", "In Progress", "Waiting on Resident", "Waiting on Contractor", "Reopened"].includes(status);
}

export function slaHoursForPriority(priority: Ticket["priority"]) {
  if (priority === "Emergency") return 2;
  if (priority === "High") return 24;
  if (priority === "Medium") return 72;
  return 168;
}

export function getTicketSla(ticket: Ticket) {
  const dueAt = new Date(Date.parse(ticket.createdAt) + slaHoursForPriority(ticket.priority) * 60 * 60 * 1000);
  const now = Date.now();
  const elapsed = Math.max(0, now - Date.parse(ticket.createdAt));
  const total = Math.max(1, dueAt.getTime() - Date.parse(ticket.createdAt));
  const progress = Math.min(100, Math.round((elapsed / total) * 100));
  const terminal = ticket.status === "Resolved" || ticket.status === "Closed";

  return {
    dueAt: dueAt.toISOString(),
    progress: terminal ? 100 : progress,
    overdue: !terminal && now > dueAt.getTime(),
    hoursRemaining: Math.ceil((dueAt.getTime() - now) / 3600000),
  };
}

export function areaFromLocation(location: string) {
  return location.split(",")[0]?.trim() || location.trim() || "Unspecified";
}

export function isUnassigned(ticket: Ticket) {
  return isOpenStatus(ticket.status) && (!ticket.ownerName || ticket.ownerName === "Unassigned");
}

export function isMaintenanceOverdue(ticket: Ticket, now = Date.now()) {
  return isOpenStatus(ticket.status) && Date.parse(ticket.dueAt || getTicketSla(ticket).dueAt) < now;
}

export function getResolutionTime(ticket: Ticket) {
  if (isOpenStatus(ticket.status)) return null;
  return ticket.resolvedAt || [...ticket.timeline].reverse().find((event) =>
    event.type === "status" && / to (Resolved|Closed)$|^Resident confirmed resolution$/.test(event.message)
  )?.createdAt || ticket.updatedAt;
}
