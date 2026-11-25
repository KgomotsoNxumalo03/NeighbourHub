import { NextRequest, NextResponse } from "next/server";
import { readData } from "@/lib/data-store";
import { areaFromLocation, getResolutionTime, getTicketSla, isMaintenanceOverdue, isUnassigned, normalizeTickets } from "@/lib/tickets";
import { ticketCategories, ticketPriorities, ticketStatuses } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const communityId = params.get("communityId");
  const normalized = normalizeTickets(await readData("tickets"));

  const tickets = communityId ? normalized.tickets.filter((ticket) => ticket.communityId === communityId) : normalized.tickets;
  const byStatus = ticketStatuses.map((status) => ({
    label: status,
    count: tickets.filter((ticket) => ticket.status === status).length,
  }));
  const byCategory = ticketCategories.map((category) => ({
    label: category,
    count: tickets.filter((ticket) => ticket.category === category).length,
  })).filter((item) => item.count > 0);
  const byPriority = ticketPriorities.map((priority) => ({
    label: priority,
    count: tickets.filter((ticket) => ticket.priority === priority).length,
  }));
  const now = Date.now();
  const weekStart = now - 7 * 24 * 60 * 60 * 1000;
  const summarize = ({ id, reference, title, priority, status, location, residentName, ownerName }: (typeof tickets)[number]) =>
    ({ id, reference, title, priority, status, location, residentName, ownerName });
  const emergencyTickets = tickets.filter((ticket) => ticket.priority === "Emergency").map(summarize);
  const overdueTickets = tickets.filter((ticket) => isMaintenanceOverdue(ticket, now)).map(summarize);
  const unassignedTickets = tickets.filter(isUnassigned).map(summarize);
  const resolutionTimes = tickets.map((ticket) => {
    const resolvedAt = getResolutionTime(ticket);
    return resolvedAt ? Date.parse(resolvedAt) : NaN;
  });
  const resolvedCount = resolutionTimes.filter(Number.isFinite).length;
  const durations = resolutionTimes.flatMap((resolvedAt, index) =>
    resolvedAt >= weekStart && resolvedAt <= now ? [(resolvedAt - Date.parse(tickets[index].createdAt)) / 3600000] : [],
  );
  const averageResolutionHours = durations.length ? Math.round(durations.reduce((sum, hours) => sum + hours, 0) / durations.length) : null;

  if (params.get("format") === "csv") {
    if (!communityId) return NextResponse.json({ message: "Select a community to export." }, { status: 400 });

    const rows = [
      ["Reference", "Title", "Location", "Priority", "Status", "Assignee", "Opened (UTC)", "Due (UTC)", "Resolved (UTC)", "Hours to resolve", "Opened this week", "Resolved this week", "Currently overdue", "Currently unassigned"],
    ];
    for (const [index, ticket] of tickets.entries()) {
      const openedAt = Date.parse(ticket.createdAt);
      const resolvedAt = resolutionTimes[index];
      const openedThisWeek = openedAt >= weekStart && openedAt <= now;
      const resolvedThisWeek = resolvedAt >= weekStart && resolvedAt <= now;
      const overdue = isMaintenanceOverdue(ticket, now);
      const unassigned = isUnassigned(ticket);
      if (!openedThisWeek && !resolvedThisWeek && !overdue && !unassigned) continue;

      rows.push([
        ticket.reference, ticket.title, ticket.location, ticket.priority, ticket.status, ticket.ownerName,
        ticket.createdAt, ticket.dueAt || getTicketSla(ticket).dueAt,
        getResolutionTime(ticket) || "", Number.isFinite(resolvedAt) ? ((resolvedAt - openedAt) / 3600000).toFixed(1) : "",
        openedThisWeek ? "Yes" : "No", resolvedThisWeek ? "Yes" : "No", overdue ? "Yes" : "No", unassigned ? "Yes" : "No",
      ]);
    }
    const csv = rows.map((row) => row.map((value) => {
      const safe = /^(?:\s*[=+@-]|[\t\r\n])/.test(value) ? `'${value}` : value;
      return `"${safe.replaceAll('"', '""')}"`;
    }).join(",")).join("\r\n");

    return new NextResponse(`\uFEFF${csv}\r\n`, { headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="maintenance-weekly-${new Date(now).toISOString().slice(0, 10)}.csv"`,
    } });
  }
  const areaCounts = Object.entries(
    tickets.reduce<Record<string, number>>((acc, ticket) => {
      const area = areaFromLocation(ticket.location);
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {}),
  )
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
  const recentAdminActivity = tickets
    .flatMap((ticket) =>
      ticket.timeline
        .filter((event) => event.actor.toLowerCase().includes("admin") || event.type === "admin-note" || event.type === "status")
        .map((event) => ({ ...event, ticketId: ticket.id, reference: ticket.reference, title: ticket.title })),
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 8);

  return NextResponse.json({
    byStatus,
    byCategory,
    byPriority,
    emergencyTickets,
    overdueTickets,
    unassignedTickets,
    openedVsResolved: [
      { label: "Opened", count: tickets.length },
      { label: "Resolved", count: resolvedCount },
    ],
    mostReportedAreas: areaCounts.slice(0, 6),
    averageResolutionHours,
    recentAdminActivity,
  });
}
