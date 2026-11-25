import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data-store";
import { ticketCategories, ticketPriorities, ticketStatuses } from "@/lib/constants";
import type { Notification, Ticket, TicketCategory, TicketPriority, TicketStatus } from "@/lib/types";
import { formatTicketReference, getResolutionTime, isOpenStatus, normalizeTickets, sortTickets } from "@/lib/tickets";

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

  const adminId = searchParams.get("adminId");
  const showStaffNotes = adminId && (await readData("users")).some((user) =>
    user.id === adminId && (user.role === "super-admin" || (user.role === "admin" && user.communityId === communityId)),
  );

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

  const tickets = sortTickets(filtered, sortBy).map((ticket) => ({
    ...ticket,
    photoData: ticketId ? ticket.photoData : undefined,
    adminNotes: showStaffNotes ? ticket.adminNotes : "",
    adminNotesHistory: showStaffNotes ? ticket.adminNotesHistory : [],
    timeline: showStaffNotes ? ticket.timeline : ticket.timeline.filter((event) => event.type !== "admin-note"),
  }));

  return NextResponse.json({ tickets });
}

let pendingTicketUpdate: Promise<unknown> = Promise.resolve();

function queueTicketUpdate(update: () => Promise<NextResponse>) {
  const result = pendingTicketUpdate.then(update);
  pendingTicketUpdate = result.catch(() => undefined);
  return result;
}

export async function POST(request: NextRequest) {
  return queueTicketUpdate(() => createTicket(request));
}

export async function PATCH(request: NextRequest) {
  return queueTicketUpdate(() => updateTicket(request));
}

async function createTicket(request: NextRequest) {
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

  const photoData = body.photoData;
  if (photoData !== undefined && !isValidPhoto(photoData)) {
    return NextResponse.json({ message: "Choose a JPG, PNG or WebP photo up to 2 MB." }, { status: 400 });
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
    photoData,
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

async function updateTicket(request: NextRequest) {
  const { id, status, adminNotes, action, comment, actorName, actorRole, actorId, ownerName, estimatedCompletionAt, dueAt, resolutionNotes } = await request.json();
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
  const staffFields = [status, adminNotes, ownerName, estimatedCompletionAt, dueAt, resolutionNotes];
  const isStaff = (actorRole === "admin" || actorRole === "super-admin") &&
    (await readData("users")).some((user) => user.id === actorId &&
      (user.role === "super-admin" || (user.role === "admin" && user.communityId === ticket.communityId)));
  if (!isStaff && staffFields.some((value) => value !== undefined)) {
    return NextResponse.json({ message: "Staff access is required to update these fields." }, { status: 403 });
  }
  if (dueAt !== undefined && (typeof dueAt !== "string" || (dueAt && !Number.isFinite(Date.parse(dueAt))))) {
    return NextResponse.json({ message: "Enter a valid due date." }, { status: 400 });
  }
  const previousResolution = getResolutionTime(ticket);
  const residentUpdates: string[] = [];
  const notificationsToAdd: Notification[] = [];

  if (action === "comment") {
    const body = String(comment || "").trim();
    if (!body) {
      return NextResponse.json({ message: "Comment cannot be blank." }, { status: 400 });
    }

    ticket.comments.push({
      id: crypto.randomUUID(),
      authorId: actorId || "unknown",
      authorName: actor,
      authorRole: isStaff ? "admin" : "resident",
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
    if (isStaff) {
      notificationsToAdd.push({
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
    if (ticket.status !== "Resolved") {
      return NextResponse.json({ message: "Only resolved tickets can be confirmed." }, { status: 400 });
    }
    ticket.status = "Closed";
    ticket.timeline.push({
      id: crypto.randomUUID(),
      type: "status",
      message: "Resident confirmed resolution",
      actor,
      createdAt: now,
    });
  }

  if (typeof ownerName === "string" && (ownerName.trim() || "Unassigned") !== ticket.ownerName) {
    ticket.ownerName = ownerName.trim() || "Unassigned";
    residentUpdates.push(ticket.ownerName === "Unassigned" ? "Your ticket is awaiting assignment." : `Your ticket was assigned to ${ticket.ownerName}.`);
    ticket.timeline.push({
      id: crypto.randomUUID(),
      type: "status",
      message: `Assigned to ${ticket.ownerName}`,
      actor,
      createdAt: now,
    });
  }

  if (typeof estimatedCompletionAt === "string") {
    ticket.estimatedCompletionAt = estimatedCompletionAt;
  }

  if (typeof dueAt === "string" && dueAt !== (ticket.dueAt || "")) {
    ticket.dueAt = dueAt;
    residentUpdates.push(dueAt ? "The due date was updated." : "The custom due date was cleared.");
  }

  if (typeof resolutionNotes === "string" && resolutionNotes.trim() !== ticket.resolutionNotes) {
    ticket.resolutionNotes = resolutionNotes.trim();
    residentUpdates.push("The resolution notes were updated.");
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
    residentUpdates.push(`Your ticket is now ${ticket.status}.`);
  }

  ticket.resolvedAt = isOpenStatus(ticket.status) ? undefined : previousResolution || now;

  if (residentUpdates.length) {
    notificationsToAdd.push({
      id: crypto.randomUUID(),
      communityId: ticket.communityId,
      userId: ticket.userId,
      type: "Ticket status update",
      title: `${ticket.reference}: maintenance update`,
      body: residentUpdates.join(" "),
      readBy: [],
      href: `/tickets/${ticket.id}`,
      createdAt: now,
    });
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

  if (notificationsToAdd.length) {
    const notifications = await readData("notifications");
    await writeData("notifications", [...notifications, ...notificationsToAdd]);
  }

  return NextResponse.json({
    ticket: isStaff ? ticket : {
      ...ticket,
      adminNotes: "",
      adminNotesHistory: [],
      timeline: ticket.timeline.filter((event) => event.type !== "admin-note"),
    },
  });
}

function isValidPhoto(value: unknown) {
  const maxBytes = 2 * 1024 * 1024;
  if (typeof value !== "string" || value.length > 4 * Math.ceil(maxBytes / 3) + 23) return false;
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;

  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > maxBytes || bytes.toString("base64") !== match[2]) return false;
  if (match[1] === "jpeg") return bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (match[1] === "png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
}
