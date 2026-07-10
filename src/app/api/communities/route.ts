import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";
import { toAppCommunityType } from "@/lib/db-maps";

export async function GET() {
  const communities = await prisma.community.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    communities: communities.map((community) => ({
      ...community,
      communityType: toAppCommunityType(community.communityType),
      createdAt: community.createdAt.toISOString(),
      updatedAt: community.updatedAt.toISOString(),
    })),
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  if (session.user.role !== "admin" && session.user.role !== "super-admin") {
    return NextResponse.json({ message: "Only admins can update community settings." }, { status: 403 });
  }

  const { name, logo, coverImage, description, primaryColour } = await request.json();
  const communityId = session.activeCommunityId;

  const community = await prisma.community.findUnique({ where: { id: communityId } });
  if (!community) {
    return NextResponse.json({ message: "Community not found." }, { status: 404 });
  }

  const updated = await prisma.community.update({
    where: { id: community.id },
    data: {
      name: String(name || community.name).trim(),
      logo: String(logo || community.logo).trim(),
      coverImage: String(coverImage || community.coverImage).trim(),
      description: String(description || community.description).trim(),
      primaryColour: String(primaryColour || community.primaryColour).trim(),
    },
  });

  return NextResponse.json({
    community: {
      ...updated,
      communityType: toAppCommunityType(updated.communityType),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}
