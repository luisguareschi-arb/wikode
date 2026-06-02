"use client";

import { FolderGit2, MoreHorizontal } from "lucide-react";
import { RepoBranchPicker } from "@/components/chat/RepoBranchPicker";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  title: string;
  repoIds: string[];
  onRepoIdsChange?: (repoIds: string[]) => void;
  className?: string;
}

export function ChatHeader({ title, repoIds, onRepoIdsChange, className }: ChatHeaderProps) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3",
        className
      )}
    >
      <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
        {title || "New conversation"}
      </h1>
      <div className="flex shrink-0 items-center gap-1">
        <div className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1">
          <FolderGit2 className="h-3.5 w-3.5 text-gray-500" />
          <RepoBranchPicker
            variant="header"
            selectedRepoIds={repoIds}
            onChange={onRepoIdsChange}
          />
        </div>
        <button
          type="button"
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="More options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
