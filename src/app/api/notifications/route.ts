import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";
import { toNotificationType } from "@/lib/db-maps";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: {
      communityId: session.activeCommunityId,
      OR: [{ userId: "all" }, { userId: session.user.id }],
    },
    include: {
      reads: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    notifications: notifications.map((item) => ({
      id: item.id,
      communityId: item.communityId,
      userId: item.userId,
      type: toNotificationType(item.type),
      title: item.title,
      body: item.body,
      readBy: item.reads.map((read) => read.userId),
      href: item.href,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { id, action } = await request.json();
  const notificationIds = action === "read-all"
    ? (await prisma.notification.findMany({
        where: {
          communityId: session.activeCommunityId,
          OR: [{ userId: "all" }, { userId: session.user.id }],
        },
        select: { id: true },
      })).map((item) => item.id)
    : [String(id || "")];

  const ids = notificationIds.filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ ok: true });
  }

  await prisma.$transaction(
    ids.map((notificationId) =>
      prisma.notificationRead.upsert({
        where: {
          notificationId_userId: {
            notificationId,
            userId: session.user.id,
          },
        },
        create: {
          id: crypto.randomUUID(),
          notificationId,
          userId: session.user.id,
        },
        update: {},
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
