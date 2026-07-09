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
  return ["New", "Open", "In Progress"].includes(status);
}
