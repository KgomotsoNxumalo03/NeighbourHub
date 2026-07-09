"use client";

import Link from "next/link";
import { type ElementType, FormEvent, useEffect, useMemo, useState } from "react";
import { ClipboardList, Filter, Megaphone, Search, Siren, SlidersHorizontal, SquareCheckBig } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { announcementPriorities, communityStatusLevels, ticketCategoryGroups, ticketPriorities, ticketStatuses } from "@/lib/constants";
import type { Announcement, CommunityStatus, Ticket } from "@/lib/types";
import { getCurrentUser } from "@/lib/client-auth";
import { getStoredCommunityId } from "@/lib/community";
import { Select } from "@/components/ui";

export default function AdminPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("updated");
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState({ title: "", body: "", priority: "Normal", expiresAt: "" });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [communityStatus, setCommunityStatus] = useState<CommunityStatus[]>([]);

  async function loadTickets() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    if (search.trim()) params.set("search", search.trim());
    params.set("sort", sortBy);
    params.set("communityId", communityId);
    const response = await fetch(`/api/tickets?${params.toString()}`);
    const data = await response.json();
    setTickets(data.tickets || []);
    setLoading(false);
  }

  async function loadAnnouncements() {
    const response = await fetch(`/api/announcements?communityId=${communityId}`);
    const data = await response.json();
    setAnnouncements(data.announcements || []);
  }

  async function loadCommunityStatus() {
    const response = await fetch(`/api/community-status?communityId=${communityId}`);
    const data = await response.json();
    setCommunityStatus(data.communityStatus || []);
  }

  useEffect(() => {
    loadTickets();
  }, [statusFilter, categoryFilter, priorityFilter, search, sortBy, communityId]);

  useEffect(() => {
    loadAnnouncements();
    loadCommunityStatus();
  }, []);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((ticket) => ["New", "Open", "In Progress"].includes(ticket.status)).length,
      emergency: tickets.filter((ticket) => ticket.priority === "Emergency").length,
      resolved: tickets.filter((ticket) => ticket.status === "Resolved").length,
    };
  }, [tickets]);

  async function updateTicket(ticket: Ticket, status: string, adminNotes: string, ownerName: string) {
    await fetch("/api/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ticket.id, status, adminNotes, ownerName, actorName: "Admin Manager", actorRole: "admin" }),
    });
    await loadTickets();
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setPriorityFilter("");
    setSortBy("updated");
  }

  async function createAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...announcement, communityId, audience: "All residents" }),
    });
    if (response.ok) {
      setAnnouncement({ title: "", body: "", priority: "Normal", expiresAt: "" });
      await loadAnnouncements();
    }
  }

  async function updateAnnouncement(item: Announcement) {
    await fetch("/api/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    await loadAnnouncements();
  }

  async function deleteAnnouncement(id: string) {
    if (!window.confirm("Delete this announcement?")) return;
    await fetch("/api/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadAnnouncements();
  }

  async function updateCommunityStatus(item: CommunityStatus) {
    await fetch("/api/community-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    await loadCommunityStatus();
  }

  return (
    <AppShell allowedRoles={["admin"]}>
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#006B3C]">Neighbourhood operations</p>
        <h1 className="mt-1 text-3xl font-bold">Admin dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600">Review resident tickets, update progress, and publish announcements.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Total tickets" value={stats.total} icon={ClipboardList} />
        <Stat title="Open tickets" value={stats.open} icon={Filter} />
        <Stat title="Emergency tickets" value={stats.emergency} icon={Siren} />
        <Stat title="Resolved tickets" value={stats.resolved} icon={SquareCheckBig} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-bold">All tickets</h2>
                <p className="mt-1 text-sm text-zinc-500">Search, sort, filter, and update resident issues.</p>
              </div>
              <button onClick={clearFilters} className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-bold text-zinc-700 hover:border-[#C8A23A]">
                <SlidersHorizontal size={16} />
                Reset
              </button>
            </div>
            <div className="grid gap-2 lg:grid-cols-[1fr_150px_150px_150px_150px]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 text-zinc-400" size={17} />
                <input className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reference, resident, title, location" />
              </label>
              <Select value={statusFilter} onChange={setStatusFilter} options={ticketStatuses} placeholder="All statuses" />
              <Select value={categoryFilter} onChange={setCategoryFilter} groups={ticketCategoryGroups.map((group) => ({ label: group.label, options: group.categories }))} placeholder="All categories" />
              <Select value={priorityFilter} onChange={setPriorityFilter} options={ticketPriorities} placeholder="All priorities" />
              <Select value={sortBy} onChange={setSortBy} options={[{ label: "Updated newest", value: "updated" }, { label: "Created oldest", value: "oldest" }, { label: "Priority first", value: "priority" }, { label: "Status order", value: "status" }]} />
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {loading && <p className="rounded-lg bg-[#F7F8FA] p-4 text-sm text-zinc-600">Loading tickets...</p>}
            {tickets.map((ticket) => <AdminTicket key={ticket.id} ticket={ticket} onSave={updateTicket} />)}
            {!loading && tickets.length === 0 && <p className="rounded-lg bg-[#F7F8FA] p-4 text-sm text-zinc-600">No tickets match the selected filters.</p>}
          </div>
        </div>

        <aside className="space-y-6">
          <form onSubmit={createAnnouncement} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C8A23A]/20 text-[#006B3C]">
                <Megaphone size={20} />
              </span>
              <h2 className="text-lg font-bold">Create announcement</h2>
            </div>
            <input required placeholder="Announcement title" className="mt-5 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" value={announcement.title} onChange={(event) => setAnnouncement({ ...announcement, title: event.target.value })} />
            <textarea required placeholder="Write the update for residents" className="mt-3 min-h-28 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" value={announcement.body} onChange={(event) => setAnnouncement({ ...announcement, body: event.target.value })} />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Select value={announcement.priority} onChange={(value) => setAnnouncement({ ...announcement, priority: value })} options={announcementPriorities} />
              <input type="date" className="rounded-lg border border-zinc-200 px-3 py-3 text-sm" value={announcement.expiresAt} onChange={(event) => setAnnouncement({ ...announcement, expiresAt: event.target.value })} />
            </div>
            <button className="mt-3 w-full rounded-lg bg-[#006B3C] px-4 py-3 text-sm font-bold text-white hover:bg-[#00522f]">
              Publish announcement
            </button>
          </form>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Community status</h2>
            <div className="mt-4 space-y-3">
              {communityStatus.map((item) => (
                <CommunityStatusEditor key={item.id} item={item} onSave={updateCommunityStatus} />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Manage announcements</h2>
            <div className="mt-4 space-y-3">
              {announcements.slice(0, 3).map((item) => (
                <AnnouncementEditor key={item.id} item={item} onSave={updateAnnouncement} onDelete={deleteAnnouncement} />
              ))}
              {announcements.length === 0 && <p className="rounded-lg bg-[#F7F8FA] p-4 text-sm text-zinc-600">No announcements yet.</p>}
            </div>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function CommunityStatusEditor({ item, onSave }: { item: CommunityStatus; onSave: (item: CommunityStatus) => Promise<void> }) {
  const [draft, setDraft] = useState(item);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  }

  return (
    <div className="rounded-lg bg-[#F7F8FA] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold">{item.name}</p>
        <Select className="w-36" value={draft.level} onChange={(value) => setDraft({ ...draft, level: value as CommunityStatus["level"] })} options={communityStatusLevels} />
      </div>
      <input className="mt-3 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })} />
      <textarea className="mt-2 min-h-16 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={draft.detail} onChange={(event) => setDraft({ ...draft, detail: event.target.value })} />
      <button onClick={save} disabled={saving} className="mt-2 rounded-lg bg-[#006B3C] px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
        {saving ? "Saving..." : "Save status"}
      </button>
    </div>
  );
}

function AnnouncementEditor({ item, onSave, onDelete }: { item: Announcement; onSave: (item: Announcement) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [draft, setDraft] = useState(item);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  }

  return (
    <article className={`rounded-lg p-3 ${item.priority === "Emergency" ? "bg-red-50 ring-1 ring-red-200" : "bg-[#F7F8FA]"}`}>
      <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
      <textarea className="mt-2 min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} />
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <Select value={draft.priority} onChange={(value) => setDraft({ ...draft, priority: value as Announcement["priority"] })} options={announcementPriorities} />
        <input type="date" className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={draft.expiresAt} onChange={(event) => setDraft({ ...draft, expiresAt: event.target.value })} />
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={save} disabled={saving} className="rounded-lg bg-[#006B3C] px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
          {saving ? "Saving..." : "Save"}
        </button>
        <button onClick={() => onDelete(item.id)} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50">
          Delete
        </button>
      </div>
    </article>
  );
}

function Stat({ title, value, icon: Icon }: { title: string; value: number; icon: ElementType }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-600">{title}</p>
        <Icon className="text-[#006B3C]" size={22} />
      </div>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}

function AdminTicket({ ticket, onSave }: { ticket: Ticket; onSave: (ticket: Ticket, status: string, adminNotes: string, ownerName: string) => Promise<void> }) {
  const [status, setStatus] = useState(ticket.status);
  const [adminNotes, setAdminNotes] = useState(ticket.adminNotes);
  const [ownerName, setOwnerName] = useState(ticket.ownerName || "Unassigned");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave(ticket, status, adminNotes, ownerName);
    setSaving(false);
  }

  return (
    <article className={`rounded-lg border bg-[#F7F8FA] p-4 ${ticket.priority === "Emergency" ? "border-red-200 ring-2 ring-red-100" : "border-zinc-100"}`}>
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/tickets/${ticket.id}`} className="font-bold text-[#006B3C] hover:underline">{ticket.reference}</Link>
            <h3 className="font-bold">{ticket.title}</h3>
            <StatusBadge value={ticket.status} />
            <PriorityBadge value={ticket.priority} />
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{ticket.description}</p>
          <p className="mt-2 text-sm text-zinc-500">{ticket.category} / {ticket.location} / {ticket.residentName}</p>
          <p className="mt-1 text-sm text-zinc-500">{ticket.supporters?.length || 0} residents affected / Responsible: {ticket.ownerName || "Unassigned"}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {["Open", "In Progress", "Resolved", "Closed"].map((item) => (
          <button key={item} onClick={() => setStatus(item as Ticket["status"])} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${status === item ? "bg-[#006B3C] text-white" : "bg-white text-zinc-700 ring-1 ring-zinc-200"}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[180px_180px_1fr_auto] md:items-start">
        <Select value={status} onChange={(value) => setStatus(value as Ticket["status"])} options={ticketStatuses} />
        <input className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} placeholder="Owner/contractor" />
        <textarea className="min-h-20 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} placeholder="Admin notes" />
        <button onClick={save} disabled={saving} className="rounded-lg bg-[#006B3C] px-4 py-2 text-sm font-bold text-white hover:bg-[#00522f] disabled:opacity-60">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {ticket.adminNotesHistory.length > 0 && (
        <details className="mt-3 rounded-lg bg-white p-3 text-sm">
          <summary className="cursor-pointer font-bold text-zinc-700">Admin notes history ({ticket.adminNotesHistory.length})</summary>
          <div className="mt-3 space-y-2">
            {ticket.adminNotesHistory.slice().reverse().map((note) => (
              <p key={note.id} className="rounded-lg bg-[#F7F8FA] p-2 text-zinc-600">{note.note}</p>
            ))}
          </div>
        </details>
      )}
    </article>
  );
}
