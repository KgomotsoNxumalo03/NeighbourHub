import { NextRequest, NextResponse } from "next/server";
import { postTypes } from "@/lib/constants";
import { readData, writeData } from "@/lib/data-store";
import type { CommunityPost, PostType } from "@/lib/types";

export async function GET(request: NextRequest) {
  const communityId = new URL(request.url).searchParams.get("communityId");
  const posts = await readData("feedPosts");
  return NextResponse.json({
    posts: posts
      .filter((post) => (communityId ? post.communityId === communityId : true))
      .filter((post) => !post.deleted)
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = String(body.title || "").trim();
  const postBody = String(body.body || "").trim();

  if (!title || !postBody) {
    return NextResponse.json({ message: "Title and post body are required." }, { status: 400 });
  }

  if (!postTypes.includes(body.type as PostType)) {
    return NextResponse.json({ message: "Invalid post type." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const post: CommunityPost = {
    id: crypto.randomUUID(),
    communityId: body.communityId || "community-oakridge",
    type: body.type,
    title,
    body: postBody,
    authorId: body.authorId,
    authorName: body.authorName,
    authorRole: body.authorRole === "admin" ? "admin" : "resident",
    pinned: false,
    likes: [],
    comments: [],
    createdAt: now,
    updatedAt: now,
  };

  const posts = await readData("feedPosts");
  posts.push(post);
  await writeData("feedPosts", posts);
  return NextResponse.json({ post }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { id, action, userId, authorName, body, pinned } = await request.json();
  const posts = await readData("feedPosts");
  const post = posts.find((item) => item.id === id);

  if (!post) return NextResponse.json({ message: "Post not found." }, { status: 404 });

  if (action === "like") {
    post.likes = post.likes.includes(userId) ? post.likes.filter((item) => item !== userId) : [...post.likes, userId];
  }

  if (action === "comment") {
    const commentBody = String(body || "").trim();
    if (!commentBody) return NextResponse.json({ message: "Comment cannot be blank." }, { status: 400 });
    post.comments.push({
      id: crypto.randomUUID(),
      authorId: userId,
      authorName,
      body: commentBody,
      createdAt: new Date().toISOString(),
    });
  }

  if (action === "pin") post.pinned = Boolean(pinned);
  if (action === "delete") post.deleted = true;

  post.updatedAt = new Date().toISOString();
  await writeData("feedPosts", posts);
  return NextResponse.json({ post });
}
