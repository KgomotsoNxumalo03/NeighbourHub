import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";
import { toAppTicketPriority, toAppTicketStatus } from "@/lib/db-maps";
import type { MapMarker, MapMarkerType } from "@/lib/types";

function point(seed: string, offset = 0) {
  const sum = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0) + offset;
  return { x: 8 + (sum % 78), y: 12 + ((sum * 7) % 70) };
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const [tickets, lostFound, events, contacts] = await Promise.all([
    prisma.ticket.findMany({
      where: { communityId: session.activeCommunityId, deletedAt: null },
      select: { id: true, communityId: true, title: true, category: true, status: true, location: true, priority: true },
    }),
    prisma.lostFoundReport.findMany({
      where: { communityId: session.activeCommunityId, deletedAt: null },
      select: { id: true, communityId: true, title: true, type: true, location: true, status: true },
    }),
    prisma.event.findMany({
      where: { communityId: session.activeCommunityId, deletedAt: null },
      select: { id: true, communityId: true, title: true, date: true, time: true, location: true },
    }),
    prisma.emergencyContact.findMany({
      where: { communityId: session.activeCommunityId },
      select: { id: true, communityId: true, name: true, phone: true },
      take: 5,
    }),
  ]);

  const markers: MapMarker[] = [
    ...tickets.map((ticket, index) => {
      const category = ticket.category;
      const priority = toAppTicketPriority(ticket.priority);
      const status = toAppTicketStatus(ticket.status);
      const type: MapMarkerType =
        priority === "Emergency"
          ? "Emergency"
          : category.includes("Power")
            ? "Power"
            : category.includes("Water")
              ? "Water"
              : category.includes("Security") || category.includes("Suspicious")
                ? "Security"
                : category.includes("road") || category.includes("Pothole")
                  ? "Roads"
                  : "Security";

      return {
        id: ticket.id,
        communityId: ticket.communityId,
        type,
        title: ticket.title,
        description: status,
        location: ticket.location,
        href: `/tickets/${ticket.id}`,
        ...point(ticket.id, index),
      };
    }),
    ...lostFound.map((item, index) => ({
      id: item.id,
      communityId: item.communityId,
      type: "Lost & Found" as MapMarkerType,
      title: item.title,
      description: item.type,
      location: item.location,
      href: "/lost-found",
      ...point(item.id, index + 10),
    })),
    ...events.map((event, index) => ({
      id: event.id,
      communityId: event.communityId,
      type: "Event" as MapMarkerType,
      title: event.title,
      description: `${event.date} ${event.time}`,
      location: event.location,
      href: "/events",
      ...point(event.id, index + 20),
    })),
    ...contacts.map((contact, index) => ({
      id: contact.id,
      communityId: contact.communityId,
      type: "Contact" as MapMarkerType,
      title: contact.name,
      description: contact.phone,
      location: "Community-wide",
      href: "/emergency",
      ...point(contact.id, index + 30),
    })),
  ];

  return NextResponse.json({ markers });
}
