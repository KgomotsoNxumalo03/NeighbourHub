import { NextRequest, NextResponse } from "next/server";
import { eventCategories } from "@/lib/constants";
import { readData, writeData } from "@/lib/data-store";
import type { CommunityEvent, EventCategory } from "@/lib/types";

export async function GET(request: NextRequest) {
  const communityId = new URL(request.url).searchParams.get("communityId");
  const events = await readData("events");
  return NextResponse.json({ events: events.filter((event) => (communityId ? event.communityId === communityId : true)).sort((a, b) => Date.parse(`${a.date}T${a.time}`) - Date.parse(`${b.date}T${b.time}`)) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const location = String(body.location || "").trim();

  if (!title || !description || !body.date || !body.time || !location) {
    return NextResponse.json({ message: "Please complete all event fields." }, { status: 400 });
  }

  if (!eventCategories.includes(body.category as EventCategory)) {
    return NextResponse.json({ message: "Invalid event category." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const event: CommunityEvent = {
    id: crypto.randomUUID(),
    communityId: body.communityId || "community-oakridge",
    title,
    description,
    date: body.date,
    time: body.time,
    location,
    category: body.category,
    createdBy: body.createdBy,
    rsvps: [],
    createdAt: now,
    updatedAt: now,
  };

  const events = await readData("events");
  events.push(event);
  await writeData("events", events);
  const notifications = await readData("notifications");
  notifications.push({
    id: crypto.randomUUID(),
    communityId: event.communityId,
    userId: "all",
    type: "Upcoming event",
    title: event.title,
    body: `${event.date} at ${event.time} / ${event.location}`,
    readBy: [],
    href: "/events",
    createdAt: now,
  });
  await writeData("notifications", notifications);
  return NextResponse.json({ event }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { id, action, userId } = await request.json();
  const events = await readData("events");
  const event = events.find((item) => item.id === id);

  if (!event) return NextResponse.json({ message: "Event not found." }, { status: 404 });
  if (action === "rsvp") event.rsvps = event.rsvps.includes(userId) ? event.rsvps.filter((item) => item !== userId) : [...event.rsvps, userId];
  if (action === "delete") event.rsvps = [];
  event.updatedAt = new Date().toISOString();
  await writeData("events", action === "delete" ? events.filter((item) => item.id !== id) : events);
  return NextResponse.json({ event });
}
