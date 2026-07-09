import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data-store";
import { normalizeTickets } from "@/lib/tickets";
import { ticketCategories, ticketStatuses } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const communityId = new URL(request.url).searchParams.get("communityId");
  const normalized = normalizeTickets(await readData("tickets"));
  if (normalized.changed) await writeData("tickets", normalized.tickets);

  const tickets = communityId ? normalized.tickets.filter((ticket) => ticket.communityId === communityId) : normalized.tickets;
  const byStatus = ticketStatuses.map((status) => ({
    label: status,
    count: tickets.filter((ticket) => ticket.status === status).length,
  }));
  const byCategory = ticketCategories.map((category) => ({
    label: category,
    count: tickets.filter((ticket) => ticket.category === category).length,
  })).filter((item) => item.count > 0);
  const emergencyTickets = tickets.filter((ticket) => ticket.priority === "Emergency");
  const resolvedTickets = tickets.filter((ticket) => ticket.status === "Resolved" || ticket.status === "Closed");
  const averageResolutionHours = resolvedTickets.length
    ? Math.round(
        resolvedTickets.reduce((sum, ticket) => sum + (Date.parse(ticket.updatedAt) - Date.parse(ticket.createdAt)) / 3600000, 0) /
          resolvedTickets.length,
      )
    : null;
  const recentAdminActivity = tickets
    .flatMap((ticket) =>
      ticket.timeline
        .filter((event) => event.actor.toLowerCase().includes("admin") || event.type === "admin-note" || event.type === "status")
        .map((event) => ({ ...event, ticketId: ticket.id, reference: ticket.reference, title: ticket.title })),
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 8);

  return NextResponse.json({
    byStatus,
    byCategory,
    emergencyTickets,
    averageResolutionHours,
    recentAdminActivity,
  });
}
