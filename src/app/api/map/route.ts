import { NextRequest, NextResponse } from "next/server";
import { readData } from "@/lib/data-store";
import type { MapMarker, MapMarkerType } from "@/lib/types";

function point(seed: string, offset = 0) {
  const sum = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0) + offset;
  return { x: 8 + (sum % 78), y: 12 + ((sum * 7) % 70) };
}

export async function GET(request: NextRequest) {
  const communityId = new URL(request.url).searchParams.get("communityId");
  const tickets = (await readData("tickets")).filter((item) => !communityId || item.communityId === communityId);
  const lostFound = (await readData("lostFound")).filter((item) => !communityId || item.communityId === communityId);
  const events = (await readData("events")).filter((item) => !communityId || item.communityId === communityId);
  const contacts = (await readData("contacts")).filter((item) => !communityId || item.communityId === communityId);

  const markers: MapMarker[] = [
    ...tickets.map((ticket, index) => {
      const type: MapMarkerType = ticket.priority === "Emergency" ? "Emergency" : ticket.category.includes("Power") ? "Power" : ticket.category.includes("Water") ? "Water" : ticket.category.includes("Security") || ticket.category.includes("Suspicious") ? "Security" : ticket.category.includes("road") || ticket.category.includes("Pothole") ? "Roads" : "Security";
      return { id: ticket.id, communityId: ticket.communityId, type, title: ticket.title, description: ticket.status, location: ticket.location, href: `/tickets/${ticket.id}`, ...point(ticket.id, index) };
    }),
    ...lostFound.map((item, index) => ({ id: item.id, communityId: item.communityId, type: "Lost & Found" as MapMarkerType, title: item.title, description: item.type, location: item.location, href: "/lost-found", ...point(item.id, index + 10) })),
    ...events.map((event, index) => ({ id: event.id, communityId: event.communityId, type: "Event" as MapMarkerType, title: event.title, description: `${event.date} ${event.time}`, location: event.location, href: "/events", ...point(event.id, index + 20) })),
    ...contacts.slice(0, 5).map((contact, index) => ({ id: contact.id, communityId: contact.communityId, type: "Contact" as MapMarkerType, title: contact.name, description: contact.phone, location: "Community-wide", href: "/emergency", ...point(contact.id, index + 30) })),
  ];

  return NextResponse.json({ markers });
}
