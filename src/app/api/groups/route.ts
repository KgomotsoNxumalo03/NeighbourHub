import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data-store";

export async function GET(request: NextRequest) {
  const communityId = new URL(request.url).searchParams.get("communityId");
  const groups = await readData("groups");
  return NextResponse.json({ groups: groups.filter((group) => (communityId ? group.communityId === communityId : true)) });
}

export async function PATCH(request: NextRequest) {
  const { id, userId } = await request.json();
  const groups = await readData("groups");
  const group = groups.find((item) => item.id === id);
  if (!group) return NextResponse.json({ message: "Group not found." }, { status: 404 });
  group.members = group.members.includes(userId) ? group.members.filter((item) => item !== userId) : [...group.members, userId];
  await writeData("groups", groups);
  return NextResponse.json({ group });
}
