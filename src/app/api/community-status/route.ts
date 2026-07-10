import { NextRequest, NextResponse } from "next/server";
import { communityStatusLevels } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";
import { toAppCommunityStatusLevel, toDbCommunityStatusLevel } from "@/lib/db-maps";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const communityStatus = await prisma.communityStatus.findMany({
    where: { communityId: session.activeCommunityId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    communityStatus: communityStatus.map((item) => ({
      ...item,
      level: toAppCommunityStatusLevel(item.level),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  if (session.user.role !== "admin" && session.user.role !== "super-admin") {
    return NextResponse.json({ message: "Only admins can update community status." }, { status: 403 });
  }

  const { id, level, status, detail } = await request.json();
  const item = await prisma.communityStatus.findUnique({ where: { id } });

  if (!item || item.communityId !== session.activeCommunityId) {
    return NextResponse.json({ message: "Community status not found." }, { status: 404 });
  }

  if (level && !communityStatusLevels.includes(level)) {
    return NextResponse.json({ message: "Invalid status level." }, { status: 400 });
  }

  const updated = await prisma.communityStatus.update({
    where: { id: item.id },
    data: {
      level: level ? toDbCommunityStatusLevel(level) : item.level,
      status: String(status || item.status).trim(),
      detail: String(detail || item.detail).trim(),
    },
  });

  await prisma.notification.create({
    data: {
      id: crypto.randomUUID(),
      communityId: updated.communityId,
      userId: "all",
      type: "COMMUNITY_STATUS_CHANGE",
      title: `${updated.name} status updated`,
      body: `${updated.status}: ${updated.detail}`,
      href: "/dashboard",
    },
  });

  return NextResponse.json({
    communityStatus: {
      ...updated,
      level: toAppCommunityStatusLevel(updated.level),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}
