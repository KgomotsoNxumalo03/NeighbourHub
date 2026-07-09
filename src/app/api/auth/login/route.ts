import { NextRequest, NextResponse } from "next/server";
import { readData, toPublicUser } from "@/lib/data-store";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const users = await readData("users");
  const user = users.find(
    (item) => item.email.toLowerCase() === String(email).toLowerCase().trim() && item.password === password,
  );

  if (!user) {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }

  return NextResponse.json({ user: toPublicUser(user) });
}
