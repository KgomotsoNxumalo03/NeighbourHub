"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/client-auth";
import { formatDate } from "@/lib/format";
import type { Notification } from "@/lib/types";
import { getStoredCommunityId } from "@/lib/community";

export default function NotificationsPage() {
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  async function loadNotifications() {
    if (!user) return;
    const response = await fetch(`/api/notifications?userId=${user.id}&communityId=${communityId}`);
    const data = await response.json();
    setNotifications(data.notifications || []);
  }

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  async function markRead(id?: string) {
    if (!user) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, userId: user.id, action: id ? "read" : "read-all" }),
    });
    await loadNotifications();
  }

  return (
    <AppShell allowedRoles={["resident", "admin"]}>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-[#006B3C]">Updates for you</p>
          <h1 className="mt-1 text-3xl font-bold">Notifications</h1>
        </div>
        <button onClick={() => markRead()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 hover:border-[#C8A23A]"><CheckCheck size={17} />Mark all read</button>
      </div>
      <div className="grid gap-3">
        {notifications.map((notification) => {
          const unread = user ? !notification.readBy.includes(user.id) : false;
          return (
            <article key={notification.id} className={`rounded-lg border bg-white p-5 shadow-sm ${unread ? "border-[#C8A23A] ring-2 ring-[#C8A23A]/15" : "border-zinc-200"}`}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C8A23A]/15 text-[#006B3C]"><Bell size={18} /></span>
                  <div>
                    <p className="font-bold">{notification.title}</p>
                    <p className="mt-1 text-sm text-zinc-600">{notification.body}</p>
                    <p className="mt-2 text-xs text-zinc-400">{notification.type} / {formatDate(notification.createdAt)}</p>
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
        {notifications.length === 0 && <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">No notifications yet.</p>}
      </div>
    </AppShell>
  );
}
