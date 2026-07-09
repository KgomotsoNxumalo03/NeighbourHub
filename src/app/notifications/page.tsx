"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CalendarDays, CheckCheck, Megaphone, ShieldAlert, Ticket } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/client-auth";
import { getStoredCommunityId } from "@/lib/community";
import { formatDate } from "@/lib/format";
import type { Notification } from "@/lib/types";

const filters = ["All", "Unread", "Emergency", "Tickets", "Events", "Announcements"];

function groupLabel(date: string) {
  const today = new Date();
  const value = new Date(date);
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startValue = new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diff = Math.round((startToday - startValue) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return "Earlier";
}

function iconFor(type: string) {
  if (type.includes("Emergency")) return ShieldAlert;
  if (type.includes("Ticket") || type.includes("Admin")) return Ticket;
  if (type.includes("Event")) return CalendarDays;
  if (type.includes("announcement")) return Megaphone;
  return Bell;
}

export default function NotificationsPage() {
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState("All");

  async function loadNotifications() {
    if (!user) return;
    const response = await fetch(`/api/notifications?userId=${user.id}&communityId=${communityId}`);
    const data = await response.json();
    setNotifications(data.notifications || []);
  }

  useEffect(() => {
    loadNotifications();
  }, [user?.id, communityId]);

  async function markRead(id?: string) {
    if (!user) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, userId: user.id, action: id ? "read" : "read-all" }),
    });
    await loadNotifications();
  }

  const filtered = notifications.filter((item) => {
    const unread = user ? !item.readBy.includes(user.id) : false;
    if (filter === "Unread") return unread;
    if (filter === "Emergency") return item.type.includes("Emergency");
    if (filter === "Tickets") return item.type.includes("Ticket") || item.type.includes("Admin");
    if (filter === "Events") return item.type.includes("event") || item.type.includes("Event");
    if (filter === "Announcements") return item.type.includes("announcement");
    return true;
  });
  const grouped = ["Today", "Yesterday", "Earlier"].map((label) => ({
    label,
    items: filtered.filter((item) => groupLabel(item.createdAt) === label),
  })).filter((group) => group.items.length > 0);

  return (
    <AppShell allowedRoles={["resident", "admin"]}>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-[#006B3C]">Updates for you</p>
          <h1 className="mt-1 text-3xl font-bold">Notifications</h1>
        </div>
        <button onClick={() => markRead()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 hover:border-[#C8A23A]"><CheckCheck size={17} />Mark all read</button>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto">
        {filters.map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold ${filter === item ? "bg-[#006B3C] text-white" : "bg-white text-zinc-700 ring-1 ring-zinc-200"}`}>{item}</button>
        ))}
      </div>

      <div className="space-y-6">
        {grouped.map((group) => (
          <section key={group.label}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">{group.label}</h2>
            <div className="grid gap-3">
              {group.items.map((notification) => {
                const unread = user ? !notification.readBy.includes(user.id) : false;
                const Icon = iconFor(notification.type);
                return (
                  <article key={notification.id} className={`rounded-lg border bg-white p-5 shadow-sm ${unread ? "border-[#C8A23A] ring-2 ring-[#C8A23A]/15" : "border-zinc-200"}`}>
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="flex gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${notification.type.includes("Emergency") ? "bg-red-50 text-red-700" : "bg-[#C8A23A]/15 text-[#006B3C]"}`}><Icon size={18} /></span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold">{notification.title}</p>
                            <span className="rounded-full bg-[#F7F8FA] px-2 py-1 text-xs font-bold text-zinc-600">{notification.type}</span>
                            {unread && <span className="rounded-full bg-[#C8A23A]/15 px-2 py-1 text-xs font-bold text-[#7A5C08]">Unread</span>}
                          </div>
                          <p className="mt-1 text-sm text-zinc-600">{notification.body}</p>
                          <p className="mt-2 text-xs text-zinc-400">{formatDate(notification.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={notification.href} className="rounded-lg bg-[#006B3C] px-3 py-2 text-sm font-bold text-white">Open</Link>
                        {unread && <button onClick={() => markRead(notification.id)} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-bold">Read</button>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
        {filtered.length === 0 && <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">No notifications match this filter.</p>}
      </div>
    </AppShell>
  );
}
