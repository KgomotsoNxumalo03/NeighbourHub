import { NextRequest, NextResponse } from "next/server";
import { announcementPriorities } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";
import { toAppAnnouncementPriority, toDbAnnouncementPriority } from "@/lib/db-maps";

function toAnnouncementResponse(announcement: {
  id: string;
  communityId: string;
  title: string;
  body: string;
  audience: string;
  priority: "NORMAL" | "IMPORTANT" | "EMERGENCY";
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...announcement,
    priority: toAppAnnouncementPriority(announcement.priority),
    expiresAt: announcement.expiresAt.toISOString().slice(0, 10),
    createdAt: announcement.createdAt.toISOString(),
    updatedAt: announcement.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const activeOnly = new URL(request.url).searchParams.get("active") === "true";
  const announcements = await prisma.announcement.findMany({
    where: { communityId: session.activeCommunityId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    announcements: announcements
      .map(toAnnouncementResponse)
      .filter((announcement) => (activeOnly ? new Date(`${announcement.expiresAt}T23:59:59`).getTime() >= Date.now() : true)),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  if (session.user.role !== "admin" && session.user.role !== "super-admin") {
    return NextResponse.json({ message: "Only admins can create announcements." }, { status: 403 });
  }

  const { title, body, audience, priority, expiresAt } = await request.json();
  const cleanTitle = String(title || "").trim();
  const cleanBody = String(body || "").trim();
  if (!cleanTitle || !cleanBody) {
    return NextResponse.json({ message: "Title and body are required." }, { status: 400 });
  }

  if (priority && !announcementPriorities.includes(priority)) {
    return NextResponse.json({ message: "Invalid announcement priority." }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      id: crypto.randomUUID(),
      communityId: session.activeCommunityId,
      title: cleanTitle,
      body: cleanBody,
      audience: audience || "All residents",
      priority: priority ? toDbAnnouncementPriority(priority) : "NORMAL",
      expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59.000Z`) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  if (announcement.priority === "EMERGENCY") {
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        communityId: announcement.communityId,
        userId: "all",
        type: "EMERGENCY_ANNOUNCEMENT",
        title: announcement.title,
        body: announcement.body,
        href: "/announcements",
      },
    });
  }

  return NextResponse.json({ announcement: toAnnouncementResponse(announcement) }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  if (session.user.role !== "admin" && session.user.role !== "super-admin") {
    return NextResponse.json({ message: "Only admins can update announcements." }, { status: 403 });
  }

  const { id, title, body, audience, priority, expiresAt } = await request.json();
  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement || announcement.communityId !== session.activeCommunityId) {
    return NextResponse.json({ message: "Announcement not found." }, { status: 404 });
  }

  if (priority && !announcementPriorities.includes(priority)) {
    return NextResponse.json({ message: "Invalid announcement priority." }, { status: 400 });
  }

  const updated = await prisma.announcement.update({
    where: { id: announcement.id },
    data: {
      title: String(title || announcement.title).trim(),
      body: String(body || announcement.body).trim(),
      audience: audience || announcement.audience,
      priority: priority ? toDbAnnouncementPriority(priority) : announcement.priority,
      expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59.000Z`) : announcement.expiresAt,
    },
  });

  return NextResponse.json({ announcement: toAnnouncementResponse(updated) });
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  if (session.user.role !== "admin" && session.user.role !== "super-admin") {
    return NextResponse.json({ message: "Only admins can delete announcements." }, { status: 403 });
  }

  const { id } = await request.json();
  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement || announcement.communityId !== session.activeCommunityId) {
    return NextResponse.json({ message: "Announcement not found." }, { status: 404 });
  }

  await prisma.announcement.update({
    where: { id: announcement.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
