"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadyRepo {
  id: string;
  fullName: string;
  defaultBranch: string;
}

interface RepoBranchPickerProps {
  selectedRepoIds: string[];
  onChange?: (repoIds: string[]) => void;
  className?: string;
  variant?: "composer" | "header";
}

function repoShortName(fullName: string) {
  const slash = fullName.indexOf("/");
  return slash >= 0 ? fullName.slice(slash + 1) : fullName;
}

export function RepoBranchPicker({
  selectedRepoIds,
  onChange,
  className,
  variant = "composer",
}: RepoBranchPickerProps) {
  const [repos, setRepos] = useState<ReadyRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [repoOpen, setRepoOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const readOnly = !onChange;

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

  useEffect(() => {
    if (readOnly || loading || repos.length === 0 || selectedRepoIds.length > 0) return;
    onChange([repos[0].id]);
  }, [readOnly, loading, repos, selectedRepoIds.length, onChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setRepoOpen(false);
        setBranchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedRepo = repos.find((repo) => repo.id === selectedRepoIds[0]);
  const selectedBranch = selectedRepo?.defaultBranch ?? "main";

  if (loading) {
    return (
      <div className={cn("flex items-center gap-1.5 text-[hsl(var(--app-text-muted))]", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        {variant === "header" ? (
          <span className="text-[13px]">Loading…</span>
        ) : (
          <span className="text-sm">Loading repositories...</span>
        )}
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <p
        className={cn(
          variant === "header" ? "text-[13px]" : "text-sm",
          "text-[hsl(var(--app-text-muted))]",
          className
        )}
      >
        {variant === "header"
          ? "No repository"
          : "No READY repositories found. Index a repository from Admin first."}
      </p>
    );
  }

  const repoLabel =
    variant === "header"
      ? selectedRepo?.fullName ?? "Select repository"
      : selectedRepo
        ? repoShortName(selectedRepo.fullName)
        : "Select repository";

  if (variant === "header") {
    const repoContent = (
      <span className="max-w-[180px] truncate font-mono text-[13px] sm:max-w-xs">{repoLabel}</span>
    );

    return (
      <div ref={containerRef} className={cn("relative", className)}>
        {readOnly ? (
          repoContent
        ) : (
          <button
            type="button"
            onClick={() => setRepoOpen((open) => !open)}
            className="text-[13px] text-[hsl(var(--app-text-muted))] hover:text-[hsl(var(--app-text))]"
          >
            {repoContent}
          </button>
        )}
        {repoOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[220px] rounded-lg border border-[hsl(var(--border))] bg-white py-1 shadow-lg">
            {repos.map((repo) => (
              <button
                key={repo.id}
                type="button"
                onClick={() => {
                  onChange?.([repo.id]);
                  setRepoOpen(false);
                }}
                className={cn(
                  "block w-full px-3 py-2 text-left text-[13px] hover:bg-black/4",
                  repo.id === selectedRepoIds[0] && "bg-[hsl(var(--app-active))] font-medium"
                )}
              >
                {repo.fullName}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("flex flex-wrap items-center gap-1", className)}>
      <div className="relative">
        <button
          type="button"
          disabled={readOnly}
          onClick={() => {
            if (readOnly) return;
            setBranchOpen(false);
            setRepoOpen((open) => !open);
          }}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-[hsl(var(--app-text))]",
            !readOnly && "hover:bg-black/4"
          )}
        >
          {repoLabel}
          {!readOnly && <ChevronDown className="h-3.5 w-3.5 text-[hsl(var(--app-text-muted))]" />}
        </button>
        {repoOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[220px] rounded-lg border border-[hsl(var(--border))] bg-white py-1 shadow-lg">
            {repos.map((repo) => (
              <button
                key={repo.id}
                type="button"
                onClick={() => {
                  onChange?.([repo.id]);
                  setRepoOpen(false);
                }}
                className={cn(
                  "block w-full px-3 py-2 text-left text-[13px] hover:bg-black/4",
                  repo.id === selectedRepoIds[0] && "bg-[hsl(var(--app-active))] font-medium"
                )}
              >
                {repo.fullName}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          disabled={readOnly || !selectedRepo}
          onClick={() => {
            if (readOnly || !selectedRepo) return;
            setRepoOpen(false);
            setBranchOpen((open) => !open);
          }}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-[hsl(var(--app-text))]",
            !readOnly && selectedRepo && "hover:bg-black/4"
          )}
        >
          {selectedBranch}
          {!readOnly && selectedRepo && <ChevronDown className="h-3.5 w-3.5 text-[hsl(var(--app-text-muted))]" />}
        </button>
        {branchOpen && selectedRepo && (
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-[hsl(var(--border))] bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => setBranchOpen(false)}
              className="block w-full px-3 py-2 text-left text-[13px] bg-[hsl(var(--app-active))] font-medium"
            >
              {selectedRepo.defaultBranch}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
