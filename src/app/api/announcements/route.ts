import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data-store";
import { announcementPriorities } from "@/lib/constants";
import { isAnnouncementActive, normalizeAnnouncements } from "@/lib/announcements";
import type { Announcement } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";
  const communityId = searchParams.get("communityId");
  const normalized = normalizeAnnouncements(await readData("announcements"));
  if (normalized.changed) await writeData("announcements", normalized.announcements);

  return NextResponse.json({
    announcements: normalized.announcements
      .filter((announcement) => (activeOnly ? isAnnouncementActive(announcement) : true))
      .filter((announcement) => (communityId ? announcement.communityId === communityId : true))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  });
}

export async function POST(request: NextRequest) {
  const { title, body, audience, priority, expiresAt, communityId } = await request.json();
  const cleanTitle = String(title || "").trim();
  const cleanBody = String(body || "").trim();

  if (!cleanTitle || !cleanBody) {
    return NextResponse.json({ message: "Title and body are required." }, { status: 400 });
  }

  if (priority && !announcementPriorities.includes(priority)) {
    return NextResponse.json({ message: "Invalid announcement priority." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const announcement: Announcement = {
    id: crypto.randomUUID(),
    communityId: communityId || "community-oakridge",
    title: cleanTitle,
    body: cleanBody,
    audience: audience || "All residents",
    priority: priority || "Normal",
    expiresAt: expiresAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    createdAt: now,
    updatedAt: now,
  };

  const announcements = await readData("announcements");
  announcements.push(announcement);
  await writeData("announcements", announcements);
  if (announcement.priority === "Emergency") {
    const notifications = await readData("notifications");
    notifications.push({
      id: crypto.randomUUID(),
      communityId: announcement.communityId,
      userId: "all",
      type: "Emergency announcement",
      title: announcement.title,
      body: announcement.body,
      readBy: [],
      href: "/announcements",
      createdAt: now,
    });
    await writeData("notifications", notifications);
  }

  return NextResponse.json({ announcement }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { id, title, body, audience, priority, expiresAt } = await request.json();
  const normalized = normalizeAnnouncements(await readData("announcements"));
  const announcements = normalized.announcements;
  const announcement = announcements.find((item) => item.id === id);

  if (!announcement) {
    return NextResponse.json({ message: "Announcement not found." }, { status: 404 });
  }

  if (priority && !announcementPriorities.includes(priority)) {
    return NextResponse.json({ message: "Invalid announcement priority." }, { status: 400 });
  }

  announcement.title = String(title || announcement.title).trim();
  announcement.body = String(body || announcement.body).trim();
  announcement.audience = audience || announcement.audience;
  announcement.priority = priority || announcement.priority;
  announcement.expiresAt = expiresAt || announcement.expiresAt;
  announcement.updatedAt = new Date().toISOString();

  await writeData("announcements", announcements);
  return NextResponse.json({ announcement });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  const normalized = normalizeAnnouncements(await readData("announcements"));
  const announcements = normalized.announcements.filter((item) => item.id !== id);

  if (announcements.length === normalized.announcements.length) {
    return NextResponse.json({ message: "Announcement not found." }, { status: 404 });
  }

  await writeData("announcements", announcements);
  return NextResponse.json({ ok: true });
}
