"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/client-auth";
import { getStoredCommunityId } from "@/lib/community";
import { communityStatusLevels } from "@/lib/constants";
import type { Community, CommunityStatus, EmergencyContact } from "@/lib/types";
import { Select } from "@/components/ui";

export default function AdminSettingsPage() {
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [community, setCommunity] = useState<Community | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [statuses, setStatuses] = useState<CommunityStatus[]>([]);
  const [saved, setSaved] = useState("");

  async function loadSettings() {
    const [communitiesRes, contactsRes, statusRes] = await Promise.all([
      fetch("/api/communities"),
      fetch(`/api/contacts?communityId=${communityId}`),
      fetch(`/api/community-status?communityId=${communityId}`),
    ]);
    const communities = (await communitiesRes.json()).communities || [];
    setCommunity(communities.find((item: Community) => item.id === communityId) || null);
    setContacts((await contactsRes.json()).contacts || []);
    setStatuses((await statusRes.json()).communityStatus || []);
  }

  useEffect(() => {
    loadSettings();
  }, [communityId]);

  async function saveCommunity() {
    if (!community) return;
    await fetch("/api/communities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(community),
    });
    setSaved("Community settings saved.");
  }

  async function saveStatus(item: CommunityStatus) {
    await fetch("/api/community-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    setSaved("Community status saved.");
    await loadSettings();
  }

  async function saveContact(item: EmergencyContact) {
    await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    setSaved("Emergency contact saved.");
    await loadSettings();
  }

  return (
    <AppShell allowedRoles={["admin"]}>
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#006B3C]">Community administration</p>
        <h1 className="mt-1 text-3xl font-bold">Admin settings</h1>
        <p className="mt-2 text-sm text-zinc-600">Manage the public profile and operational status for your community.</p>
      </div>

      {community && (
        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Community profile</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input className="rounded-lg border border-zinc-200 px-3 py-3 text-sm" value={community.name} onChange={(event) => setCommunity({ ...community, name: event.target.value })} />
              <input className="rounded-lg border border-zinc-200 px-3 py-3 text-sm" value={community.logo} onChange={(event) => setCommunity({ ...community, logo: event.target.value })} />
              <input className="rounded-lg border border-zinc-200 px-3 py-3 text-sm" value={community.coverImage} onChange={(event) => setCommunity({ ...community, coverImage: event.target.value })} />
              <input className="rounded-lg border border-zinc-200 px-3 py-3 text-sm" value={community.primaryColour} onChange={(event) => setCommunity({ ...community, primaryColour: event.target.value })} />
            </div>
            <textarea className="mt-3 min-h-28 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" value={community.description} onChange={(event) => setCommunity({ ...community, description: event.target.value })} />
            <button onClick={saveCommunity} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#006B3C] px-4 py-3 text-sm font-bold text-white">
              <Save size={17} /> Save profile
            </button>
            {saved && <p className="mt-3 text-sm font-semibold text-[#006B3C]">{saved}</p>}
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">Community status</h2>
              <div className="mt-4 space-y-3">
                {statuses.map((item) => (
                  <div key={item.id} className="rounded-lg bg-[#F7F8FA] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold">{item.name}</p>
                      <Select className="w-36" value={item.level} onChange={(value) => setStatuses(statuses.map((status) => status.id === item.id ? { ...status, level: value as CommunityStatus["level"] } : status))} options={communityStatusLevels} />
                    </div>
                    <input className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={item.status} onChange={(event) => setStatuses(statuses.map((status) => status.id === item.id ? { ...status, status: event.target.value } : status))} />
                    <textarea className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={item.detail} onChange={(event) => setStatuses(statuses.map((status) => status.id === item.id ? { ...status, detail: event.target.value } : status))} />
                    <button onClick={() => saveStatus(item)} className="mt-2 rounded-lg bg-[#006B3C] px-3 py-2 text-xs font-bold text-white">Save</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">Emergency contacts</h2>
              <div className="mt-4 space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="rounded-lg bg-[#F7F8FA] p-3">
                    <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-bold" value={contact.name} onChange={(event) => setContacts(contacts.map((item) => item.id === contact.id ? { ...item, name: event.target.value } : item))} />
                    <input className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={contact.phone} onChange={(event) => setContacts(contacts.map((item) => item.id === contact.id ? { ...item, phone: event.target.value } : item))} />
                    <textarea className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={contact.detail} onChange={(event) => setContacts(contacts.map((item) => item.id === contact.id ? { ...item, detail: event.target.value } : item))} />
                    <button onClick={() => saveContact(contact)} className="mt-2 rounded-lg bg-[#006B3C] px-3 py-2 text-xs font-bold text-white">Save contact</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </AppShell>
  );
}
