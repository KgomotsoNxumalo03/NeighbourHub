import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data-store";
import { ticketCategories, ticketPriorities, ticketStatuses } from "@/lib/constants";
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from "@/lib/types";
import { formatTicketReference, normalizeTickets, sortTickets } from "@/lib/tickets";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const priority = searchParams.get("priority");
  const search = searchParams.get("search")?.toLowerCase().trim();
  const sortBy = searchParams.get("sort") || "updated";
  const ticketId = searchParams.get("id");
  const communityId = searchParams.get("communityId");
  const rawTickets = await readData("tickets");
  const normalized = normalizeTickets(rawTickets);

  if (normalized.changed) {
    await writeData("tickets", normalized.tickets);
  }

  const filtered = normalized.tickets
    .filter((ticket) => (ticketId ? ticket.id === ticketId : true))
    .filter((ticket) => (communityId ? ticket.communityId === communityId : true))
    .filter((ticket) => (userId ? ticket.userId === userId : true))
    .filter((ticket) => (status ? ticket.status === status : true))
    .filter((ticket) => (category ? ticket.category === category : true))
    .filter((ticket) => (priority ? ticket.priority === priority : true))
    .filter((ticket) => {
      if (!search) return true;
      return [
        ticket.reference,
        ticket.title,
        ticket.description,
        ticket.location,
        ticket.category,
        ticket.residentName,
        ticket.status,
        ticket.priority,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return NextResponse.json({ tickets: sortTickets(filtered, sortBy) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const location = String(body.location || "").trim();

  if (!body.userId || !body.residentName || !title || !description || !location) {
    return NextResponse.json({ message: "Please complete all required ticket fields." }, { status: 400 });
  }

  if (!ticketCategories.includes(body.category as TicketCategory)) {
    return NextResponse.json({ message: "Invalid ticket category." }, { status: 400 });
  }

  if (!ticketPriorities.includes(body.priority as TicketPriority)) {
    return NextResponse.json({ message: "Invalid ticket priority." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const tickets = await readData("tickets");
  const reference = formatTicketReference(tickets.length);
  const ticket: Ticket = {
    id: crypto.randomUUID(),
    communityId: body.communityId || "community-oakridge",
    reference,
    userId: body.userId,
    residentName: body.residentName,
    title,
    description,
    category: body.category,
    priority: body.priority,
    location,
    imageName: String(body.imageName || "").trim(),
    imagePreview: String(body.imagePreview || body.imageName || "").trim(),
    status: "New",
    ownerName: "Unassigned",
    supporters: [],
    adminNotes: "",
    adminNotesHistory: [],
    comments: [],
    timeline: [
      {
        id: crypto.randomUUID(),
        type: "created",
        message: `Ticket ${reference} created`,
        actor: body.residentName,
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  tickets.push(ticket);
  await writeData("tickets", tickets);

  return NextResponse.json({ ticket }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { id, status, adminNotes, action, comment, actorName, actorRole, actorId, ownerName } = await request.json();
  const rawTickets = await readData("tickets");
  const normalized = normalizeTickets(rawTickets);
  const tickets = normalized.tickets;
  const ticket = tickets.find((item) => item.id === id);

  if (!ticket) {
    return NextResponse.json({ message: "Ticket not found." }, { status: 404 });
  }

  if (status && !ticketStatuses.includes(status as TicketStatus)) {
    return NextResponse.json({ message: "Invalid ticket status." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const actor = String(actorName || "NeighbourHub");

  if (action === "comment") {
    const body = String(comment || "").trim();
    if (!body) {
      return NextResponse.json({ message: "Comment cannot be blank." }, { status: 400 });
    }

    ticket.comments.push({
      id: crypto.randomUUID(),
      authorId: actorId || "unknown",
      authorName: actor,
      authorRole: actorRole === "admin" ? "admin" : "resident",
      body,
      createdAt: now,
    });
    ticket.timeline.push({
      id: crypto.randomUUID(),
      type: "comment",
      message: "Comment added",
      actor,
      createdAt: now,
    });
    if (actorRole === "admin") {
      const notifications = await readData("notifications");
      notifications.push({
        id: crypto.randomUUID(),
        communityId: ticket.communityId,
        userId: ticket.userId,
        type: "Admin comment",
        title: `${ticket.reference}: new admin comment`,
        body,
        readBy: [],
        href: `/tickets/${ticket.id}`,
        createdAt: now,
      });
      await writeData("notifications", notifications);
    }
  }

  if (action === "reopen") {
    if (ticket.status !== "Resolved" && ticket.status !== "Closed") {
      return NextResponse.json({ message: "Only resolved or closed tickets can be reopened." }, { status: 400 });
    }

    ticket.status = "Reopened";
    ticket.timeline.push({
      id: crypto.randomUUID(),
      type: "reopened",
      message: "Ticket reopened by resident",
      actor,
      createdAt: now,
    });
  }

  if (action === "support") {
    if (actorId && !ticket.supporters.includes(actorId)) ticket.supporters.push(actorId);
    ticket.timeline.push({
      id: crypto.randomUUID(),
      type: "comment",
      message: "Resident marked as affected",
      actor,
      createdAt: now,
    });
  }

  if (action === "confirm-resolution") {
    ticket.status = "Closed";
    ticket.timeline.push({
      id: crypto.randomUUID(),
      type: "status",
      message: "Resident confirmed resolution",
      actor,
      createdAt: now,
    });
  }

  if (typeof ownerName === "string" && ownerName.trim() && ownerName.trim() !== ticket.ownerName) {
    ticket.ownerName = ownerName.trim();
    ticket.timeline.push({
      id: crypto.randomUUID(),
      type: "status",
      message: `Assigned to ${ticket.ownerName}`,
      actor,
      createdAt: now,
    });
  }

  if (status && status !== ticket.status) {
    const previous = ticket.status;
    ticket.status = status as TicketStatus;
    ticket.timeline.push({
      id: crypto.randomUUID(),
      type: "status",
      message: `Status changed from ${previous} to ${ticket.status}`,
      actor,
      createdAt: now,
    });
    const notifications = await readData("notifications");
    notifications.push({
      id: crypto.randomUUID(),
      communityId: ticket.communityId,
      userId: ticket.userId,
      type: "Ticket status update",
      title: `${ticket.reference}: status updated`,
      body: `Your ticket is now ${ticket.status}.`,
      readBy: [],
      href: `/tickets/${ticket.id}`,
      createdAt: now,
    });
    await writeData("notifications", notifications);
  }

  if (typeof adminNotes === "string") {
    const note = adminNotes.trim();
    if (note && note !== ticket.adminNotes) {
      ticket.adminNotesHistory.push({
        id: crypto.randomUUID(),
        note,
        actor,
        createdAt: now,
      });
      ticket.timeline.push({
        id: crypto.randomUUID(),
        type: "admin-note",
        message: "Admin note added",
        actor,
        createdAt: now,
      });
    }
    ticket.adminNotes = note;
  }

  ticket.updatedAt = new Date().toISOString();

  await writeData("tickets", tickets);

  return NextResponse.json({ ticket });
}
