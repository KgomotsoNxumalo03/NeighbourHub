"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/client-auth";
import { getStoredCommunityId } from "@/lib/community";
import type { VolunteerGroup } from "@/lib/types";

export default function GroupsPage() {
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [groups, setGroups] = useState<VolunteerGroup[]>([]);
  async function load() { const r = await fetch(`/api/groups?communityId=${communityId}`); setGroups((await r.json()).groups || []); }
  useEffect(() => { load(); }, [communityId]);
  async function join(id: string) { if (!user) return; await fetch("/api/groups", { method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ id, userId: user.id }) }); await load(); }
  return <AppShell allowedRoles={["resident","admin"]}><div className="mb-6"><p className="text-sm font-semibold text-[#006B3C]">Get involved</p><h1 className="mt-1 text-3xl font-bold">Volunteer groups</h1></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{groups.map(group => { const joined = user ? group.members.includes(user.id) : false; return <article key={group.id} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#C8A23A]/15 text-[#006B3C]"><Users size={20}/></span><h2 className="mt-4 text-lg font-bold">{group.name}</h2><p className="mt-2 text-sm leading-6 text-zinc-600">{group.description}</p><p className="mt-3 rounded-lg bg-[#F7F8FA] p-3 text-sm font-semibold">{group.upcomingActivity}</p><p className="mt-3 text-sm text-zinc-500">{group.members.length} member{group.members.length === 1 ? "" : "s"}</p><button onClick={() => join(group.id)} className={`mt-4 rounded-lg px-4 py-2 text-sm font-bold ${joined ? "bg-[#C8A23A] text-[#1B1B1B]" : "bg-[#006B3C] text-white"}`}>{joined ? "Joined" : "Join group"}</button></article>; })}</div></AppShell>;
}
