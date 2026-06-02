import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { enqueueIngestion } from "@/lib/queue/index";
import { getInstallationOctokit } from "@/lib/github/app";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ repoId: string }> }
) {
  const session = await auth();
  // @ts-expect-error role is custom
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { repoId } = await params;
  const repo = await prisma.repository.findUnique({ where: { id: repoId } });
  if (!repo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const octokit = await getInstallationOctokit(repo.installationId);
  const { data: ref } = await octokit.git.getRef({
    owner: repo.owner,
    repo: repo.name,
    ref: `heads/${repo.defaultBranch}`,
  });
  const sha = ref.object.sha;

  await prisma.repository.update({
    where: { id: repoId },
    data: { status: "PENDING" },
  });

  await enqueueIngestion({
    repoId: repo.id,
    installationId: repo.installationId,
    owner: repo.owner,
    name: repo.name,
    sha,
  });

  return NextResponse.json({ queued: true });
}
