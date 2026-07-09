"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, MapPin, Send, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/client-auth";
import { eventCategories } from "@/lib/constants";
import type { CommunityEvent } from "@/lib/types";
import { getStoredCommunityId } from "@/lib/community";
import { Select } from "@/components/ui";

export default function EventsPage() {
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [draft, setDraft] = useState({ title: "", description: "", date: "", time: "", location: "", category: "Community" });

  async function loadEvents() {
    const response = await fetch(`/api/events?communityId=${communityId}`);
    const data = await response.json();
    setEvents(data.events || []);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, communityId, createdBy: user.id }),
    });
    if (response.ok) {
      setDraft({ title: "", description: "", date: "", time: "", location: "", category: "Community" });
      await loadEvents();
    }
  }

  async function updateEvent(id: string, action: string) {
    if (!user) return;
    await fetch("/api/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, userId: user.id }),
    });
    await loadEvents();
  }

  return (
    <AppShell allowedRoles={["resident", "admin"]}>
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#006B3C]">Community calendar</p>
        <h1 className="mt-1 text-3xl font-bold">Events</h1>
        <p className="mt-2 text-sm text-zinc-600">See upcoming neighbourhood events and RSVP.</p>
      </div>
      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        {user?.role === "admin" && (
          <form onSubmit={createEvent} className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Create event</h2>
            <input required className="mt-4 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            <textarea required className="mt-3 min-h-24 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input required type="date" className="rounded-lg border border-zinc-200 px-3 py-3 text-sm" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} />
              <input required type="time" className="rounded-lg border border-zinc-200 px-3 py-3 text-sm" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} />
            </div>
            <input required className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Location" value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} />
            <Select className="mt-3" value={draft.category} onChange={(value) => setDraft({ ...draft, category: value })} options={eventCategories} />
            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#006B3C] px-4 py-3 text-sm font-bold text-white"><Send size={17} />Create event</button>
          </form>
        )}
        <div className={`grid gap-4 md:grid-cols-2 ${user?.role !== "admin" ? "xl:col-span-2" : ""}`}>
          {events.map((event) => {
            const rsvped = user ? event.rsvps.includes(user.id) : false;
            return (
              <article key={event.id} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <span className="rounded-full bg-[#C8A23A]/15 px-2 py-1 text-xs font-bold text-[#7A5C08]">{event.category}</span>
                <h2 className="mt-3 text-lg font-bold">{event.title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{event.description}</p>
                <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-zinc-700"><CalendarDays size={17} />{event.date} at {event.time}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-zinc-600"><MapPin size={17} />{event.location}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-zinc-600"><Users size={17} />{event.rsvps.length} RSVP{event.rsvps.length === 1 ? "" : "s"}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => updateEvent(event.id, "rsvp")} className={`rounded-lg px-4 py-2 text-sm font-bold ${rsvped ? "bg-[#C8A23A] text-[#1B1B1B]" : "bg-[#006B3C] text-white"}`}>{rsvped ? "RSVP'd" : "RSVP"}</button>
                  {user?.role === "admin" && <button onClick={() => updateEvent(event.id, "delete")} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50">Delete</button>}
                </div>
              </article>
            );
          })}
          {events.length === 0 && <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">No events scheduled.</p>}
        </div>
      </section>
    </AppShell>
  );
}
