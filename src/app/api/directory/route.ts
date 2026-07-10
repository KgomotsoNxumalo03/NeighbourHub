import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const profiles = await prisma.residentProfile.findMany({
    where: { communityId: session.activeCommunityId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    profiles: profiles
      .filter((profile) => session.user.role !== "resident" || profile.visible || profile.userId === session.user.id)
      .map((profile) => ({
        ...profile,
        updatedAt: profile.updatedAt.toISOString(),
      })),
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { name, visible, area, contactPreference } = await request.json();
  const profile = await prisma.residentProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      communityId: session.activeCommunityId,
      name: String(name || session.user.name).trim(),
      visible: Boolean(visible),
      area: String(area || "").trim(),
      contactPreference: String(contactPreference || "").trim(),
      updatedAt: new Date(),
    },
    update: {
      name: String(name || session.user.name).trim(),
      visible: Boolean(visible),
      area: String(area || "").trim(),
      contactPreference: String(contactPreference || "").trim(),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    profile: {
      ...profile,
      updatedAt: profile.updatedAt.toISOString(),
    },
  });
}
