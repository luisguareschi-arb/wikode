import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { ChatWindow } from "@/components/chat/ChatWindow";
import type { CitationData } from "@/components/chat/CitationCard";

function normalizeCitations(value: Prisma.JsonValue | null): CitationData[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const results: CitationData[] = [];
  for (const item of value as Prisma.JsonArray) {
    if (typeof item !== "object" || item === null) continue;
    const citation = item as Record<string, unknown>;
    const filePath = typeof citation.filePath === "string" ? citation.filePath : "";
    const startLine = typeof citation.startLine === "number" ? citation.startLine : 0;
    const endLine = typeof citation.endLine === "number" ? citation.endLine : 0;
    if (!filePath || startLine <= 0 || endLine <= 0) continue;
    results.push({
      filePath,
      startLine,
      endLine,
      repoFullName: typeof citation.repoFullName === "string" ? citation.repoFullName : undefined,
      defaultBranch: typeof citation.defaultBranch === "string" ? citation.defaultBranch : undefined,
      content: typeof citation.content === "string" ? citation.content : undefined,
    });
  }
  return results.length > 0 ? results : undefined;
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const { threadId } = await params;
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      repos: { include: { repository: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!thread || thread.userId !== session.user.id) {
    notFound();
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-[hsl(var(--app-surface))]">
      <ChatWindow
        key={thread.id}
        threadId={thread.id}
        threadTitle={thread.title}
        repoIds={thread.repos.map((item) => item.repositoryId)}
        initialMessages={thread.messages.map((message) => ({
          id: message.id,
          role: message.role as "user" | "assistant",
          content: message.content,
          citations: normalizeCitations(message.citations),
        }))}
      />
    </div>
  );
}
