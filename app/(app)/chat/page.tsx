"use client";

import { useState } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { RepoSelector } from "@/components/chat/RepoSelector";

export default function ChatPage() {
  const [repoIds, setRepoIds] = useState<string[]>([]);

  return (
    <div className="grid h-full min-h-screen grid-cols-1 lg:grid-cols-[360px_1fr]">
      <div className="border-r bg-gray-50 p-4">
        <h2 className="text-sm font-semibold text-gray-900">Select repositories</h2>
        <p className="mt-1 text-xs text-gray-500">Only READY repositories are available for new chats.</p>
        <div className="mt-4">
          <RepoSelector selectedRepoIds={repoIds} onChange={setRepoIds} />
        </div>
      </div>
      <div className="bg-white">
        <ChatWindow
          key="new-chat"
          repoIds={repoIds}
          placeholder="Start a new conversation..."
        />
      </div>
    </div>
  );
}
