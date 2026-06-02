"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageBubble, type ChatMessageItem } from "@/components/chat/MessageBubble";

interface ChatWindowProps {
  initialMessages?: ChatMessageItem[];
  threadId?: string;
  repoIds: string[];
  placeholder?: string;
}

export function ChatWindow({ initialMessages = [], threadId, repoIds, placeholder }: ChatWindowProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>(threadId);
  const disabled = sending || repoIds.length === 0 || !value.trim();

  const helperText = useMemo(() => {
    if (repoIds.length === 0) return "Select at least one READY repository.";
    return null;
  }, [repoIds]);

  const sendMessage = async () => {
    const userMessage = value.trim();
    if (!userMessage || sending || repoIds.length === 0) return;
    setSending(true);
    setValue("");

    const userEntry: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
    };
    setMessages((prev) => [...prev, userEntry]);

    let resolvedThreadId = activeThreadId;
    if (!resolvedThreadId) {
      const threadRes = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: userMessage.slice(0, 80),
          repoIds,
        }),
      });
      const threadData = (await threadRes.json()) as { thread?: { id: string } };
      resolvedThreadId = threadData.thread?.id;
      if (!resolvedThreadId) {
        setSending(false);
        return;
      }
      setActiveThreadId(resolvedThreadId);
      router.push(`/chat/${resolvedThreadId}`);
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: resolvedThreadId,
        message: userMessage,
        repoIds,
      }),
    });

    if (!response.body) {
      setSending(false);
      return;
    }

    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    while (!done) {
      const chunk = await reader.read();
      done = chunk.done;
      if (chunk.value) {
        const text = decoder.decode(chunk.value, { stream: !done });
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantId ? { ...msg, content: msg.content + text } : msg))
        );
      }
    }

    setSending(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="max-w-md text-sm text-gray-500">
              Ask a question about your selected repositories. Responses include file and line citations.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>
      <div className="border-t p-4">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void sendMessage();
            }
          }}
          placeholder={placeholder ?? "Ask about your codebase..."}
          className="min-h-24 w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-500">{helperText}</p>
          <Button onClick={() => void sendMessage()} disabled={disabled}>
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
