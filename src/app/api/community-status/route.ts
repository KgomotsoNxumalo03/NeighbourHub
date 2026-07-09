import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data-store";
import { communityStatusLevels } from "@/lib/constants";
import { normalizeCommunityStatus } from "@/lib/community-status";

export async function GET(request: NextRequest) {
  const communityId = new URL(request.url).searchParams.get("communityId");
  const normalized = normalizeCommunityStatus(await readData("communityStatus"));
  if (normalized.changed) await writeData("communityStatus", normalized.communityStatus);
  return NextResponse.json({ communityStatus: communityId ? normalized.communityStatus.filter((item) => item.communityId === communityId) : normalized.communityStatus });
}

export async function PATCH(request: NextRequest) {
  const { id, level, status, detail } = await request.json();
  const normalized = normalizeCommunityStatus(await readData("communityStatus"));
  const item = normalized.communityStatus.find((entry) => entry.id === id);

  if (!item) {
    return NextResponse.json({ message: "Community status not found." }, { status: 404 });
  }

  if (level && !communityStatusLevels.includes(level)) {
    return NextResponse.json({ message: "Invalid status level." }, { status: 400 });
  }

  item.level = level || item.level;
  item.status = String(status || item.status).trim();
  item.detail = String(detail || item.detail).trim();
  item.updatedAt = new Date().toISOString();

  await writeData("communityStatus", normalized.communityStatus);
  const notifications = await readData("notifications");
  notifications.push({
    id: crypto.randomUUID(),
    communityId: item.communityId,
    userId: "all",
    type: "Community status change",
    title: `${item.name} status updated`,
    body: `${item.status}: ${item.detail}`,
    readBy: [],
    href: "/dashboard",
    createdAt: item.updatedAt,
  });
  await writeData("notifications", notifications);
  return NextResponse.json({ communityStatus: item });
}
