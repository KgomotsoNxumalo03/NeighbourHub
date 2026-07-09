import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data-store";

export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get("userId");
  const communityId = new URL(request.url).searchParams.get("communityId");
  const notifications = await readData("notifications");
  return NextResponse.json({
    notifications: notifications
      .filter((item) => item.userId === "all" || item.userId === userId)
      .filter((item) => (communityId ? item.communityId === communityId : true))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  });
}

export async function PATCH(request: NextRequest) {
  const { id, userId, action } = await request.json();
  const notifications = await readData("notifications");

  for (const notification of notifications) {
    if ((action === "read-all" || notification.id === id) && !notification.readBy.includes(userId)) {
      notification.readBy.push(userId);
    }
  }

  await writeData("notifications", notifications);
  return NextResponse.json({ ok: true });
}
