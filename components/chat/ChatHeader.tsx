"use client";

import { Folder, MoreHorizontal } from "lucide-react";
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
        "flex shrink-0 items-center gap-3 px-4 py-2.5",
        className
      )}
    >
      <h1 className="min-w-0 truncate text-sm font-normal text-[hsl(var(--app-text))]">
        {title || "New conversation"}
      </h1>
      <div className="flex min-w-0 shrink items-center gap-1.5 text-[hsl(var(--app-text-muted))]">
        <Folder className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
        <RepoBranchPicker
          variant="header"
          selectedRepoIds={repoIds}
          onChange={onRepoIdsChange}
        />
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          className="rounded-md p-1.5 text-[hsl(var(--app-text-muted))] transition-colors hover:bg-black/4 hover:text-[hsl(var(--app-text))]"
          aria-label="More options"
        >
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
