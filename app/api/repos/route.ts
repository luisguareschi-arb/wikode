import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { enqueueIngestion } from "@/lib/queue/index";
import { getInstallationOctokit } from "@/lib/github/app";
import { z } from "zod";

const COOKIE_NAME = "gh_installation_id";

const AddRepoSchema = z.object({
  githubRepoId: z.number(),
  installationId: z.number().optional(),
  owner: z.string(),
  name: z.string(),
  fullName: z.string(),
  defaultBranch: z.string().default("main"),
});

function installationIdFromRequest(
  req: NextRequest,
  fromBody: number | undefined,
): number | null {
  if (fromBody != null) return fromBody;
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) return null;
  const id = parseInt(cookie, 10);
  return Number.isFinite(id) ? id : null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  // @ts-expect-error role is custom
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = AddRepoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { githubRepoId, owner, name, fullName, defaultBranch } = parsed.data;
  const installationId = installationIdFromRequest(
    req,
    parsed.data.installationId,
  );
  if (installationId == null) {
    return NextResponse.json(
      { error: "No GitHub App installation connected" },
      { status: 400 },
    );
  }

  // Check if already indexed
  const existing = await prisma.repository.findUnique({
    where: { githubRepoId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Repository already added" },
      { status: 409 },
    );
  }

  // Get the current HEAD sha
  const octokit = await getInstallationOctokit(installationId);
  const { data: ref } = await octokit.rest.git.getRef({
    owner,
    repo: name,
    ref: `heads/${defaultBranch}`,
  });
  const sha = ref.object.sha;

  const repo = await prisma.repository.create({
    data: {
      githubRepoId,
      installationId,
      owner,
      name,
      fullName,
      defaultBranch,
      status: "PENDING",
    },
  });

  await enqueueIngestion({
    repoId: repo.id,
    installationId,
    owner,
    name,
    sha,
  });

  return NextResponse.json({ repo }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  // @ts-expect-error role is custom
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repos = await prisma.repository.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ repos });
}
