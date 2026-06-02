"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface ThreadItem {
  id: string;
  title: string | null;
  updatedAt: string;
}

export function ThreadSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadThreads = useCallback(async () => {
    const response = await fetch("/api/threads");
    const data = (await response.json()) as { threads?: ThreadItem[] };
    setThreads(data.threads ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const deleteThread = async (threadId: string) => {
    await fetch(`/api/threads/${threadId}`, { method: "DELETE" });
    await loadThreads();
    if (pathname === `/chat/${threadId}`) {
      router.push("/chat");
    }
  };

  return (
    <aside className="w-72 flex-shrink-0 border-r bg-white">
      <div className="border-b p-3">
        <Link href="/chat">
          <Button className="w-full gap-2">
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </Link>
      </div>
      <div className="h-[calc(100vh-57px)] overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center gap-2 px-2 py-4 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading threads...
          </div>
        ) : threads.length === 0 ? (
          <p className="px-2 py-4 text-sm text-gray-500">No conversations yet.</p>
        ) : (
          <ul className="space-y-1">
            {threads.map((thread) => {
              const isActive = pathname === `/chat/${thread.id}`;
              return (
                <li key={thread.id}>
                  <div
                    className={`flex items-center justify-between rounded-md px-2 py-2 ${
                      isActive ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <Link href={`/chat/${thread.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {thread.title?.trim() || "Untitled thread"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(thread.updatedAt).toLocaleString()}
                      </p>
                    </Link>
                    <button
                      type="button"
                      className="ml-2 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      onClick={() => deleteThread(thread.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
