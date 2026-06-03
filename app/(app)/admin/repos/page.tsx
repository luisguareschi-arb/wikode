"use client";

import { Suspense } from "react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RepoCard } from "@/components/admin/RepoCard";
import { AddRepoModal } from "@/components/admin/AddRepoModal";
import { Plus, GitBranch, Loader2, ExternalLink } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface Repo {
  id: string;
  fullName: string;
  defaultBranch: string;
  status: "PENDING" | "INDEXING" | "READY" | "ERROR";
  lastIndexedSha: string | null;
  errorMessage: string | null;
  updatedAt: string;
}

interface GitHubInstallation {
  id: number;
  accountLogin: string;
  accountType: string;
}

function persistInstallationId(installationId: string) {
  return fetch("/api/github/installations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ installationId }),
  });
}

function ReposContent() {
  const searchParams = useSearchParams();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [installations, setInstallations] = useState<GitHubInstallation[]>([]);
  const [installationsLoading, setInstallationsLoading] = useState(true);
  const [resolvedInstallationId, setResolvedInstallationId] = useState<
    string | null
  >(null);

  const installationIdFromUrl = searchParams.get("installation_id");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setInstallationsLoading(true);
      try {
        const res = await fetch("/api/github/installations");
        const data = await res.json();
        if (cancelled || !res.ok) return;

        setInstallations(data.installations ?? []);

        if (installationIdFromUrl) {
          setResolvedInstallationId(installationIdFromUrl);
          await persistInstallationId(installationIdFromUrl);
          return;
        }

        const suggested = data.suggestedInstallationId as string | null;
        if (suggested) {
          setResolvedInstallationId(suggested);
          if (!data.storedInstallationId) {
            await persistInstallationId(suggested);
          }
        }
      } finally {
        if (!cancelled) setInstallationsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [installationIdFromUrl]);

  const loadRepos = useCallback(async () => {
    const res = await fetch("/api/repos");
    const data = await res.json();
    setRepos(data.repos ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRepos();
  }, [loadRepos]);

  useEffect(() => {
    const hasActive = repos.some(
      (r) => r.status === "PENDING" || r.status === "INDEXING",
    );
    if (!hasActive) return;
    const interval = setInterval(loadRepos, 5000);
    return () => clearInterval(interval);
  }, [repos, loadRepos]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/repos/${id}`, { method: "DELETE" });
    await loadRepos();
  };

  const handleSync = async (id: string) => {
    await fetch(`/api/repos/${id}/sync`, { method: "POST" });
    await loadRepos();
  };

  const selectInstallation = async (id: string) => {
    setResolvedInstallationId(id);
    await persistInstallationId(id);
  };

  const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG;
  const connectUrl = appSlug
    ? `https://github.com/apps/${appSlug}/installations/new`
    : null;

  const hasInstallation = !!resolvedInstallationId;
  const activeInstallation = installations.find(
    (i) => String(i.id) === resolvedInstallationId,
  );
  const showInstallationPicker =
    !installationsLoading && installations.length > 1 && !hasInstallation;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Repositories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage which codebases are indexed and searchable.
          </p>
          {activeInstallation && (
            <p className="mt-1 text-xs text-gray-400">
              Connected: {activeInstallation.accountLogin} (
              {activeInstallation.accountType})
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {connectUrl && (
            <a href={connectUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Connect GitHub
              </Button>
            </a>
          )}
          <Button
            onClick={() => setModalOpen(true)}
            className="gap-2"
            disabled={!hasInstallation || installationsLoading}
            title={
              !hasInstallation
                ? "Connect or select a GitHub App installation first"
                : undefined
            }
          >
            <Plus className="h-4 w-4" />
            Add Repos
          </Button>
        </div>
      </div>

      {showInstallationPicker && (
        <div className="mb-6 rounded-lg border bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-900">
            Select a GitHub App installation
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Multiple installations were found for this app.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {installations.map((inst) => (
              <Button
                key={inst.id}
                variant="outline"
                size="sm"
                onClick={() => selectInstallation(String(inst.id))}
              >
                {inst.accountLogin} ({inst.accountType})
              </Button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : repos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <GitBranch className="h-10 w-10 text-gray-300 mb-3" />
          <h3 className="text-sm font-medium text-gray-900">
            No repositories indexed
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {hasInstallation
              ? "Click Add Repos to choose repositories from GitHub."
              : "Connect your GitHub App, then add repositories to get started."}
          </p>
          {!hasInstallation &&
            !installationsLoading &&
            installations.length === 0 && (
              <p className="mt-4 text-sm text-amber-700 max-w-md">
                No installations found. Use Connect GitHub to install the app on
                your org, and set the Setup URL to{" "}
                <code className="text-xs">/api/github/callback</code> in your
                app settings.
              </p>
            )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {repos.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              onDelete={handleDelete}
              onSync={handleSync}
            />
          ))}
        </div>
      )}

      <AddRepoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={loadRepos}
      />
    </div>
  );
}

export default function ReposPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      }
    >
      <ReposContent />
    </Suspense>
  );
}
