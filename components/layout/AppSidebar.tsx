"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Code2, Loader2, LogOut, MessageSquare, Settings, SquarePen, Trash2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { groupThreadsByDate, type ThreadListItem } from "@/lib/chat/group-threads";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  isAdmin: boolean;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AppSidebar({ isAdmin, user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadThreads = useCallback(async () => {
    try {
      const response = await fetch("/api/threads");
      const data = (await response.json()) as { threads?: ThreadListItem[] };
      setThreads(data.threads ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads, pathname]);

  useEffect(() => {
    const onThreadsChanged = () => void loadThreads();
    window.addEventListener("wikode:threads-changed", onThreadsChanged);
    return () => window.removeEventListener("wikode:threads-changed", onThreadsChanged);
  }, [loadThreads]);

  const deleteThread = async (threadId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    await fetch(`/api/threads/${threadId}`, { method: "DELETE" });
    await loadThreads();
    if (pathname === `/chat/${threadId}`) {
      router.push("/chat");
    }
  };

  const threadGroups = groupThreadsByDate(threads);
  const isNewChat = pathname === "/chat";

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600">
          <Code2 className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-gray-900">Wikode</span>
      </div>

      <nav className="space-y-0.5 px-2 pb-2">
        <Link
          href="/chat"
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100",
            isNewChat && "bg-gray-100 font-medium text-gray-900"
          )}
        >
          <SquarePen className="h-4 w-4 shrink-0" />
          New chat
        </Link>
        {isAdmin ? (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100",
              pathname.startsWith("/admin") && "bg-gray-100 font-medium text-gray-900"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            Admin
          </Link>
        ) : null}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-4 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : threadGroups.length === 0 ? (
          <p className="px-3 py-4 text-xs text-gray-500">No conversations yet.</p>
        ) : (
          <div className="space-y-3">
            {threadGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 py-1 text-xs font-medium text-gray-500">{group.label}</p>
                <ul className="space-y-0.5">
                  {group.threads.map((thread) => {
                    const isActive = pathname === `/chat/${thread.id}`;
                    return (
                      <li key={thread.id}>
                        <Link
                          href={`/chat/${thread.id}`}
                          className={cn(
                            "group flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-800 hover:bg-gray-100",
                            isActive && "bg-gray-100 font-medium text-gray-900"
                          )}
                        >
                          <MessageSquare className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          <span className="min-w-0 flex-1 truncate">
                            {thread.title?.trim() || "Untitled"}
                          </span>
                          <button
                            type="button"
                            className="shrink-0 rounded p-0.5 text-gray-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                            aria-label="Delete conversation"
                            onClick={(event) => void deleteThread(thread.id, event)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-3">
        <div className="mb-2 flex items-center gap-2 px-1">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name ?? "User"} className="h-7 w-7 rounded-full" />
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-gray-600"
          onClick={() => void signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
