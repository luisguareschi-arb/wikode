import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/github/webhook";
import { enqueueDelta } from "@/lib/queue/index";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-hub-signature-256");
  const payload = await req.text();

  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET!;
  if (!verifyWebhookSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = req.headers.get("x-github-event");
  if (event !== "push") {
    return NextResponse.json({ ok: true });
  }

  const body = JSON.parse(payload);

  // Only process pushes to the default branch
  if (!body.ref?.startsWith("refs/heads/")) {
    return NextResponse.json({ ok: true });
  }

  const repo = await prisma.repository.findUnique({
    where: { githubRepoId: body.repository.id },
  });

  if (!repo || body.ref !== `refs/heads/${repo.defaultBranch}`) {
    return NextResponse.json({ ok: true });
  }

  const changedFiles: string[] = [];
  const removedFiles: string[] = [];

  for (const commit of body.commits ?? []) {
    changedFiles.push(...(commit.added ?? []), ...(commit.modified ?? []));
    removedFiles.push(...(commit.removed ?? []));
  }

  const uniqueChanged = [...new Set(changedFiles)].filter(
    (f) => !removedFiles.includes(f),
  );
  const uniqueRemoved = [...new Set(removedFiles)];

  if (uniqueChanged.length > 0 || uniqueRemoved.length > 0) {
    await prisma.repository.update({
      where: { id: repo.id },
      data: { status: "INDEXING", errorMessage: null },
    });

    await enqueueDelta({
      repoId: repo.id,
      installationId: repo.installationId,
      changedFiles: uniqueChanged,
      removedFiles: uniqueRemoved,
      newSha: body.after,
    });
  }

  return NextResponse.json({ ok: true });
}
