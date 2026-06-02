import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import type { SearchResult } from "@/lib/retrieval/search";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RepoCitationContext {
  fullName: string;
  defaultBranch: string;
}

export interface CitationWithContext {
  filePath: string;
  startLine: number;
  endLine: number;
  repoFullName: string;
  defaultBranch: string;
  content: string;
}

const SYSTEM_PROMPT = `You are Wikode, an AI assistant that answers questions about private codebases.
You have been given relevant code snippets retrieved from the repositories.
Always cite your sources using the format: [filepath:startLine-endLine]
Be specific, technical, and concise. When showing code, use the exact snippets provided.
If the context is insufficient to answer, say so clearly.`;

const APPROX_CHARS_PER_TOKEN = 4;
const HISTORY_TOKEN_BUDGET = 8000;

function buildContextBlock(chunks: SearchResult[]): string {
  if (chunks.length === 0) return "";

  const lines = ["=== RETRIEVED CONTEXT ==="];
  for (const chunk of chunks) {
    lines.push(
      `[repo: ${chunk.repoFullName} | file: ${chunk.filePath} | lines: ${chunk.startLine}-${chunk.endLine}]`
    );
    lines.push(chunk.content);
    lines.push("");
  }
  lines.push("=========================");
  return lines.join("\n");
}

export function streamChat(
  userMessage: string,
  history: ChatMessage[],
  context: SearchResult[]
) {
  const contextBlock = buildContextBlock(context);
  const systemWithContext = contextBlock
    ? `${SYSTEM_PROMPT}\n\n${contextBlock}`
    : SYSTEM_PROMPT;

  return streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemWithContext,
    messages: [
      ...trimHistory(history).map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: userMessage },
    ],
    maxTokens: 4096,
  });
}

export function trimHistory(
  history: ChatMessage[],
  tokenBudget = HISTORY_TOKEN_BUDGET
): ChatMessage[] {
  if (history.length === 0) return [];

  const maxChars = tokenBudget * APPROX_CHARS_PER_TOKEN;
  let totalChars = history.reduce((acc, msg) => acc + msg.content.length, 0);
  if (totalChars <= maxChars) return history;

  const trimmed = [...history];
  while (trimmed.length > 0 && totalChars > maxChars) {
    const removed = trimmed.shift();
    totalChars -= removed?.content.length ?? 0;
  }

  return trimmed;
}

export function extractCitations(
  text: string
): { filePath: string; startLine: number; endLine: number }[] {
  const pattern = /\[([^\]]+):(\d+)-(\d+)\]/g;
  const citations: { filePath: string; startLine: number; endLine: number }[] = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    citations.push({
      filePath: match[1],
      startLine: parseInt(match[2], 10),
      endLine: parseInt(match[3], 10),
    });
  }

  return citations;
}

export function citationsWithContext(
  text: string,
  chunks: SearchResult[],
  repos: RepoCitationContext[]
): CitationWithContext[] {
  const extracted = extractCitations(text);
  if (extracted.length === 0) return [];

  const defaultBranchByRepo = new Map(repos.map((repo) => [repo.fullName, repo.defaultBranch]));

  const withContext: CitationWithContext[] = [];
  for (const citation of extracted) {
    const match = chunks.find(
      (chunk) =>
        chunk.filePath === citation.filePath &&
        chunk.startLine <= citation.startLine &&
        chunk.endLine >= citation.endLine
    );

    if (!match) continue;

    withContext.push({
      filePath: citation.filePath,
      startLine: citation.startLine,
      endLine: citation.endLine,
      repoFullName: match.repoFullName,
      defaultBranch: defaultBranchByRepo.get(match.repoFullName) ?? "main",
      content: match.content,
    });
  }

  return withContext;
}
