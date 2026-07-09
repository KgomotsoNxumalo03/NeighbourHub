"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser, saveCurrentUser } from "@/lib/client-auth";
import { getStoredCommunityId } from "@/lib/community";
import type { Community, CommunityEvent, CommunityPost, ResidentProfile, Ticket, VolunteerGroup } from "@/lib/types";

function addressToString(address: Record<string, string> = {}) {
  return Object.values(address).filter(Boolean).join(", ") || "No address captured";
}

export default function ProfilePage() {
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [community, setCommunity] = useState<Community | null>(null);
  const [profile, setProfile] = useState({ visible: false, area: "", contactPreference: "" });
  const [stats, setStats] = useState({ created: 0, supported: 0, comments: 0, rsvps: 0, groups: 0 });
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch("/api/communities").then((res) => res.json()),
      fetch(`/api/directory?userId=${user.id}&communityId=${communityId}`).then((res) => res.json()),
      fetch(`/api/tickets?communityId=${communityId}`).then((res) => res.json()),
      fetch(`/api/events?communityId=${communityId}`).then((res) => res.json()),
      fetch(`/api/groups?communityId=${communityId}`).then((res) => res.json()),
      fetch(`/api/feed?communityId=${communityId}`).then((res) => res.json()),
    ]).then(([communitiesData, directoryData, ticketsData, eventsData, groupsData, feedData]) => {
      setCommunity((communitiesData.communities || []).find((item: Community) => item.id === communityId) || null);
      const mine = (directoryData.profiles || []).find((item: ResidentProfile) => item.userId === user.id);
      if (mine) setProfile({ visible: mine.visible, area: mine.area, contactPreference: mine.contactPreference });
      const tickets: Ticket[] = ticketsData.tickets || [];
      const events: CommunityEvent[] = eventsData.events || [];
      const groups: VolunteerGroup[] = groupsData.groups || [];
      const posts: CommunityPost[] = feedData.posts || [];
      setStats({
        created: tickets.filter((ticket) => ticket.userId === user.id).length,
        supported: tickets.filter((ticket) => ticket.supporters?.includes(user.id)).length,
        comments: posts.reduce((sum, post) => sum + post.comments.filter((comment) => comment.authorId === user.id).length, 0),
        rsvps: events.filter((event) => event.rsvps.includes(user.id)).length,
        groups: groups.filter((group) => group.members.includes(user.id)).length,
      });
    });
  }, [user?.id, communityId]);

  async function saveProfile() {
    if (!user) return;
    await fetch("/api/directory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, communityId, name: user.name, ...profile }),
    });
    saveCurrentUser(user);
    setSaved("Profile preferences saved.");
  }

  return (
    <AppShell allowedRoles={["resident", "admin"]}>
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#006B3C]">Your account</p>
        <h1 className="mt-1 text-3xl font-bold">Resident profile</h1>
      </div>
      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#006B3C] text-white"><UserRound size={28} /></span>
          <h2 className="mt-4 text-xl font-bold">{user?.name}</h2>
          <p className="mt-1 text-sm text-zinc-600">{user?.email}</p>
          <div className="mt-4 space-y-2 text-sm">
            <p><span className="font-bold">Role:</span> {user?.role}</p>
            <p><span className="font-bold">Community:</span> {community?.name}</p>
            <p><span className="font-bold">Address:</span> {addressToString(user?.address as Record<string, string>)}</p>
            <p><span className="font-bold">Joined:</span> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Tickets created", stats.created],
              ["Tickets supported", stats.supported],
              ["Comments made", stats.comments],
              ["Events RSVP'd", stats.rsvps],
              ["Groups joined", stats.groups],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-bold">{value}</p>
                <p className="mt-1 text-xs font-semibold text-zinc-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Directory visibility</h2>
            <label className="mt-4 flex items-center justify-between rounded-lg bg-[#F7F8FA] p-3 text-sm font-bold">
              Show me in the resident directory
              <input type="checkbox" checked={profile.visible} onChange={(event) => setProfile({ ...profile, visible: event.target.checked })} />
            </label>
            <input className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Area or street" value={profile.area} onChange={(event) => setProfile({ ...profile, area: event.target.value })} />
            <input className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Contact preference" value={profile.contactPreference} onChange={(event) => setProfile({ ...profile, contactPreference: event.target.value })} />
            <button onClick={saveProfile} className="mt-3 rounded-lg bg-[#006B3C] px-4 py-3 text-sm font-bold text-white">Save profile</button>
            {saved && <p className="mt-3 text-sm font-semibold text-[#006B3C]">{saved}</p>}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
