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

function ReposContent() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const installationId = searchParams.get("installation_id");

  const loadRepos = useCallback(async () => {
    const res = await fetch("/api/repos");
    const data = await res.json();
    setRepos(data.repos ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRepos();
    if (installationId) setModalOpen(true);
  }, [loadRepos, installationId]);

  // Poll while repos are actively indexing
  useEffect(() => {
    const hasActive = repos.some((r) => r.status === "PENDING" || r.status === "INDEXING");
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

  const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG;
  const connectUrl = appSlug ? `https://github.com/apps/${appSlug}/installations/new` : null;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Repositories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage which codebases are indexed and searchable.
          </p>
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
            disabled={!installationId}
            title={!installationId ? "Connect GitHub App first" : undefined}
          >
            <Plus className="h-4 w-4" />
            Add Repos
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : repos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <GitBranch className="h-10 w-10 text-gray-300 mb-3" />
          <h3 className="text-sm font-medium text-gray-900">No repositories indexed</h3>
          <p className="mt-1 text-sm text-gray-500">
            Connect your GitHub App and add repositories to get started.
          </p>
          {connectUrl && (
            <a href={connectUrl} target="_blank" rel="noreferrer" className="mt-4">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Connect GitHub App
              </Button>
            </a>
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
        installationId={installationId}
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
