"use client";

import { CitationCard, type CitationData } from "@/components/chat/CitationCard";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: CitationData[] | null;
}

function parseInlineCitations(text: string): CitationData[] {
  const pattern = /\[([^\]]+):(\d+)-(\d+)\]/g;
  const results: CitationData[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    results.push({
      filePath: match[1],
      startLine: Number.parseInt(match[2], 10),
      endLine: Number.parseInt(match[3], 10),
    });
  }

  return results;
}

export function MessageBubble({ message }: { message: ChatMessageItem }) {
  const parsedCitations = parseInlineCitations(message.content);
  const citations = message.citations && message.citations.length > 0 ? message.citations : parsedCitations;
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-3xl rounded-lg px-4 py-3 ${isUser ? "bg-blue-600 text-white" : "bg-white border text-gray-900"}`}>
        <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
        {!isUser && citations.length > 0 ? (
          <div className="mt-2 space-y-2">
            {citations.map((citation, index) => (
              <CitationCard
                key={`${citation.filePath}-${citation.startLine}-${citation.endLine}-${index}`}
                citation={citation}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
