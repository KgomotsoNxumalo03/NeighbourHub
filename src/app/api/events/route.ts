import { NextRequest, NextResponse } from "next/server";
import { eventCategories } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const events = await prisma.event.findMany({
    where: { communityId: session.activeCommunityId, deletedAt: null },
    include: { rsvps: true },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return NextResponse.json({
    events: events.map((event) => ({
      id: event.id,
      communityId: event.communityId,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      category: event.category,
      createdBy: event.createdBy,
      rsvps: event.rsvps.map((rsvp) => rsvp.userId),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  if (session.user.role !== "admin" && session.user.role !== "super-admin") {
    return NextResponse.json({ message: "Only admins can create events." }, { status: 403 });
  }

  const body = await request.json();
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const location = String(body.location || "").trim();

  if (!title || !description || !body.date || !body.time || !location) {
    return NextResponse.json({ message: "Please complete all event fields." }, { status: 400 });
  }

  if (!eventCategories.includes(body.category)) {
    return NextResponse.json({ message: "Invalid event category." }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      id: crypto.randomUUID(),
      communityId: session.activeCommunityId,
      title,
      description,
      date: body.date,
      time: body.time,
      location,
      category: body.category,
      createdBy: session.user.id,
    },
  });

  await prisma.notification.create({
    data: {
      id: crypto.randomUUID(),
      communityId: event.communityId,
      userId: "all",
      type: "UPCOMING_EVENT",
      title: event.title,
      body: `${event.date} at ${event.time} / ${event.location}`,
      href: "/events",
    },
  });

  return NextResponse.json({
    event: {
      ...event,
      rsvps: [],
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    },
  }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { id, action } = await request.json();
  const event = await prisma.event.findUnique({
    where: { id },
    include: { rsvps: true },
  });

  if (!event || event.communityId !== session.activeCommunityId) {
    return NextResponse.json({ message: "Event not found." }, { status: 404 });
  }

  if (action === "rsvp") {
    const existing = event.rsvps.find((rsvp) => rsvp.userId === session.user.id);
    if (existing) {
      await prisma.eventRsvp.delete({
        where: {
          eventId_userId: {
            eventId: event.id,
            userId: session.user.id,
          },
        },
      });
    } else {
      await prisma.eventRsvp.create({
        data: {
          id: crypto.randomUUID(),
          eventId: event.id,
          userId: session.user.id,
        },
      });
    }
  }

  if (action === "delete") {
    if (session.user.role !== "admin" && session.user.role !== "super-admin") {
      return NextResponse.json({ message: "Only admins can delete events." }, { status: 403 });
    }

    await prisma.event.update({
      where: { id: event.id },
      data: { deletedAt: new Date() },
    });
  }

  const updated = await prisma.event.findUnique({
    where: { id: event.id },
    include: { rsvps: true },
  });

  return NextResponse.json({
    event: {
      ...updated!,
      rsvps: updated?.rsvps.map((rsvp) => rsvp.userId) || [],
      createdAt: updated!.createdAt.toISOString(),
      updatedAt: updated!.updatedAt.toISOString(),
    },
  });
}
