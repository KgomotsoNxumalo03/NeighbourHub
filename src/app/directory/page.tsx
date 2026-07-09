"use client";

import { useEffect, useState } from "react";
import { EyeOff, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/client-auth";
import type { ResidentProfile } from "@/lib/types";
import { getStoredCommunityId } from "@/lib/community";

export default function DirectoryPage() {
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [profiles, setProfiles] = useState<ResidentProfile[]>([]);
  const [myProfile, setMyProfile] = useState({ visible: false, area: "", contactPreference: "" });

  async function loadProfiles() {
    if (!user) return;
    const response = await fetch(`/api/directory?userId=${user.id}&communityId=${communityId}`);
    const data = await response.json();
    const loaded = data.profiles || [];
    setProfiles(loaded);
    const mine = loaded.find((profile: ResidentProfile) => profile.userId === user.id);
    if (mine) setMyProfile({ visible: mine.visible, area: mine.area, contactPreference: mine.contactPreference });
  }

  useEffect(() => {
    loadProfiles();
  }, [user?.id]);

  async function saveProfile() {
    if (!user) return;
    await fetch("/api/directory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, communityId, name: user.name, ...myProfile }),
    });
    await loadProfiles();
  }

  return (
    <AppShell allowedRoles={["resident", "admin"]}>
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#006B3C]">Privacy-first neighbour list</p>
        <h1 className="mt-1 text-3xl font-bold">Resident directory</h1>
        <p className="mt-2 text-sm text-zinc-600">Residents opt in. Only name, area/street, and contact preference are shown.</p>
      </div>
      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Your visibility</h2>
          <label className="mt-4 flex items-center justify-between rounded-lg bg-[#F7F8FA] p-3 text-sm font-bold">
            Show me in directory
            <input type="checkbox" checked={myProfile.visible} onChange={(event) => setMyProfile({ ...myProfile, visible: event.target.checked })} />
          </label>
          <input className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Area or street" value={myProfile.area} onChange={(event) => setMyProfile({ ...myProfile, area: event.target.value })} />
          <input className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Contact preference" value={myProfile.contactPreference} onChange={(event) => setMyProfile({ ...myProfile, contactPreference: event.target.value })} />
          <button onClick={saveProfile} className="mt-3 w-full rounded-lg bg-[#006B3C] px-4 py-3 text-sm font-bold text-white">Save preference</button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.filter((profile) => profile.visible).map((profile) => (
            <article key={profile.userId} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#C8A23A]/15 text-[#006B3C]"><Users size={20} /></span>
                <div>
                  <h2 className="font-bold">{profile.name}</h2>
                  <p className="text-sm text-zinc-600">{profile.area || "Area not listed"}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-zinc-700">{profile.contactPreference || "No contact preference listed"}</p>
            </article>
          ))}
          {profiles.filter((profile) => profile.visible).length === 0 && (
            <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600"><EyeOff className="mb-3 text-[#006B3C]" />No residents are visible in the directory yet.</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
