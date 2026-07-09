"use client";

import { FormEvent, useEffect, useState } from "react";
import { BarChart3, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/client-auth";
import { getStoredCommunityId } from "@/lib/community";
import type { Poll } from "@/lib/types";

export default function PollsPage() {
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [draft, setDraft] = useState({ question: "", options: "Yes\nNo" });

  async function loadPolls() {
    const response = await fetch(`/api/polls?communityId=${communityId}`);
    const data = await response.json();
    setPolls(data.polls || []);
  }
  useEffect(() => { loadPolls(); }, [communityId]);

  async function createPoll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const response = await fetch("/api/polls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, communityId, createdBy: user.id }) });
    if (response.ok) { setDraft({ question: "", options: "Yes\nNo" }); await loadPolls(); }
  }
  async function vote(id: string, optionId: string) {
    if (!user) return;
    await fetch("/api/polls", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, optionId, userId: user.id }) });
    await loadPolls();
  }
  async function closePoll(id: string) {
    await fetch("/api/polls", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "Closed" }) });
    await loadPolls();
  }
  return (
    <AppShell allowedRoles={["resident", "admin"]}>
      <div className="mb-6"><p className="text-sm font-semibold text-[#006B3C]">Community decisions</p><h1 className="mt-1 text-3xl font-bold">Polls</h1></div>
      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        {user?.role !== "resident" && <form onSubmit={createPoll} className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">Create poll</h2><input required className="mt-4 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Question" value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })} /><textarea className="mt-3 min-h-28 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" value={draft.options} onChange={(e) => setDraft({ ...draft, options: e.target.value })} /><button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#006B3C] px-4 py-3 text-sm font-bold text-white"><Send size={17}/>Create poll</button></form>}
        <div className={`space-y-4 ${user?.role === "resident" ? "xl:col-span-2" : ""}`}>
          {polls.map((poll) => {
            const total = poll.options.reduce((sum, option) => sum + option.votes.length, 0);
            const voted = user ? poll.options.some((option) => option.votes.includes(user.id)) : false;
            return <article key={poll.id} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><h2 className="text-lg font-bold">{poll.question}</h2><span className="rounded-full bg-[#F7F8FA] px-2 py-1 text-xs font-bold">{poll.status}</span></div><div className="mt-4 space-y-3">{poll.options.map((option) => { const pct = total ? Math.round((option.votes.length / total) * 100) : 0; return <button key={option.id} disabled={poll.status === "Closed"} onClick={() => vote(poll.id, option.id)} className="w-full rounded-lg bg-[#F7F8FA] p-3 text-left"><div className="flex justify-between text-sm font-bold"><span>{option.label}</span><span>{pct}%</span></div><div className="mt-2 h-2 rounded-full bg-zinc-200"><div className="h-2 rounded-full bg-[#C8A23A]" style={{ width: `${pct}%` }} /></div></button>; })}</div><p className="mt-3 flex items-center gap-2 text-sm text-zinc-500"><BarChart3 size={16}/>{total} vote{total === 1 ? "" : "s"}{voted ? " / you voted" : ""}</p>{user?.role !== "resident" && poll.status === "Active" && <button onClick={() => closePoll(poll.id)} className="mt-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-bold">Close poll</button>}</article>;
          })}
        </div>
      </section>
    </AppShell>
  );
}
