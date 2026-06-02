"use client";

import { useState } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ChatPage() {
  const [repoIds, setRepoIds] = useState<string[]>([]);

  return (
    <div className="flex h-full flex-1 flex-col bg-[hsl(var(--app-surface))]">
      <ChatWindow
        key="new-chat"
        repoIds={repoIds}
        onRepoIdsChange={setRepoIds}
      />
    </div>
  );
}
