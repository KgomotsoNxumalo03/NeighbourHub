import { NextRequest, NextResponse } from "next/server";
import { postTypes } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const posts = await prisma.feedPost.findMany({
    where: { communityId: session.activeCommunityId, deletedAt: null },
    include: {
      comments: true,
      likes: true,
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    posts: posts.map((post) => ({
      id: post.id,
      communityId: post.communityId,
      type: post.type,
      title: post.title,
      body: post.body,
      authorId: post.authorId || "",
      authorName: post.authorName,
      authorRole: post.authorRole === "ADMIN" ? "admin" : post.authorRole === "SUPER_ADMIN" ? "super-admin" : "resident",
      pinned: post.pinned,
      likes: post.likes.map((like) => like.userId),
      comments: post.comments.map((comment) => ({
        id: comment.id,
        authorId: comment.authorId || "",
        authorName: comment.authorName,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
      })),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const title = String(body.title || "").trim();
  const postBody = String(body.body || "").trim();

  if (!title || !postBody) {
    return NextResponse.json({ message: "Title and post body are required." }, { status: 400 });
  }

  if (!postTypes.includes(body.type)) {
    return NextResponse.json({ message: "Invalid post type." }, { status: 400 });
  }

  const post = await prisma.feedPost.create({
    data: {
      id: crypto.randomUUID(),
      communityId: session.activeCommunityId,
      type: body.type,
      title,
      body: postBody,
      authorId: session.user.id,
      authorName: session.user.name,
      authorRole: session.user.role === "admin" ? "ADMIN" : session.user.role === "super-admin" ? "SUPER_ADMIN" : "RESIDENT",
    },
  });

  return NextResponse.json({
    post: {
      ...post,
      authorRole: session.user.role,
      likes: [],
      comments: [],
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    },
  }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const { id, action, body, pinned } = await request.json();
  const post = await prisma.feedPost.findUnique({
    where: { id },
    include: { comments: true, likes: true },
  });

  if (!post || post.communityId !== session.activeCommunityId) {
    return NextResponse.json({ message: "Post not found." }, { status: 404 });
  }

  if (action === "like") {
    const existing = post.likes.find((like) => like.userId === session.user.id);
    if (existing) {
      await prisma.feedLike.delete({
        where: {
          postId_userId: {
            postId: post.id,
            userId: session.user.id,
          },
        },
      });
    } else {
      await prisma.feedLike.create({
        data: {
          id: crypto.randomUUID(),
          postId: post.id,
          userId: session.user.id,
        },
      });
    }
  }

  if (action === "comment") {
    const commentBody = String(body || "").trim();
    if (!commentBody) {
      return NextResponse.json({ message: "Comment cannot be blank." }, { status: 400 });
    }

    await prisma.feedComment.create({
      data: {
        id: crypto.randomUUID(),
        postId: post.id,
        authorId: session.user.id,
        authorName: session.user.name,
        body: commentBody,
      },
    });
  }

  if (action === "pin") {
    if (session.user.role !== "admin" && session.user.role !== "super-admin") {
      return NextResponse.json({ message: "Only admins can pin posts." }, { status: 403 });
    }

    await prisma.feedPost.update({
      where: { id: post.id },
      data: { pinned: Boolean(pinned) },
    });
  }

  if (action === "delete") {
    if (session.user.role !== "admin" && session.user.role !== "super-admin") {
      return NextResponse.json({ message: "Only admins can delete posts." }, { status: 403 });
    }

    await prisma.feedPost.update({
      where: { id: post.id },
      data: { deletedAt: new Date() },
    });
  }

  const updated = await prisma.feedPost.findUnique({
    where: { id: post.id },
    include: { comments: true, likes: true },
  });

  return NextResponse.json({
    post: {
      id: updated!.id,
      communityId: updated!.communityId,
      type: updated!.type,
      title: updated!.title,
      body: updated!.body,
      authorId: updated!.authorId || "",
      authorName: updated!.authorName,
      authorRole: updated!.authorRole === "ADMIN" ? "admin" : updated!.authorRole === "SUPER_ADMIN" ? "super-admin" : "resident",
      pinned: updated!.pinned,
      likes: updated!.likes.map((like) => like.userId),
      comments: updated!.comments.map((comment) => ({
        id: comment.id,
        authorId: comment.authorId || "",
        authorName: comment.authorName,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
      })),
      createdAt: updated!.createdAt.toISOString(),
      updatedAt: updated!.updatedAt.toISOString(),
    },
  });
}
