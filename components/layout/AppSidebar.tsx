"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  LogOut,
  MoreHorizontal,
  PanelLeft,
  Search,
  Settings,
  SquarePen,
  Trash2,
} from "lucide-react";
import { signOut } from "next-auth/react";
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
  const [menuOpen, setMenuOpen] = useState(false);

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
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--app-sidebar))]">
      <div className="flex items-center gap-1 px-3 pb-1 pt-3">
        <button
          type="button"
          className="rounded-md p-1.5 text-[hsl(var(--app-text-muted))] transition-colors hover:bg-black/4 hover:text-[hsl(var(--app-text))]"
          aria-label="Search"
        >
          <Search className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <Link
          href="/chat"
          className="rounded-md p-1.5 text-[hsl(var(--app-text-muted))] transition-colors hover:bg-black/4 hover:text-[hsl(var(--app-text))]"
          aria-label="New chat"
        >
          <SquarePen className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </div>

      <nav className="space-y-0.5 px-2 pb-2">
        <Link
          href="/chat"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-[hsl(var(--app-text))] transition-colors hover:bg-black/4",
            isNewChat && "bg-[hsl(var(--app-active))] font-medium"
          )}
        >
          <SquarePen className="h-4 w-4 shrink-0 text-[hsl(var(--app-text-muted))]" strokeWidth={1.75} />
          New chat
        </Link>
        {isAdmin ? (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-[hsl(var(--app-text))] transition-colors hover:bg-black/4",
              pathname.startsWith("/admin") && "bg-[hsl(var(--app-active))] font-medium"
            )}
          >
            <Settings className="h-4 w-4 shrink-0 text-[hsl(var(--app-text-muted))]" strokeWidth={1.75} />
            Admin
          </Link>
        ) : null}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="flex items-center gap-2 px-2.5 py-4 text-[13px] text-[hsl(var(--app-text-muted))]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading…
          </div>
        ) : threadGroups.length === 0 ? (
          <p className="px-2.5 py-4 text-xs text-[hsl(var(--app-text-muted))]">No conversations yet.</p>
        ) : (
          <div className="space-y-3">
            {threadGroups.map((group) => (
              <div key={group.label}>
                <p className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-[hsl(var(--app-text-muted))]">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.threads.map((thread) => {
                    const isActive = pathname === `/chat/${thread.id}`;
                    return (
                      <li key={thread.id}>
                        <Link
                          href={`/chat/${thread.id}`}
                          className={cn(
                            "group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-[hsl(var(--app-text))] transition-colors hover:bg-black/4",
                            isActive && "bg-[hsl(var(--app-active))] font-medium"
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {thread.title?.trim() || "Untitled"}
                          </span>
                          <button
                            type="button"
                            className="shrink-0 rounded p-0.5 text-[hsl(var(--app-text-muted))] opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                            aria-label="Delete conversation"
                            onClick={(event) => void deleteThread(thread.id, event)}
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
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

      <div className="border-t border-[hsl(var(--border))] p-2">
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name ?? "User"}
              className="h-7 w-7 shrink-0 rounded-full"
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--app-code-bg))] text-xs font-medium text-[hsl(var(--app-text))]">
              {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[hsl(var(--app-text))]">
              {user.name ?? "User"}
            </p>
          </div>
          <div className="relative">
            <button
              type="button"
              className="rounded-md p-1 text-[hsl(var(--app-text-muted))] transition-colors hover:bg-black/4 hover:text-[hsl(var(--app-text))]"
              aria-label="Account menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
            </button>
            {menuOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute bottom-full right-0 z-20 mb-1 min-w-[140px] rounded-lg border border-[hsl(var(--border))] bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[hsl(var(--app-text))] hover:bg-black/4"
                    onClick={() => void signOut({ callbackUrl: "/login" })}
                  >
                    <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Sign out
                  </button>
                </div>
              </>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-[hsl(var(--app-text-muted))] transition-colors hover:bg-black/4 hover:text-[hsl(var(--app-text))]"
            aria-label="Collapse sidebar"
          >
            <PanelLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}
