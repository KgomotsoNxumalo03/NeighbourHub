import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data-store";

export async function GET() {
  const communities = await readData("communities");
  return NextResponse.json({ communities });
}

export async function PATCH(request: NextRequest) {
  const { id, name, logo, coverImage, description, primaryColour } = await request.json();
  const communities = await readData("communities");
  const community = communities.find((item) => item.id === id);

  if (!community) return NextResponse.json({ message: "Community not found." }, { status: 404 });

  community.name = String(name || community.name).trim();
  community.logo = String(logo || community.logo).trim();
  community.coverImage = String(coverImage || community.coverImage).trim();
  community.description = String(description || community.description).trim();
  community.primaryColour = String(primaryColour || community.primaryColour).trim();
  community.updatedAt = new Date().toISOString();

  await writeData("communities", communities);
  return NextResponse.json({ community });
}
