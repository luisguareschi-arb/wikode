"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Highlight, type Language, themes } from "prism-react-renderer";
import { CitationCard, type CitationData } from "@/components/chat/CitationCard";

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
    <p className="mb-1 text-[13px] leading-relaxed text-gray-900 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-1 list-disc space-y-1 pl-5 text-[13px] text-gray-900">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-1 list-decimal space-y-1 pl-5 text-[13px] text-gray-900">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  em: ({ children }) => <em className="text-gray-900">{children}</em>,
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
        <code className="rounded bg-gray-100 px-1 py-0.5 text-[12px] font-mono text-gray-900">
          {children}
        </code>
      );
    }

    const match = /language-(\w+)/.exec(className ?? "");
    const code = String(children ?? "").replace(/\n$/, "");

    // Heuristic: short, single-line blocks (often produced by fenced code with one word)
    // should look like inline pills instead of full-width blocks.
    if (!match) {
      const isSingleShortLine = !code.includes("\n") && code.length <= 40;
      if (isSingleShortLine) {
        return (
          <code className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[12px] font-mono text-gray-900">
            {code}
          </code>
        );
      }

      // No language and multi-line: simple block code with a soft light background
      return (
        <code className="block mt-2 overflow-x-auto rounded-md bg-gray-100 px-3 py-2 text-[12px] leading-relaxed text-gray-900 font-mono">
          {code}
        </code>
      );
    }

    const language = match[1] as Language;

    // Block code with syntax highlighting and light background
    return (
      <code className="block mt-2 overflow-hidden rounded-md border border-gray-200 bg-[#f6f8fa] text-[12px] leading-relaxed text-gray-900 font-mono">
        <Highlight theme={themes.github} code={code} language={language}>
          {({ tokens, getLineProps, getTokenProps }) => (
            <div className="px-3 py-2">
              {tokens.map((line, i) => {
                const lineProps = getLineProps({ line, key: i });
                const { key, className: lpClassName, ...restLineProps } = lineProps as {
                  key?: React.Key;
                  className?: string;
                };
                const className = `${lpClassName ?? ""} whitespace-pre`;

                return (
                  <div key={i} {...restLineProps} className={className}>
                    {line.map((token, tokenIndex) => {
                      const tokenProps = getTokenProps({ token, key: tokenIndex });
                      const { key: tokenKey, ...restTokenProps } = tokenProps as {
                        key?: React.Key;
                      };
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
    <blockquote className="border-l-2 border-gray-200 pl-3 text-[13px] italic text-gray-800">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-2 border-gray-200" />,
};

export function MessageBubble({ message }: { message: ChatMessageItem }) {
  const parsedCitations = parseInlineCitations(message.content);
  const citations =
    message.citations && message.citations.length > 0
      ? message.citations
      : parsedCitations;
  const isUser = message.role === "user";

  const displayContent = (message.content || "").replace(citationPattern, "").trim();
  const effectiveContent = displayContent || (!isUser ? "Thinking…" : "");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-3xl rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-50 text-gray-900 border border-gray-200"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
            {effectiveContent}
          </p>
        ) : (
          <div className="space-y-1">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {effectiveContent}
            </ReactMarkdown>
          </div>
        )}
        {!isUser && citations.length > 0 ? (
          <div className="mt-3 space-y-2">
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
