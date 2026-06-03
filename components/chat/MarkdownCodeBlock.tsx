"use client";

import type { Language } from "prism-react-renderer";
import { CodeHighlight } from "@/components/chat/CodeHighlight";

interface MarkdownCodeBlockProps {
  className?: string;
  children?: React.ReactNode;
  inline?: boolean;
}

export function MarkdownCodeBlock({
  className,
  children,
  inline,
}: MarkdownCodeBlockProps) {
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
    <code className="mt-2 block overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--app-code-bg))] font-mono text-[13px] leading-relaxed">
      <CodeHighlight code={code} language={language} className="px-3 py-2.5" />
    </code>
  );
}
