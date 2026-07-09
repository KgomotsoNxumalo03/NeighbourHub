import { NextRequest, NextResponse } from "next/server";
import { readData } from "@/lib/data-store";

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
  const { searchParams } = new URL(request.url);
  const communityId = searchParams.get("communityId");
  const query = String(searchParams.get("q") || "").trim().toLowerCase();

  if (!communityId || query.length < 2) return NextResponse.json({ results: [] });

  const [tickets, announcements, posts, events, businesses, lostFound, polls, gallery] = await Promise.all([
    readData("tickets"),
    readData("announcements"),
    readData("feedPosts"),
    readData("events"),
    readData("businesses"),
    readData("lostFound"),
    readData("polls"),
    readData("gallery"),
  ]);

  const results: SearchResult[] = [
    ...tickets
      .filter((item) => item.communityId === communityId)
      .filter((item) => matches([item.reference, item.title, item.description, item.location, item.category, item.status], query))
      .map((item) => ({ id: item.id, type: "Ticket", title: `${item.reference}: ${item.title}`, detail: `${item.status} / ${item.location}`, href: `/tickets/${item.id}` })),
    ...announcements
      .filter((item) => item.communityId === communityId)
      .filter((item) => matches([item.title, item.body, item.priority], query))
      .map((item) => ({ id: item.id, type: "Announcement", title: item.title, detail: item.priority, href: "/announcements" })),
    ...posts
      .filter((item) => item.communityId === communityId && !item.deleted)
      .filter((item) => matches([item.title, item.body, item.type, item.authorName], query))
      .map((item) => ({ id: item.id, type: "Feed", title: item.title, detail: `${item.type} / ${item.authorName}`, href: "/feed" })),
    ...events
      .filter((item) => item.communityId === communityId)
      .filter((item) => matches([item.title, item.description, item.location, item.category], query))
      .map((item) => ({ id: item.id, type: "Event", title: item.title, detail: `${item.date} ${item.time} / ${item.location}`, href: "/events" })),
    ...businesses
      .filter((item) => item.communityId === communityId && item.approved)
      .filter((item) => matches([item.name, item.category, item.description, item.area], query))
      .map((item) => ({ id: item.id, type: "Business", title: item.name, detail: `${item.category} / ${item.area}`, href: "/businesses" })),
    ...lostFound
      .filter((item) => item.communityId === communityId)
      .filter((item) => matches([item.title, item.description, item.location, item.type, item.status], query))
      .map((item) => ({ id: item.id, type: "Lost & Found", title: item.title, detail: `${item.type} / ${item.status}`, href: "/lost-found" })),
    ...polls
      .filter((item) => item.communityId === communityId)
      .filter((item) => matches([item.question, item.status], query))
      .map((item) => ({ id: item.id, type: "Poll", title: item.question, detail: item.status, href: "/polls" })),
    ...gallery
      .filter((item) => item.communityId === communityId)
      .filter((item) => matches([item.title, item.description, item.category, item.imageName], query))
      .map((item) => ({ id: item.id, type: "Gallery", title: item.title, detail: item.category, href: "/gallery" })),
  ];

  return NextResponse.json({ results: results.slice(0, 10) });
}
