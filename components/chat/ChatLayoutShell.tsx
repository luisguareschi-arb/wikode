"use client";

import { useEffect, useState } from "react";
import { ThreadSidebar } from "@/components/chat/ThreadSidebar";

export function ChatLayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const toggle = () => setSidebarOpen((open) => !open);
    window.addEventListener("wikode:toggle-thread-sidebar", toggle);
    return () => window.removeEventListener("wikode:toggle-thread-sidebar", toggle);
  }, []);

  return (
    <div className="flex h-full min-h-screen">
      {sidebarOpen ? <ThreadSidebar /> : null}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
