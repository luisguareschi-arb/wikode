"use client";

import { Folder } from "lucide-react";
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
        "flex shrink-0 items-center gap-3 bg-white px-4 py-1.5",
        className
      )}
    >
      <h1 className="min-w-0 truncate text-sm font-medium text-gray-900">
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
    </header>
  );
}
