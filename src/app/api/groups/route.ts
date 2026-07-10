import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const groups = await prisma.volunteerGroup.findMany({
    where: { communityId: session.activeCommunityId },
    include: { members: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    groups: groups.map((group) => ({
      id: group.id,
      communityId: group.communityId,
      name: group.name,
      description: group.description,
      upcomingActivity: group.upcomingActivity,
      members: group.members.map((member) => member.userId),
      createdAt: group.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { id } = await request.json();
  const group = await prisma.volunteerGroup.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!group || group.communityId !== session.activeCommunityId) {
    return NextResponse.json({ message: "Group not found." }, { status: 404 });
  }

  const membership = group.members.find((member) => member.userId === session.user.id);

  if (membership) {
    await prisma.groupMembership.delete({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id,
        },
      },
    });
  } else {
    await prisma.groupMembership.create({
      data: {
        id: crypto.randomUUID(),
        groupId: group.id,
        userId: session.user.id,
      },
    });
  }

  const updatedGroup = await prisma.volunteerGroup.findUnique({
    where: { id: group.id },
    include: { members: true },
  });

  return NextResponse.json({
    group: {
      id: updatedGroup?.id,
      communityId: updatedGroup?.communityId,
      name: updatedGroup?.name,
      description: updatedGroup?.description,
      upcomingActivity: updatedGroup?.upcomingActivity,
      members: updatedGroup?.members.map((member) => member.userId) || [],
      createdAt: updatedGroup?.createdAt.toISOString() || new Date().toISOString(),
    },
  });
}
