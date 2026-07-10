import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";
import { toAppAnnouncementPriority, toAppLostFoundStatus, toAppPollStatus, toAppTicketPriority, toAppTicketStatus } from "@/lib/db-maps";

type SearchResult = {
  id: string;
  type: string;
  title: string;
  detail: string;
  href: string;
};

function matches(values: string[], query: string) {
  return values.join(" ").toLowerCase().includes(query);
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = String(searchParams.get("q") || "").trim().toLowerCase();

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [tickets, announcements, posts, events, businesses, lostFound, polls, gallery] = await Promise.all([
    prisma.ticket.findMany({
      where: {
        communityId: session.activeCommunityId,
        deletedAt: null,
        ...(session.user.role === "resident" ? { userId: session.user.id } : {}),
      },
      select: { id: true, reference: true, title: true, description: true, location: true, category: true, status: true, priority: true },
    }),
    prisma.announcement.findMany({
      where: { communityId: session.activeCommunityId, deletedAt: null },
      select: { id: true, title: true, body: true, priority: true },
    }),
    prisma.feedPost.findMany({
      where: { communityId: session.activeCommunityId, deletedAt: null },
      select: { id: true, title: true, body: true, type: true, authorName: true },
    }),
    prisma.event.findMany({
      where: { communityId: session.activeCommunityId, deletedAt: null },
      select: { id: true, title: true, description: true, location: true, category: true, date: true, time: true },
    }),
    prisma.business.findMany({
      where: { communityId: session.activeCommunityId, deletedAt: null, approved: true },
      select: { id: true, name: true, category: true, description: true, area: true },
    }),
    prisma.lostFoundReport.findMany({
      where: { communityId: session.activeCommunityId, deletedAt: null },
      select: { id: true, title: true, description: true, location: true, type: true, status: true },
    }),
    prisma.poll.findMany({
      where: { communityId: session.activeCommunityId, deletedAt: null },
      select: { id: true, question: true, status: true },
    }),
    prisma.galleryItem.findMany({
      where: { communityId: session.activeCommunityId, deletedAt: null },
      select: { id: true, title: true, description: true, category: true, imageName: true },
    }),
  ]);

  const results: SearchResult[] = [
    ...tickets
      .filter((item) => matches([item.reference, item.title, item.description, item.location, item.category, toAppTicketStatus(item.status), toAppTicketPriority(item.priority)], query))
      .map((item) => ({
        id: item.id,
        type: "Ticket",
        title: `${item.reference}: ${item.title}`,
        detail: `${toAppTicketStatus(item.status)} / ${item.location}`,
        href: `/tickets/${item.id}`,
      })),
    ...announcements
      .filter((item) => matches([item.title, item.body, toAppAnnouncementPriority(item.priority)], query))
      .map((item) => ({ id: item.id, type: "Announcement", title: item.title, detail: toAppAnnouncementPriority(item.priority), href: "/announcements" })),
    ...posts
      .filter((item) => matches([item.title, item.body, item.type, item.authorName], query))
      .map((item) => ({ id: item.id, type: "Feed", title: item.title, detail: `${item.type} / ${item.authorName}`, href: "/feed" })),
    ...events
      .filter((item) => matches([item.title, item.description, item.location, item.category], query))
      .map((item) => ({ id: item.id, type: "Event", title: item.title, detail: `${item.date} ${item.time} / ${item.location}`, href: "/events" })),
    ...businesses
      .filter((item) => matches([item.name, item.category, item.description, item.area], query))
      .map((item) => ({ id: item.id, type: "Business", title: item.name, detail: `${item.category} / ${item.area}`, href: "/businesses" })),
    ...lostFound
      .filter((item) => matches([item.title, item.description, item.location, item.type, toAppLostFoundStatus(item.status)], query))
      .map((item) => ({ id: item.id, type: "Lost & Found", title: item.title, detail: `${item.type} / ${toAppLostFoundStatus(item.status)}`, href: "/lost-found" })),
    ...polls
      .filter((item) => matches([item.question, toAppPollStatus(item.status)], query))
      .map((item) => ({ id: item.id, type: "Poll", title: item.question, detail: toAppPollStatus(item.status), href: "/polls" })),
    ...gallery
      .filter((item) => matches([item.title, item.description, item.category, item.imageName], query))
      .map((item) => ({ id: item.id, type: "Gallery", title: item.title, detail: item.category, href: "/gallery" })),
  ];

  return NextResponse.json({ results: results.slice(0, 10) });
}
