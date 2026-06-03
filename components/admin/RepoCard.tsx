"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, RefreshCw, Trash2, Clock, AlertCircle } from "lucide-react";

type IndexStatus = "PENDING" | "INDEXING" | "READY" | "ERROR";

interface RepoCardProps {
  repo: {
    id: string;
    fullName: string;
    defaultBranch: string;
    status: IndexStatus;
    lastIndexedSha: string | null;
    errorMessage: string | null;
    updatedAt: string;
  };
  onDelete: (id: string) => void;
  onSync: (id: string) => void;
}

const statusConfig: Record<
  IndexStatus,
  {
    label: string;
    variant:
      | "default"
      | "secondary"
      | "destructive"
      | "success"
      | "warning"
      | "outline";
  }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  INDEXING: { label: "Indexing…", variant: "warning" },
  READY: { label: "Ready", variant: "success" },
  ERROR: { label: "Error", variant: "destructive" },
};

export function RepoCard({ repo, onDelete, onSync }: RepoCardProps) {
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { label, variant } = statusConfig[repo.status];

  const handleSync = async () => {
    setSyncing(true);
    await onSync(repo.id);
    setSyncing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Remove ${repo.fullName}? This will delete all indexed data.`))
      return;
    setDeleting(true);
    await onDelete(repo.id);
    setDeleting(false);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-mono">
              {repo.fullName}
            </CardTitle>
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <GitBranch className="h-3 w-3" />
              <span>{repo.defaultBranch}</span>
            </div>
          </div>
          <Badge variant={variant}>{label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {repo.status === "ERROR" && repo.errorMessage && (
          <div className="flex items-start gap-2 mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{repo.errorMessage}</span>
          </div>
        )}
        {repo.lastIndexedSha && (
          <div className="flex items-center gap-1 mb-3 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>Last indexed: {repo.lastIndexedSha.slice(0, 7)}</span>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing || repo.status === "INDEXING"}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Queued" : "Re-sync"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
