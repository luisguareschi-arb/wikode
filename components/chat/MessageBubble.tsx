"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Highlight, type Language, themes } from "prism-react-renderer";
import {
  CitationCard,
  type CitationData,
} from "@/components/chat/CitationCard";
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
  code: (props) => {
    const { className, children } = props;
    const inline = (props as { inline?: boolean }).inline;
    if (inline) {
      return (
        <code className="rounded-[4px] bg-[hsl(var(--app-code-bg))] px-1.5 py-0.5 font-mono text-[13px] text-[hsl(var(--app-text))]">
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
          <code className="inline-block rounded-[4px] bg-[hsl(var(--app-code-bg))] px-1.5 py-0.5 font-mono text-[13px] text-[hsl(var(--app-text))]">
            {code}
          </code>
        );
      }

      return (
        <code className="mt-2 block overflow-x-auto rounded-lg bg-[hsl(var(--app-code-bg))] px-3 py-2.5 font-mono text-[13px] leading-relaxed text-[hsl(var(--app-text))]">
          {code}
        </code>
      );
    }

    const language = match[1] as Language;

    return (
      <code className="mt-2 block overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--app-code-bg))] font-mono text-[13px] leading-relaxed text-[hsl(var(--app-text))]">
        <Highlight theme={themes.github} code={code} language={language}>
          {({ tokens, getLineProps, getTokenProps }) => (
            <div className="px-3 py-2.5">
              {tokens.map((line, i) => {
                const lineProps = getLineProps({ line, key: i });
                const {
                  key: lineKey,
                  className: lpClassName,
                  ...restLineProps
                } = lineProps as {
                  key?: React.Key;
                  className?: string;
                };
                return (
                  <div
                    key={lineKey ?? i}
                    {...restLineProps}
                    className={`${lpClassName ?? ""} whitespace-pre`}
                  >
                    {line.map((token, tokenIndex) => {
                      const tokenProps = getTokenProps({
                        token,
                        key: tokenIndex,
                      });
                      const { key: tokenKey, ...restTokenProps } =
                        tokenProps as { key?: React.Key };
                      return (
                        <span
                          key={tokenKey ?? tokenIndex}
                          {...restTokenProps}
                        />
                      );
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
  const effectiveContent = displayContent || (!isUser ? "Thinking…" : "");

  if (isUser) {
    return (
      <div className="w-full sticky top-0">
        <div className="inline-block w-full max-w-full rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2">
          <p className="whitespace-pre-wrap text-[14px] leading-[1.6] text-[hsl(var(--app-text))]">
            {effectiveContent}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-1 px-3">
      <div
        className={cn(
          "max-w-none",
          !effectiveContent && "text-[hsl(var(--app-text-muted))]",
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
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
