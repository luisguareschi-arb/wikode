export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitBranch, Users, Database } from "lucide-react";

export default async function AdminPage() {
  const [repoCount, userCount, repos] = await Promise.all([
    prisma.repository.count(),
    prisma.user.count(),
    prisma.repository.findMany({
      select: {
        status: true,
        errorMessage: true,
        updatedAt: true,
      },
    }),
  ]);

  const errorCount = repos.filter(
    (repo) => repo.status === "ERROR" || !!repo.errorMessage,
  ).length;
  const lastSync = repos.reduce<Date | null>((latest, repo) => {
    if (!latest) return repo.updatedAt;
    return repo.updatedAt > latest ? repo.updatedAt : latest;
  }, null);

  const appSlug = process.env.GITHUB_APP_SLUG;
  const installUrl = appSlug
    ? `https://github.com/apps/${appSlug}/installations/new`
    : null;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[hsl(var(--app-text))]">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--app-text-muted))]">
          Manage repositories, users, and indexing.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Repositories</CardDescription>
            <CardTitle className="text-3xl">{repoCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/admin/repos">
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Users</CardDescription>
            <CardTitle className="text-3xl">{userCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>GitHub App</CardDescription>
            <CardTitle className="text-base truncate">
              {appSlug ?? "Not configured"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {installUrl ? (
              <a href={installUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">
                  <Database className="h-3.5 w-3.5 mr-1" />
                  Install on org
                </Button>
              </a>
            ) : (
              <p className="text-xs text-gray-400">Set GITHUB_APP_ID in .env</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/admin/repos">
          <Button className="gap-2">
            <GitBranch className="h-4 w-4" />
            Manage Repositories
          </Button>
        </Link>
        <Link href="/admin/users">
          <Button variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            Manage Users
          </Button>
        </Link>
      </div>
      <div className="mt-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--app-surface))] p-4">
        <h2 className="text-sm font-semibold text-[hsl(var(--app-text))]">
          Sync health
        </h2>
        <p className="mt-1 text-sm text-[hsl(var(--app-text-muted))]">
          Last repository update: {lastSync ? lastSync.toLocaleString() : "N/A"}
        </p>
        <p className="mt-1 text-sm text-[hsl(var(--app-text-muted))]">
          Repositories in error state: {errorCount}
        </p>
      </div>
    </div>
  );
}
