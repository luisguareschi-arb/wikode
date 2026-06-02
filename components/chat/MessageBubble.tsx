"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Highlight, type Language, themes } from "prism-react-renderer";
import { CitationCard, type CitationData } from "@/components/chat/CitationCard";
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
    <h2 className="mb-2 text-sm font-semibold text-gray-900">{children}</h2>
  ),
  h2: ({ children }) => (
    <h3 className="mb-2 text-[13px] font-semibold text-gray-900">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mb-1 text-[13px] font-semibold text-gray-900">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="mb-2 text-[13px] leading-relaxed text-gray-800 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1.5 pl-5 text-[13px] text-gray-800">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1.5 pl-5 text-[13px] text-gray-800">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  em: ({ children }) => <em className="text-gray-800">{children}</em>,
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
  code: ({ inline, className, children }) => {
    if (inline) {
      return (
        <code className="rounded bg-gray-200/80 px-1.5 py-0.5 font-mono text-[12px] text-gray-900">
          {children}
        </code>
      );
    }

    const match = /language-(\w+)/.exec(className ?? "");
    const code = String(children ?? "").replace(/\n$/, "");

    if (!match) {
      const isSingleShortLine = !code.includes("\n") && code.length <= 40;
      if (isSingleShortLine) {
        return (
          <code className="inline-block rounded bg-gray-200/80 px-1.5 py-0.5 font-mono text-[12px] text-gray-900">
            {code}
          </code>
        );
      }

      return (
        <code className="mt-2 block overflow-x-auto rounded-md bg-gray-100 px-3 py-2 font-mono text-[12px] leading-relaxed text-gray-900">
          {code}
        </code>
      );
    }

    const language = match[1] as Language;

    return (
      <code className="mt-2 block overflow-hidden rounded-md border border-gray-200 bg-[#f6f8fa] font-mono text-[12px] leading-relaxed text-gray-900">
        <Highlight theme={themes.github} code={code} language={language}>
          {({ tokens, getLineProps, getTokenProps }) => (
            <div className="px-3 py-2">
              {tokens.map((line, i) => {
                const lineProps = getLineProps({ line, key: i });
                const { className: lpClassName, ...restLineProps } = lineProps as {
                  className?: string;
                };
                return (
                  <div key={i} {...restLineProps} className={`${lpClassName ?? ""} whitespace-pre`}>
                    {line.map((token, tokenIndex) => {
                      const tokenProps = getTokenProps({ token, key: tokenIndex });
                      const { key: tokenKey, ...restTokenProps } = tokenProps as { key?: React.Key };
                      return <span key={tokenIndex} {...restTokenProps} />;
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </Highlight>
      </code>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-gray-200 pl-3 text-[13px] italic text-gray-700">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-gray-200" />,
};

export function MessageBubble({ message }: { message: ChatMessageItem }) {
  const parsedCitations = parseInlineCitations(message.content);
  const citations =
    message.citations && message.citations.length > 0 ? message.citations : parsedCitations;
  const isUser = message.role === "user";

  const displayContent = (message.content || "").replace(citationPattern, "").trim();
  const effectiveContent = displayContent || (!isUser ? "Thinking…" : "");

  if (isUser) {
    return (
      <div className="w-full sticky top-2">
        <div className="inline-block max-w-full rounded-2xl bg-gray-100 px-4 py-3 w-full">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-gray-900">
            {effectiveContent}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-1">
      <div className={cn("prose-sm max-w-none", !effectiveContent && "text-gray-400")}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {effectiveContent}
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
