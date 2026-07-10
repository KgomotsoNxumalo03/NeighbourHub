import { NextRequest, NextResponse } from "next/server";
import { ticketCategories, ticketPriorities, ticketStatuses } from "@/lib/constants";
import { areaFromLocation, getTicketSla } from "@/lib/tickets";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";
import {
  toAppTicketActivityType,
  toAppTicketPriority,
  toAppTicketStatus,
} from "@/lib/db-maps";
import type { Ticket } from "@/lib/types";

function serializeTicket(ticket: {
  id: string;
  communityId: string;
  reference: string;
  userId: string;
  residentName: string;
  title: string;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
  location: string;
  imageName: string;
  imagePreview: string;
  status: "NEW" | "ACKNOWLEDGED" | "ASSIGNED" | "OPEN" | "IN_PROGRESS" | "WAITING_ON_RESIDENT" | "WAITING_ON_CONTRACTOR" | "RESOLVED" | "CLOSED" | "REOPENED";
  ownerName: string;
  estimatedCompletionAt: Date | null;
  resolutionNotes: string;
  adminNotes: string;
  createdAt: Date;
  updatedAt: Date;
  comments: { id: string }[];
  activities: {
    id: string;
    type: "CREATED" | "STATUS" | "COMMENT" | "ADMIN_NOTE" | "REOPENED";
    message: string;
    actor: string;
    createdAt: Date;
  }[];
  supports: { userId: string }[];
  adminNotesHistory: { id: string; note: string; actor: string; createdAt: Date }[];
}): Ticket {
  return {
    id: ticket.id,
    communityId: ticket.communityId,
    reference: ticket.reference,
    userId: ticket.userId,
    residentName: ticket.residentName,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category as Ticket["category"],
    priority: toAppTicketPriority(ticket.priority),
    location: ticket.location,
    imageName: ticket.imageName,
    imagePreview: ticket.imagePreview,
    status: toAppTicketStatus(ticket.status),
    ownerName: ticket.ownerName,
    supporters: ticket.supports.map((support) => support.userId),
    estimatedCompletionAt: ticket.estimatedCompletionAt ? ticket.estimatedCompletionAt.toISOString() : "",
    resolutionNotes: ticket.resolutionNotes,
    adminNotes: ticket.adminNotes,
    adminNotesHistory: ticket.adminNotesHistory.map((note) => ({
      id: note.id,
      note: note.note,
      actor: note.actor,
      createdAt: note.createdAt.toISOString(),
    })),
    comments: [],
    timeline: ticket.activities.map((activity) => ({
      id: activity.id,
      type: toAppTicketActivityType(activity.type),
      message: activity.message,
      actor: activity.actor,
      createdAt: activity.createdAt.toISOString(),
    })),
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  if (session.user.role !== "admin" && session.user.role !== "super-admin") {
    return NextResponse.json({ message: "Only admins can view reports." }, { status: 403 });
  }

  const tickets = await prisma.ticket.findMany({
    where: { communityId: session.activeCommunityId, deletedAt: null },
    include: {
      comments: true,
      activities: { orderBy: { createdAt: "asc" } },
      supports: true,
      adminNotesHistory: true,
    },
  });

  const mappedTickets = tickets.map((ticket) => serializeTicket(ticket as Parameters<typeof serializeTicket>[0]));
  const byStatus = ticketStatuses.map((status) => ({
    label: status,
    count: mappedTickets.filter((ticket) => ticket.status === status).length,
  }));
  const byCategory = ticketCategories
    .map((category) => ({
      label: category,
      count: mappedTickets.filter((ticket) => ticket.category === category).length,
    }))
    .filter((item) => item.count > 0);
  const byPriority = ticketPriorities.map((priority) => ({
    label: priority,
    count: mappedTickets.filter((ticket) => ticket.priority === priority).length,
  }));
  const emergencyTickets = mappedTickets.filter((ticket) => ticket.priority === "Emergency");
  const overdueTickets = mappedTickets.filter((ticket) => getTicketSla(ticket).overdue);
  const openedCount = mappedTickets.length;
  const resolvedCount = mappedTickets.filter((ticket) => ticket.status === "Resolved" || ticket.status === "Closed").length;
  const resolvedTickets = mappedTickets.filter((ticket) => ticket.status === "Resolved" || ticket.status === "Closed");
  const averageResolutionHours = resolvedTickets.length
    ? Math.round(
        resolvedTickets.reduce((sum, ticket) => sum + (Date.parse(ticket.updatedAt) - Date.parse(ticket.createdAt)) / 3600000, 0) /
          resolvedTickets.length,
      )
    : null;
  const areaCounts = Object.entries(
    mappedTickets.reduce<Record<string, number>>((acc, ticket) => {
      const area = areaFromLocation(ticket.location);
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {}),
  )
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
  const recentAdminActivity = mappedTickets
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
    byPriority,
    emergencyTickets,
    overdueTickets,
    openedVsResolved: [
      { label: "Opened", count: openedCount },
      { label: "Resolved", count: resolvedCount },
    ],
    mostReportedAreas: areaCounts.slice(0, 6),
    averageResolutionHours,
    recentAdminActivity,
  });
}
