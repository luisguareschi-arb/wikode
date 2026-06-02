"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ReadyRepo {
  id: string;
  fullName: string;
  defaultBranch: string;
}

interface RepoSelectorProps {
  selectedRepoIds: string[];
  onChange: (repoIds: string[]) => void;
}

export function RepoSelector({ selectedRepoIds, onChange }: RepoSelectorProps) {
  const [repos, setRepos] = useState<ReadyRepo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch("/api/repos/available");
        const data = (await res.json()) as { repos?: ReadyRepo[] };
        if (isMounted) setRepos(data.repos ?? []);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleRepo = (repoId: string) => {
    if (selectedRepoIds.includes(repoId)) {
      onChange(selectedRepoIds.filter((id) => id !== repoId));
      return;
    }
    onChange([...selectedRepoIds, repoId]);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading repositories...
      </div>
    );
  }

  if (repos.length === 0) {
    return <p className="text-sm text-gray-500">No READY repositories found. Index a repository from Admin first.</p>;
  }

  return (
    <div className="space-y-2">
      {repos.map((repo) => {
        const selected = selectedRepoIds.includes(repo.id);
        return (
          <button
            key={repo.id}
            type="button"
            onClick={() => toggleRepo(repo.id)}
            className={`w-full rounded-md border p-3 text-left ${
              selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
          >
            <p className="text-sm font-medium text-gray-900">{repo.fullName}</p>
            <p className="mt-1 text-xs text-gray-500">Default branch: {repo.defaultBranch}</p>
          </button>
        );
      })}
    </div>
  );
}
