"use client";

import { useEffect, useState } from "react";
import type { ElementType } from "react";
import { Activity, AlertTriangle, BarChart3, Clock3, MapPin, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/client-auth";
import { getStoredCommunityId } from "@/lib/community";
import { areaFromLocation } from "@/lib/tickets";
import type { CommunityEvent, CommunityPost, Poll, Ticket, VolunteerGroup } from "@/lib/types";

export default function InsightsPage() {
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [insights, setInsights] = useState({
    commonIssue: "No issue data yet",
    trend: "No comparison available",
    response: "N/A",
    area: "No active area",
    risk: "No risk category",
    engagement: "No engagement yet",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/tickets?communityId=${communityId}`).then((res) => res.json()),
      fetch(`/api/feed?communityId=${communityId}`).then((res) => res.json()),
      fetch(`/api/events?communityId=${communityId}`).then((res) => res.json()),
      fetch(`/api/polls?communityId=${communityId}`).then((res) => res.json()),
      fetch(`/api/groups?communityId=${communityId}`).then((res) => res.json()),
    ]).then(([ticketsData, feedData, eventsData, pollsData, groupsData]) => {
      const tickets: Ticket[] = ticketsData.tickets || [];
      const posts: CommunityPost[] = feedData.posts || [];
      const events: CommunityEvent[] = eventsData.events || [];
      const polls: Poll[] = pollsData.polls || [];
      const groups: VolunteerGroup[] = groupsData.groups || [];
      const byCategory = topCount(tickets.map((ticket) => ticket.category));
      const byArea = topCount(tickets.map((ticket) => areaFromLocation(ticket.location)));
      const risk = topCount(tickets.filter((ticket) => ticket.priority === "Emergency" || ticket.priority === "High").map((ticket) => ticket.category));
      const now = Date.now();
      const week = 7 * 86400000;
      const thisWeek = tickets.filter((ticket) => now - Date.parse(ticket.createdAt) <= week).length;
      const previousWeek = tickets.filter((ticket) => now - Date.parse(ticket.createdAt) > week && now - Date.parse(ticket.createdAt) <= week * 2).length;
      const resolved = tickets.filter((ticket) => ticket.status === "Resolved" || ticket.status === "Closed");
      const averageHours = resolved.length ? Math.round(resolved.reduce((sum, ticket) => sum + (Date.parse(ticket.updatedAt) - Date.parse(ticket.createdAt)) / 3600000, 0) / resolved.length) : null;
      setInsights({
        commonIssue: byCategory ? `${byCategory.label} (${byCategory.count})` : "No issue data yet",
        trend: previousWeek === 0 ? `${thisWeek} tickets opened this week` : `${thisWeek >= previousWeek ? "Increased" : "Decreased"} from ${previousWeek} to ${thisWeek}`,
        response: averageHours === null ? "N/A" : `${averageHours} hours`,
        area: byArea ? `${byArea.label} (${byArea.count})` : "No active area",
        risk: risk ? `${risk.label} (${risk.count})` : "No high-risk category",
        engagement: `${posts.length} posts / ${events.reduce((sum, event) => sum + event.rsvps.length, 0)} RSVPs / ${polls.length} polls / ${groups.reduce((sum, group) => sum + group.members.length, 0)} group joins`,
      });
    });
  }, [communityId]);

  return (
    <AppShell allowedRoles={["resident", "admin"]}>
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#006B3C]">Automatically generated</p>
        <h1 className="mt-1 text-3xl font-bold">Community insights</h1>
        <p className="mt-2 text-sm text-zinc-600">Simple operational intelligence from existing community data.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Insight title="Most common issue this week" value={insights.commonIssue} icon={BarChart3} />
        <Insight title="Tickets trend" value={insights.trend} icon={Activity} />
        <Insight title="Average response time" value={insights.response} icon={Clock3} />
        <Insight title="Most active area" value={insights.area} icon={MapPin} />
        <Insight title="Highest risk category" value={insights.risk} icon={AlertTriangle} />
        <Insight title="Engagement summary" value={insights.engagement} icon={Users} />
      </div>
    </AppShell>
  );
}

function topCount(values: string[]) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)[0];
}

function Insight({ title, value, icon: Icon }: { title: string; value: string; icon: ElementType }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C8A23A]/15 text-[#006B3C]"><Icon size={20} /></span>
      <p className="mt-4 text-sm font-semibold text-zinc-500">{title}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}
