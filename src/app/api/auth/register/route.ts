import { NextRequest, NextResponse } from "next/server";
import { readData, toPublicUser, writeData } from "@/lib/data-store";
import type { User } from "@/lib/types";

export async function POST(request: NextRequest) {
  const { name, email, password, communityId, address } = await request.json();
  const cleanEmail = String(email || "").toLowerCase().trim();

  if (!name || !cleanEmail || !password || !communityId) {
    return NextResponse.json({ message: "Name, email, and password are required." }, { status: 400 });
  }

  const users = await readData("users");
  const existing = users.find((user) => user.email.toLowerCase() === cleanEmail);

  if (existing) {
    return NextResponse.json({ message: "An account already exists for this email." }, { status: 409 });
  }

  const user: User = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: cleanEmail,
    password: String(password),
    role: "resident",
    communityId: String(communityId),
    address: address || {},
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeData("users", users);

  return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
}
