"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ImageIcon, MessageSquare, RefreshCw, Send, TimerReset } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { getCurrentUser } from "@/lib/client-auth";
import { formatDate } from "@/lib/format";
import type { Ticket } from "@/lib/types";
import { getStoredCommunityId } from "@/lib/community";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const canReopen = ticket?.status === "Resolved" || ticket?.status === "Closed";

  async function loadTicket() {
    setLoading(true);
    const response = await fetch(`/api/tickets?id=${params.id}&communityId=${communityId}`);
    const data = await response.json();
    const found = data.tickets?.[0] || null;

    if (found && user?.role === "resident" && found.userId !== user.id) {
      router.replace("/tickets");
      return;
    }

    setTicket(found);
    setLoading(false);
  }

  useEffect(() => {
    if (user) loadTicket();
  }, [params.id, user?.id, user?.role]);

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !ticket) return;
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: ticket.id,
        action: "comment",
        comment,
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
      }),
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.message || "Unable to add comment.");
      return;
    }

    setComment("");
    setTicket(data.ticket);
    setMessage("Comment added.");
  }

  async function ticketAction(action: string) {
    if (!user || !ticket) return;
    setSaving(true);
    const response = await fetch("/api/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: ticket.id,
        action,
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
      }),
    });
    const data = await response.json();
    setSaving(false);
    if (response.ok) {
      setTicket(data.ticket);
      setMessage(action === "confirm-resolution" ? "Resolution confirmed." : "Ticket reopened.");
    } else {
      setMessage(data.message || "Unable to reopen ticket.");
    }
  }

  return (
    <AppShell allowedRoles={["resident", "admin"]}>
      {loading && <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">Loading ticket...</div>}

      {!loading && !ticket && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="font-bold">Ticket not found</p>
          <Link href="/tickets" className="mt-3 inline-flex text-sm font-bold text-[#006B3C]">Back to tickets</Link>
        </div>
      )}

      {ticket && (
        <div className="space-y-6">
          <Link href={user?.role === "admin" ? "/admin" : "/tickets"} className="inline-flex items-center gap-2 text-sm font-bold text-[#006B3C]">
            <ArrowLeft size={17} />
            Back
          </Link>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <p className="text-sm font-bold text-[#006B3C]">{ticket.reference}</p>
                <h1 className="mt-1 text-3xl font-bold">{ticket.title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">{ticket.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge value={ticket.status} />
                <PriorityBadge value={ticket.priority} />
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Category" value={ticket.category} />
              <Info label="Location" value={ticket.location} />
              <Info label="Created" value={formatDate(ticket.createdAt)} />
              <Info label="Last updated" value={formatDate(ticket.updatedAt)} />
              <Info label="Responsible" value={ticket.ownerName || "Unassigned"} />
              <Info label="Residents affected" value={String(ticket.supporters?.length || 0)} />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <ImageIcon className="text-[#006B3C]" />
                  <h2 className="text-lg font-bold">Image placeholder</h2>
                </div>
                <div className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-[#F7F8FA] p-5">
                  {ticket.imagePreview ? (
                    <p className="text-sm font-semibold text-zinc-700">{ticket.imagePreview}</p>
                  ) : (
                    <p className="text-sm text-zinc-500">No image placeholder was added to this ticket.</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <MessageSquare className="text-[#006B3C]" />
                  <h2 className="text-lg font-bold">Comments</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {ticket.comments.map((item) => (
                    <article key={item.id} className="rounded-lg bg-[#F7F8FA] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">{item.authorName}</p>
                        <span className="text-xs font-medium text-zinc-500">{formatDate(item.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-zinc-700">{item.body}</p>
                    </article>
                  ))}
                  {ticket.comments.length === 0 && <p className="rounded-lg bg-[#F7F8FA] p-4 text-sm text-zinc-500">No comments yet.</p>}
                </div>

                <form onSubmit={addComment} className="mt-4">
                  <textarea value={comment} onChange={(event) => setComment(event.target.value)} className="min-h-24 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Add a helpful update or question" />
                  <button disabled={saving} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#006B3C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00522f] disabled:opacity-60">
                    <Send size={17} />
                    Add comment
                  </button>
                  {message && <p className="mt-3 text-sm font-semibold text-[#006B3C]">{message}</p>}
                </form>
              </div>
            </div>

            <aside className="space-y-6">
              {user?.role === "resident" && canReopen && (
                <button onClick={() => ticketAction("reopen")} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C8A23A] px-4 py-3 text-sm font-bold text-[#1B1B1B] shadow-sm hover:-translate-y-0.5 disabled:opacity-60">
                  <RefreshCw size={17} />
                  Reopen ticket
                </button>
              )}
              {user?.role === "resident" && ticket.status === "Resolved" && (
                <button onClick={() => ticketAction("confirm-resolution")} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#006B3C] px-4 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-60">
                  Confirm resolved
                </button>
              )}

              <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <TimerReset className="text-[#006B3C]" />
                  <h2 className="text-lg font-bold">Activity timeline</h2>
                </div>
                <div className="mt-5 space-y-4">
                  {[...ticket.timeline].reverse().map((item) => (
                    <div key={item.id} className="border-l-2 border-[#C8A23A]/40 pl-4">
                      <p className="text-sm font-bold">{item.message}</p>
                      <p className="mt-1 text-xs text-zinc-500">{item.actor} / {formatDate(item.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {ticket.adminNotesHistory.length > 0 && (
                <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-bold">Admin notes history</h2>
                  <div className="mt-4 space-y-3">
                    {ticket.adminNotesHistory.slice().reverse().map((note) => (
                      <article key={note.id} className="rounded-lg bg-[#F7F8FA] p-3">
                        <p className="text-sm leading-6 text-zinc-700">{note.note}</p>
                        <p className="mt-2 text-xs text-zinc-500">{note.actor} / {formatDate(note.createdAt)}</p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#F7F8FA] p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-800">{value}</p>
    </div>
  );
}
