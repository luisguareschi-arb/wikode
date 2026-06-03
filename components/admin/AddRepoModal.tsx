"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Github, CheckSquare, Square } from "lucide-react";

interface GithubRepo {
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
}

interface AddRepoModalProps {
  open: boolean;
  installationId: string | null;
  onClose: () => void;
  onAdded: () => void;
}

export function AddRepoModal({
  open,
  installationId,
  onClose,
  onAdded,
}: AddRepoModalProps) {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !installationId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/github/repos?installation_id=${installationId}`)
      .then((r) => r.json())
      .then((d) => {
        setRepos(d.repos ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load repositories");
        setLoading(false);
      });
  }, [open, installationId]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0 || !installationId) return;
    setSaving(true);
    const toAdd = repos.filter((r) => selected.has(r.githubRepoId));
    for (const repo of toAdd) {
      await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...repo,
          installationId: parseInt(installationId, 10),
        }),
      });
    }
    setSaving(false);
    onAdded();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Repositories</DialogTitle>
          <DialogDescription>
            Select repositories to index from your GitHub App installation.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && repos.length === 0 && (
          <p className="text-sm text-gray-500 py-4">No repositories found.</p>
        )}

        {!loading && repos.length > 0 && (
          <ul className="divide-y">
            {repos.map((repo) => (
              <li
                key={repo.githubRepoId}
                className="flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50 px-2 rounded"
                onClick={() => toggle(repo.githubRepoId)}
              >
                {selected.has(repo.githubRepoId) ? (
                  <CheckSquare className="h-4 w-4 text-blue-600 shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-gray-400 shrink-0" />
                )}
                <Github className="h-4 w-4 text-gray-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium font-mono">
                    {repo.fullName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {repo.private ? "Private" : "Public"} · {repo.defaultBranch}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={selected.size === 0 || saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding…
              </>
            ) : (
              `Add ${selected.size > 0 ? `${selected.size} ` : ""}Repo${selected.size !== 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
