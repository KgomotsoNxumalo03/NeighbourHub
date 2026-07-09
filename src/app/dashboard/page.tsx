"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Droplets, Lightbulb, PlusCircle, Road, ShieldCheck, Siren } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { getCurrentUser } from "@/lib/client-auth";
import type { Announcement, CommunityStatus, Ticket, Community } from "@/lib/types";
import { isOpenStatus } from "@/lib/tickets";
import type { CommunityEvent, CommunityPost, LostFoundReport, Notification } from "@/lib/types";
import type { BusinessListing, MapMarker, Poll } from "@/lib/types";
import { getStoredCommunityId } from "@/lib/community";

const statusIcons = { Power: Lightbulb, Water: Droplets, Security: ShieldCheck, Roads: Road };

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [communityStatus, setCommunityStatus] = useState<CommunityStatus[]>([]);
  const [feedPosts, setFeedPosts] = useState<CommunityPost[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [lostFound, setLostFound] = useState<LostFoundReport[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [community, setCommunity] = useState<Community | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [businesses, setBusinesses] = useState<BusinessListing[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [now, setNow] = useState(0);
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/tickets?userId=${user.id}&communityId=${communityId}`).then((res) => res.json()).then((data) => setTickets(data.tickets || []));
    fetch(`/api/announcements?communityId=${communityId}`).then((res) => res.json()).then((data) => setAnnouncements(data.announcements || []));
    fetch(`/api/community-status?communityId=${communityId}`).then((res) => res.json()).then((data) => setCommunityStatus(data.communityStatus || []));
    fetch(`/api/feed?communityId=${communityId}`).then((res) => res.json()).then((data) => setFeedPosts(data.posts || []));
    fetch(`/api/events?communityId=${communityId}`).then((res) => res.json()).then((data) => setEvents(data.events || []));
    fetch(`/api/lost-found?communityId=${communityId}`).then((res) => res.json()).then((data) => setLostFound(data.reports || []));
    fetch(`/api/notifications?userId=${user.id}&communityId=${communityId}`).then((res) => res.json()).then((data) => setNotifications(data.notifications || []));
    fetch("/api/communities").then((res) => res.json()).then((data) => setCommunity((data.communities || []).find((item: Community) => item.id === communityId) || null));
    fetch(`/api/polls?communityId=${communityId}`).then((res) => res.json()).then((data) => setPolls(data.polls || []));
    fetch(`/api/businesses?communityId=${communityId}`).then((res) => res.json()).then((data) => setBusinesses(data.businesses || []));
    fetch(`/api/map?communityId=${communityId}`).then((res) => res.json()).then((data) => setMarkers(data.markers || []));
    setNow(Date.now());
  }, [user?.id, communityId]);

  const openTickets = tickets.filter((ticket) => isOpenStatus(ticket.status));
  const emergencyTickets = tickets.filter((ticket) => ticket.priority === "Emergency" && ticket.status !== "Closed");
  const emergencyAnnouncements = announcements.filter((announcement) => announcement.priority === "Emergency");
  const unreadCount = user ? notifications.filter((item) => !item.readBy.includes(user.id)).length : 0;
  const upcomingEvents = events.filter((event) => !now || Date.parse(`${event.date}T${event.time}`) >= now).slice(0, 3);
  const openLostFound = lostFound.filter((item) => item.status === "Open");
  const residentsAffected = tickets.reduce((sum, ticket) => sum + (ticket.supporters?.length || 0), 0);
  const activePolls = polls.filter((poll) => poll.status === "Active");
  const securitySummary = tickets.filter((ticket) => ticket.priority === "Emergency" || ticket.category.includes("Security") || ticket.category.includes("Suspicious")).length;

  return (
    <AppShell allowedRoles={["resident"]}>
      <div className="flex flex-col gap-6">
        <section className="overflow-hidden rounded-lg bg-[#006B3C] text-white shadow-lg shadow-emerald-900/10">
          <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
            <div className="p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold text-white/75">Community command centre</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15 text-sm font-bold">{community?.logo || "NH"}</span>
                <div>
                  <h1 className="text-3xl font-bold">Welcome back, {user?.name || "resident"}</h1>
                  <p className="text-sm font-semibold text-white/75">{community?.name || "Your community"} / {community?.communityType}</p>
                </div>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                Live operations, resident activity, safety signals, and community updates for {community?.name || "your community"}.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/emergency" className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:-translate-y-0.5 hover:bg-red-700">
                <Siren size={18} />
                Emergency
              </Link>
              <Link href="/tickets/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C8A23A] px-5 py-3 text-sm font-bold text-[#1B1B1B] shadow-sm hover:-translate-y-0.5">
                <PlusCircle size={18} />
                Log a ticket
              </Link>
            </div>
          </div>
            </div>
            <div className="border-t border-white/10 bg-white/10 p-6 lg:border-l lg:border-t-0">
              <p className="text-sm font-bold text-white/80">Today&apos;s snapshot</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MiniMetric label="Open" value={openTickets.length} />
                <MiniMetric label="Markers" value={markers.length} />
                <MiniMetric label="Polls" value={activePolls.length} />
                <MiniMetric label="Unread" value={unreadCount} />
              </div>
            </div>
          </div>
        </section>

        {emergencyAnnouncements.length > 0 && (
          <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-950 shadow-sm">
            <div className="flex items-center gap-3">
              <Siren size={22} />
              <h2 className="font-bold">Emergency announcements</h2>
            </div>
            <div className="mt-3 grid gap-3">
              {emergencyAnnouncements.map((announcement) => (
                <article key={announcement.id} className="rounded-lg bg-white/75 p-4">
                  <p className="font-bold">{announcement.title}</p>
                  <p className="mt-1 text-sm leading-6 text-red-900">{announcement.body}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStat title="Open tickets" value={openTickets.length} icon={Clock3} tone="green" />
          <DashboardStat title="Emergency" value={emergencyTickets.length} icon={Siren} tone="red" />
          <DashboardStat title="Residents affected" value={residentsAffected} icon={CheckCircle2} tone="gold" />
          <DashboardStat title="Unread notifications" value={unreadCount} icon={ShieldCheck} tone="neutral" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Operations map preview</h2>
              <Link href="/map" className="text-sm font-bold text-[#006B3C]">Open map</Link>
            </div>
            <div className="relative mt-4 h-56 overflow-hidden rounded-lg bg-[#F7F8FA]">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,#e4e7eb_1px,transparent_1px),linear-gradient(#e4e7eb_1px,transparent_1px)] bg-[size:34px_34px]" />
              {markers.slice(0, 10).map((marker) => (
                <span key={marker.id} className={`absolute h-3 w-3 rounded-full ring-4 ring-white ${marker.type === "Emergency" ? "bg-red-600" : marker.type === "Event" ? "bg-[#C8A23A]" : "bg-[#006B3C]"}`} style={{ left: `${marker.x}%`, top: `${marker.y}%` }} />
              ))}
            </div>
          </div>
          <DashboardPanel title="Security posture" href="/security">
            <div className="rounded-lg bg-red-50 p-4 text-red-900">
              <p className="text-3xl font-bold">{securitySummary}</p>
              <p className="mt-1 text-sm">Security-related items</p>
            </div>
          </DashboardPanel>
          <DashboardPanel title="Engagement" href="/polls">
            <div className="rounded-lg bg-[#C8A23A]/10 p-4">
              <p className="text-3xl font-bold">{activePolls.length + feedPosts.length}</p>
              <p className="mt-1 text-sm text-zinc-600">Active polls and feed posts</p>
            </div>
          </DashboardPanel>
        </section>

        {emergencyTickets.length > 0 && (
          <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-900">
            <div className="flex items-center gap-3">
              <AlertTriangle size={22} />
              <h2 className="font-bold">Urgent alerts</h2>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {emergencyTickets.slice(0, 2).map((ticket) => (
                <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="rounded-lg bg-white/70 p-3 text-sm font-semibold hover:bg-white">
                  {ticket.reference}: {ticket.title}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {communityStatus.map((item) => {
            const Icon = statusIcons[item.name];
            return (
              <div key={item.id} className={`rounded-lg border bg-white p-5 shadow-sm hover:shadow-md ${item.level === "Critical" ? "border-red-200 ring-2 ring-red-100" : item.level === "Warning" ? "border-[#C8A23A]/50" : "border-zinc-200"}`}>
                <div className="flex items-center justify-between">
                  <Icon className="text-[#006B3C]" size={24} />
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${item.level === "Critical" ? "bg-red-100 text-red-800" : item.level === "Warning" ? "bg-[#C8A23A]/15 text-[#7A5C08]" : "bg-emerald-50 text-[#006B3C]"}`}>{item.level}</span>
                </div>
                <h2 className="mt-4 font-bold">{item.name}</h2>
                <p className="mt-1 text-sm font-semibold text-zinc-800">{item.status}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{item.detail}</p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Recent tickets</h2>
              <Link href="/tickets" className="flex items-center gap-1 text-sm font-bold text-[#006B3C]">View all <ArrowRight size={16} /></Link>
            </div>
            <div className="mt-4 space-y-3">
              {tickets.slice(0, 4).map((ticket) => (
                <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block rounded-lg border border-zinc-100 bg-[#F7F8FA] p-4 hover:bg-white hover:shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">{ticket.reference}: {ticket.title}</p>
                    <div className="flex gap-2"><StatusBadge value={ticket.status} /><PriorityBadge value={ticket.priority} /></div>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">{ticket.category} at {ticket.location}</p>
                </Link>
              ))}
              {tickets.length === 0 && <p className="rounded-lg bg-[#F7F8FA] p-4 text-sm text-zinc-600">No tickets logged yet.</p>}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Latest announcements</h2>
            <div className="mt-4 space-y-3">
              {announcements.slice(0, 3).map((announcement) => (
                <article key={announcement.id} className="rounded-lg border border-zinc-100 bg-[#F7F8FA] p-4">
                  <p className="font-bold">{announcement.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{announcement.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <DashboardPanel title="Map preview" href="/map">
            <div className="rounded-lg bg-[#F7F8FA] p-4">
              <p className="text-3xl font-bold">{markers.length}</p>
              <p className="mt-1 text-sm text-zinc-600">Operational markers across your community</p>
            </div>
          </DashboardPanel>
          <DashboardPanel title="Latest community posts" href="/feed">
            {feedPosts.slice(0, 3).map((post) => (
              <Link key={post.id} href="/feed" className="block rounded-lg bg-[#F7F8FA] p-4 hover:bg-white">
                <p className="text-sm font-bold">{post.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{post.type} / {post.authorName}</p>
              </Link>
            ))}
            {feedPosts.length === 0 && <p className="text-sm text-zinc-600">No posts yet.</p>}
          </DashboardPanel>

          <DashboardPanel title="Upcoming events" href="/events">
            {upcomingEvents.map((event) => (
              <Link key={event.id} href="/events" className="block rounded-lg bg-[#F7F8FA] p-4 hover:bg-white">
                <p className="text-sm font-bold">{event.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{event.date} at {event.time}</p>
              </Link>
            ))}
            {upcomingEvents.length === 0 && <p className="text-sm text-zinc-600">No upcoming events.</p>}
          </DashboardPanel>

          <DashboardPanel title="Lost and found" href="/lost-found">
            <div className="rounded-lg bg-[#F7F8FA] p-4">
              <p className="text-3xl font-bold">{openLostFound.length}</p>
              <p className="mt-1 text-sm text-zinc-600">Open reports in the community</p>
            </div>
            {openLostFound.slice(0, 2).map((item) => (
              <Link key={item.id} href="/lost-found" className="block rounded-lg bg-[#F7F8FA] p-4 hover:bg-white">
                <p className="text-sm font-bold">{item.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{item.type} / {item.location}</p>
              </Link>
            ))}
          </DashboardPanel>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <DashboardPanel title="Active polls" href="/polls">
            {activePolls.slice(0, 2).map((poll) => <p key={poll.id} className="rounded-lg bg-[#F7F8FA] p-4 text-sm font-bold">{poll.question}</p>)}
            {activePolls.length === 0 && <p className="text-sm text-zinc-600">No active polls.</p>}
          </DashboardPanel>
          <DashboardPanel title="Business highlights" href="/businesses">
            {businesses.slice(0, 2).map((biz) => <p key={biz.id} className="rounded-lg bg-[#F7F8FA] p-4 text-sm font-bold">{biz.name} <span className="block text-xs font-medium text-zinc-500">{biz.category}</span></p>)}
            {businesses.length === 0 && <p className="text-sm text-zinc-600">No businesses yet.</p>}
          </DashboardPanel>
          <DashboardPanel title="Security summary" href="/security">
            <div className="rounded-lg bg-red-50 p-4 text-red-900">
              <p className="text-3xl font-bold">{securitySummary}</p>
              <p className="mt-1 text-sm">Security-related items to watch</p>
            </div>
          </DashboardPanel>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Recent activity</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {tickets.flatMap((ticket) => ticket.timeline.slice(-1).map((event) => (
              <Link key={`${ticket.id}-${event.id}`} href={`/tickets/${ticket.id}`} className="rounded-lg bg-[#F7F8FA] p-4 hover:bg-zinc-50">
                <p className="text-sm font-bold">{ticket.reference}: {event.message}</p>
                <p className="mt-1 text-xs text-zinc-500">{new Date(event.createdAt).toLocaleString()}</p>
              </Link>
            ))).slice(0, 4)}
            {tickets.length === 0 && <p className="text-sm text-zinc-600">No activity yet.</p>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white/10 p-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-semibold text-white/70">{label}</p>
    </div>
  );
}

function DashboardPanel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link href={href} className="text-sm font-bold text-[#006B3C]">Open</Link>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function DashboardStat({ title, value, icon: Icon, tone }: { title: string; value: number; icon: React.ElementType; tone: "green" | "red" | "gold" | "neutral" }) {
  const toneClass = {
    green: "bg-emerald-50 text-[#006B3C]",
    red: "bg-red-50 text-red-700",
    gold: "bg-[#C8A23A]/15 text-[#7A5C08]",
    neutral: "bg-zinc-100 text-zinc-700",
  }[tone];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-600">{title}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}
