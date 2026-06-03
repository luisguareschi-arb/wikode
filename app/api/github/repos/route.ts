import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getInstallationOctokit } from "@/lib/github/app";

export async function GET(req: NextRequest) {
  const session = await auth();
  // @ts-expect-error role is custom
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const installationId =
    req.nextUrl.searchParams.get("installation_id") ??
    req.cookies.get("gh_installation_id")?.value;

  if (!installationId) {
    return NextResponse.json({ error: "No installation_id" }, { status: 400 });
  }

  const octokit = await getInstallationOctokit(parseInt(installationId, 10));

  const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
    per_page: 100,
  });

  const repos = data.repositories.map(
    (r: {
      id: number;
      owner: { login: string };
      name: string;
      full_name: string;
      default_branch: string;
      private: boolean;
    }) => ({
      githubRepoId: r.id,
      owner: r.owner.login,
      name: r.name,
      fullName: r.full_name,
      defaultBranch: r.default_branch,
      private: r.private,
    }),
  );

  return NextResponse.json({ repos, installationId });
}
