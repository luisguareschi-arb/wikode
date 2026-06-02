import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { embedText } from "@/lib/embeddings/openai";
import { searchChunks } from "@/lib/retrieval/search";
import { streamChat, citationsWithContext } from "@/lib/claude/chat";
import { checkRateLimit } from "@/lib/rateLimit";

interface ChatRequestBody {
  threadId: string;
  message: string;
  repoIds?: string[];
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!checkRateLimit(session.user.id, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const { threadId, message, repoIds } = (await req.json()) as ChatRequestBody;
  if (!threadId || !message) {
    return NextResponse.json({ error: "Missing threadId or message" }, { status: 400 });
  }

  // Load thread + history
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      repos: { include: { repository: true } },
    },
  });

  if (!thread || thread.userId !== session.user.id) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const effectiveRepoIds = repoIds?.length
    ? repoIds
    : thread.repos.map((threadRepo) => threadRepo.repositoryId);

  // Save user message
  await prisma.message.create({
    data: { threadId, role: "user", content: message },
  });

  // RAG: embed query → search chunks
  const queryEmbedding = await embedText(message);
  const chunks = await searchChunks(queryEmbedding, effectiveRepoIds, 20);

  const history = thread.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const stream = streamChat(message, history, chunks, async (fullResponse) => {
    if (!fullResponse) return;
    const citations = citationsWithContext(
      fullResponse,
      chunks,
      thread.repos.map((threadRepo) => ({
        fullName: threadRepo.repository.fullName,
        defaultBranch: threadRepo.repository.defaultBranch,
      }))
    );
    await prisma.message.create({
      data: {
        threadId,
        role: "assistant",
        content: fullResponse,
        citations: citations.length > 0 ? (citations as unknown as Prisma.InputJsonValue) : undefined,
      },
    });
  });

  return stream.toTextStreamResponse({
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
