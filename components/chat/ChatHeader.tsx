"use client";

import { Folder, MoreHorizontal, PanelRightOpen } from "lucide-react";
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
        "flex shrink-0 items-center justify-between gap-4 bg-white px-4 py-1.5",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate text-sm font-medium text-gray-900">
          {title || "New conversation"}
        </h1>
        <div className="flex shrink-0 items-center gap-1.5 text-gray-500">
          <Folder className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <RepoBranchPicker
            variant="header"
            selectedRepoIds={repoIds}
            onChange={onRepoIdsChange}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center">
        <button
          type="button"
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="More options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Toggle conversation sidebar"
          onClick={() => window.dispatchEvent(new CustomEvent("wikode:toggle-thread-sidebar"))}
        >
          <PanelRightOpen className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
