"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface CitationData {
  filePath: string;
  startLine: number;
  endLine: number;
  repoFullName?: string;
  defaultBranch?: string;
  content?: string;
}

export function CitationCard({ citation }: { citation: CitationData }) {
  const githubUrl = useMemo(() => {
    if (!citation.repoFullName) return null;
    const branch = citation.defaultBranch ?? "main";
    const path = citation.filePath.split("/").map(encodeURIComponent).join("/");
    return `https://github.com/${citation.repoFullName}/blob/${encodeURIComponent(branch)}/${path}#L${citation.startLine}-L${citation.endLine}`;
  }, [citation]);

  return (
    <Card className="mt-2 border-gray-200">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-gray-700">
            {citation.filePath}:{citation.startLine}-{citation.endLine}
          </p>
          {githubUrl ? (
            <a href={githubUrl} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                View on GitHub
              </Button>
            </a>
          ) : null}
        </div>
        {citation.content ? (
          <pre className="mt-2 overflow-x-auto rounded-md bg-gray-50 p-2 text-xs text-gray-700">
            <code>{citation.content}</code>
          </pre>
        ) : null}
      </CardContent>
    </Card>
  );
}
