import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data-store";
import type { ResidentProfile } from "@/lib/types";

export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get("userId");
  const communityId = new URL(request.url).searchParams.get("communityId");
  const profiles = await readData("residentProfiles");
  return NextResponse.json({
    profiles: profiles.filter((profile) => (communityId ? profile.communityId === communityId : true)).filter((profile) => profile.visible || profile.userId === userId),
  });
}

export async function PATCH(request: NextRequest) {
  const { userId, name, visible, area, contactPreference, communityId } = await request.json();
  const profiles = await readData("residentProfiles");
  let profile = profiles.find((item) => item.userId === userId);

  if (!profile) {
    profile = {
      userId,
      name,
      communityId,
      visible: false,
      area: "",
      contactPreference: "",
      updatedAt: new Date().toISOString(),
    };
    profiles.push(profile);
  }

  profile.name = String(name || profile.name).trim();
  profile.visible = Boolean(visible);
  profile.area = String(area || "").trim();
  profile.contactPreference = String(contactPreference || "").trim();
  profile.updatedAt = new Date().toISOString();

  await writeData("residentProfiles", profiles as ResidentProfile[]);
  return NextResponse.json({ profile });
}
