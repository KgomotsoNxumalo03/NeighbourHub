import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data-store";
import type { Poll } from "@/lib/types";

export async function GET(request: NextRequest) {
  const communityId = new URL(request.url).searchParams.get("communityId");
  const polls = await readData("polls");
  return NextResponse.json({ polls: polls.filter((poll) => (communityId ? poll.communityId === communityId : true)).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const question = String(body.question || "").trim();
  const options = String(body.options || "").split("\n").map((item) => item.trim()).filter(Boolean);
  if (!question || options.length < 2) return NextResponse.json({ message: "A question and at least two options are required." }, { status: 400 });
  const now = new Date().toISOString();
  const poll: Poll = {
    id: crypto.randomUUID(),
    communityId: body.communityId || "community-oakridge",
    question,
    options: options.map((label) => ({ id: crypto.randomUUID(), label, votes: [] })),
    status: "Active",
    createdBy: body.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  const polls = await readData("polls");
  polls.push(poll);
  await writeData("polls", polls);
  return NextResponse.json({ poll }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { id, optionId, userId, status } = await request.json();
  const polls = await readData("polls");
  const poll = polls.find((item) => item.id === id);
  if (!poll) return NextResponse.json({ message: "Poll not found." }, { status: 404 });
  if (status) poll.status = status;
  if (optionId && poll.status === "Active") {
    for (const option of poll.options) option.votes = option.votes.filter((vote) => vote !== userId);
    poll.options.find((option) => option.id === optionId)?.votes.push(userId);
  }
  poll.updatedAt = new Date().toISOString();
  await writeData("polls", polls);
  return NextResponse.json({ poll });
}
