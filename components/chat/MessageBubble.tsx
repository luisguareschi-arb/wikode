"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  CitationCard,
  type CitationData,
} from "@/components/chat/CitationCard";
import { MarkdownCodeBlock } from "@/components/chat/MarkdownCodeBlock";
import { cn } from "@/lib/utils";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: CitationData[] | null;
}

const citationPattern = /\[([^\]]+):(\d+)-(\d+)\]/g;

function parseInlineCitations(text: string): CitationData[] {
  const results: CitationData[] = [];
  let match: RegExpExecArray | null;

  while ((match = citationPattern.exec(text)) !== null) {
    results.push({
      filePath: match[1],
      startLine: Number.parseInt(match[2], 10),
      endLine: Number.parseInt(match[3], 10),
    });
  }

  return results;
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h2 className="mb-3 mt-1 text-base font-semibold text-[hsl(var(--app-text))]">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h3 className="mb-2 mt-1 text-[15px] font-semibold text-[hsl(var(--app-text))]">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="mb-1.5 mt-1 text-[14px] font-semibold text-[hsl(var(--app-text))]">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="mb-3 text-[14px] leading-[1.6] text-[hsl(var(--app-text))] last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1.5 pl-5 text-[14px] leading-[1.6] text-[hsl(var(--app-text))]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-[14px] leading-[1.6] text-[hsl(var(--app-text))]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-[1.6]">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-[hsl(var(--app-text))]">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="text-[hsl(var(--app-text))]">{children}</em>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-blue-600 underline underline-offset-2"
    >
      {children}
    </a>
  ),
  code: (props) => <MarkdownCodeBlock {...props} />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[hsl(var(--border))] pl-3 text-[14px] italic text-[hsl(var(--app-text-muted))]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-[hsl(var(--border))]" />,
};

export function MessageBubble({ message }: { message: ChatMessageItem }) {
  const parsedCitations = parseInlineCitations(message.content);
  const citations =
    message.citations && message.citations.length > 0
      ? message.citations
      : parsedCitations;
  const isUser = message.role === "user";

  const displayContent = (message.content || "")
    .replace(citationPattern, "")
    .trim();
  const isThinking = !isUser && !displayContent;

  if (isUser) {
    return (
      <div className="w-full sticky top-0">
        <div className="inline-block w-full max-w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2">
          <p className="whitespace-pre-wrap text-[14px] leading-[1.6] text-[hsl(var(--app-text))]">
            {displayContent}
          </p>
        </div>
      </div>
    );
  }

  if (isThinking) {
    return (
      <div className="w-full px-3 py-1">
        <p className="animate-pulse text-[14px] text-[hsl(var(--app-text-muted))]">
          Thinking…
        </p>
      </div>
    );
  }

  return (
    <div className="w-full py-1 px-3">
      <div className="max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {displayContent}
        </ReactMarkdown>
      </div>
      {citations.length > 0 ? (
        <div className="mt-4 space-y-2">
          {citations.map((citation, index) => (
            <CitationCard
              key={`${citation.filePath}-${citation.startLine}-${citation.endLine}-${index}`}
              citation={citation}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
