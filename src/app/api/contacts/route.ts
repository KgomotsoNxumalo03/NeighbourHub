import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data-store";

export async function GET(request: NextRequest) {
  const communityId = new URL(request.url).searchParams.get("communityId");
  const contacts = await readData("contacts");
  return NextResponse.json({ contacts: communityId ? contacts.filter((item) => item.communityId === communityId) : contacts });
}

export async function PATCH(request: NextRequest) {
  const { id, name, phone, detail } = await request.json();
  const contacts = await readData("contacts");
  const contact = contacts.find((item) => item.id === id);
  if (!contact) return NextResponse.json({ message: "Contact not found." }, { status: 404 });

  contact.name = String(name || contact.name).trim();
  contact.phone = String(phone || contact.phone).trim();
  contact.detail = String(detail || contact.detail).trim();
  await writeData("contacts", contacts);
  return NextResponse.json({ contact });
}
