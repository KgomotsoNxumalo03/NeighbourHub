"use client";

import { FormEvent, useEffect, useState } from "react";
import { Heart, MessageCircle, Pin, Send, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/client-auth";
import { postTypes } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { CommunityPost } from "@/lib/types";
import { getStoredCommunityId } from "@/lib/community";
import { Select } from "@/components/ui";

export default function FeedPage() {
  const user = getCurrentUser();
  const communityId = getStoredCommunityId(user);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [draft, setDraft] = useState({ type: "General update", title: "", body: "" });
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  async function loadPosts() {
    const response = await fetch(`/api/feed?communityId=${communityId}`);
    const data = await response.json();
    setPosts(data.posts || []);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const response = await fetch("/api/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, communityId, authorId: user.id, authorName: user.name, authorRole: user.role }),
    });
    if (response.ok) {
      setDraft({ type: "General update", title: "", body: "" });
      await loadPosts();
    }
  }

  async function updatePost(id: string, action: string, extra: Record<string, unknown> = {}) {
    if (!user) return;
    await fetch("/api/feed", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, userId: user.id, authorName: user.name, ...extra }),
    });
    await loadPosts();
  }

  return (
    <AppShell allowedRoles={["resident", "admin"]}>
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#006B3C]">Neighbourhood conversation</p>
        <h1 className="mt-1 text-3xl font-bold">Community feed</h1>
        <p className="mt-2 text-sm text-zinc-600">Share updates, safety notes, recommendations, events, and lost-and-found posts.</p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form onSubmit={createPost} className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Create post</h2>
          <Select className="mt-4" value={draft.type} onChange={(value) => setDraft({ ...draft, type: value })} options={postTypes} />
          <input required className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Post title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          <textarea required className="mt-3 min-h-28 w-full rounded-lg border border-zinc-200 px-3 py-3 text-sm" placeholder="Write a clear community update" value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} />
          <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#006B3C] px-4 py-3 text-sm font-bold text-white hover:bg-[#00522f]">
            <Send size={17} />
            Post to feed
          </button>
        </form>

        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post.id} className={`rounded-lg border bg-white p-5 shadow-sm ${post.pinned ? "border-[#C8A23A] ring-2 ring-[#C8A23A]/15" : "border-zinc-200"}`}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {post.pinned && <span className="inline-flex items-center gap-1 rounded-full bg-[#C8A23A]/15 px-2 py-1 text-xs font-bold text-[#7A5C08]"><Pin size={12} />Pinned</span>}
                    <span className="rounded-full bg-[#F7F8FA] px-2 py-1 text-xs font-bold text-zinc-600">{post.type}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-bold">{post.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{post.body}</p>
                  <p className="mt-3 text-xs text-zinc-500">{post.authorName} / {formatDate(post.createdAt)}</p>
                </div>
                {user?.role === "admin" && (
                  <div className="flex gap-2">
                    <button onClick={() => updatePost(post.id, "pin", { pinned: !post.pinned })} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold hover:border-[#C8A23A]">{post.pinned ? "Unpin" : "Pin"}</button>
                    <button onClick={() => updatePost(post.id, "delete")} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button onClick={() => updatePost(post.id, "like")} className="inline-flex items-center gap-2 rounded-lg bg-[#F7F8FA] px-3 py-2 text-sm font-bold text-zinc-700 hover:text-[#006B3C]">
                  <Heart size={16} /> {post.likes.length}
                </button>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500"><MessageCircle size={16} /> {post.comments.length}</span>
              </div>
              <div className="mt-4 space-y-2">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg bg-[#F7F8FA] p-3">
                    <p className="text-sm font-bold">{comment.authorName}</p>
                    <p className="mt-1 text-sm text-zinc-600">{comment.body}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={(event) => { event.preventDefault(); updatePost(post.id, "comment", { body: commentDrafts[post.id] || "" }); setCommentDrafts({ ...commentDrafts, [post.id]: "" }); }} className="mt-3 flex gap-2">
                <input className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm" placeholder="Add a comment" value={commentDrafts[post.id] || ""} onChange={(event) => setCommentDrafts({ ...commentDrafts, [post.id]: event.target.value })} />
                <button className="rounded-lg bg-[#006B3C] px-3 py-2 text-sm font-bold text-white">Comment</button>
              </form>
            </article>
          ))}
          {posts.length === 0 && <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">No community posts yet.</p>}
        </div>
      </section>
    </AppShell>
  );
}
