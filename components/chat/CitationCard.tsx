"use client";

import { useMemo } from "react";
import { ExternalLink, FileCode2 } from "lucide-react";
import { Highlight, type Language, themes } from "prism-react-renderer";
import { cn } from "@/lib/utils";

export interface CitationData {
  filePath: string;
  startLine: number;
  endLine: number;
  repoFullName?: string;
  defaultBranch?: string;
  content?: string;
}

function fileNameFromPath(filePath: string) {
  const parts = filePath.split("/");
  return parts[parts.length - 1] || filePath;
}

function languageFromFilePath(filePath: string): Language {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const byExtension: Record<string, Language> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    json: "json",
    md: "markdown",
    css: "css",
    scss: "scss",
    html: "html",
    sql: "sql",
    sh: "bash",
    bash: "bash",
    yml: "yaml",
    yaml: "yaml",
    prisma: "graphql",
  };
  return byExtension[ext ?? ""] ?? "typescript";
}

function CitationCodeBlock({
  code,
  filePath,
}: {
  code: string;
  filePath: string;
}) {
  const language = languageFromFilePath(filePath);

  return (
    <Highlight theme={themes.github} code={code} language={language}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <div className="overflow-x-auto px-3 py-2 font-mono text-[12px] leading-relaxed">
          {tokens.map((line, lineIndex) => {
            const lineProps = getLineProps({ line, key: lineIndex });
            const {
              key: lineKey,
              className,
              ...restLineProps
            } = lineProps as {
              key?: React.Key;
              className?: string;
            };
            return (
              <div
                key={lineKey ?? lineIndex}
                {...restLineProps}
                className={cn(className, "whitespace-pre")}
              >
                {line.map((token, tokenIndex) => {
                  const tokenProps = getTokenProps({ token, key: tokenIndex });
                  const { key: tokenKey, ...restTokenProps } = tokenProps as {
                    key?: React.Key;
                  };
                  return (
                    <span key={tokenKey ?? tokenIndex} {...restTokenProps} />
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </Highlight>
  );
}

export function CitationCard({ citation }: { citation: CitationData }) {
  const fileName = fileNameFromPath(citation.filePath);
  const lineLabel =
    citation.startLine === citation.endLine
      ? `L${citation.startLine}`
      : `L${citation.startLine}–${citation.endLine}`;

  const githubUrl = useMemo(() => {
    if (!citation.repoFullName) return null;
    const branch = citation.defaultBranch ?? "main";
    const path = citation.filePath.split("/").map(encodeURIComponent).join("/");
    return `https://github.com/${citation.repoFullName}/blob/${encodeURIComponent(branch)}/${path}#L${citation.startLine}-L${citation.endLine}`;
  }, [citation]);

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--app-code-bg))]">
      <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] px-3 py-2">
        <FileCode2
          className="h-4 w-4 shrink-0 text-[hsl(var(--app-text-muted))]"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="truncate text-[13px] font-medium text-[hsl(var(--app-text))]">
          {fileName}
        </span>
        <span className="shrink-0 text-[13px] text-[hsl(var(--app-text-muted))]">
          {lineLabel}
        </span>
        {githubUrl ? (
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex shrink-0 items-center gap-1 text-[13px] text-[hsl(var(--app-text-muted))] hover:text-[hsl(var(--app-text))]"
          >
            View on GitHub
            <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
          </a>
        ) : null}
      </div>
      {citation.content ? (
        <CitationCodeBlock
          code={citation.content}
          filePath={citation.filePath}
        />
      ) : null}
    </div>
  );
}
