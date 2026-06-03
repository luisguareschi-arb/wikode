import { prisma } from "@/lib/prisma";

export interface SearchResult {
  chunkId: string;
  content: string;
  startLine: number;
  endLine: number;
  filePath: string;
  language: string | null;
  repoFullName: string;
  similarity: number;
}

function isContiguous(a: SearchResult, b: SearchResult): boolean {
  return a.filePath === b.filePath && Math.abs(a.startLine - b.endLine) <= 20;
}

export function rerankChunks(
  chunks: SearchResult[],
  limit = 12,
): SearchResult[] {
  if (chunks.length <= 1) return chunks.slice(0, limit);

  const grouped = new Map<string, SearchResult[]>();
  for (const chunk of chunks) {
    const key = `${chunk.repoFullName}::${chunk.filePath}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(chunk);
    } else {
      grouped.set(key, [chunk]);
    }
  }

  // Per file, keep the strongest match and contiguous neighbors.
  const reranked: SearchResult[] = [];
  for (const [, fileChunks] of grouped) {
    const sortedBySimilarity = [...fileChunks].sort(
      (a, b) => b.similarity - a.similarity,
    );
    const best = sortedBySimilarity[0];
    reranked.push(best);

    const contiguous = fileChunks
      .filter(
        (chunk) => chunk.chunkId !== best.chunkId && isContiguous(best, chunk),
      )
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 1);

    reranked.push(...contiguous);
  }

  return reranked.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}

export async function searchChunks(
  queryEmbedding: number[],
  repoIds: string[],
  limit = 20,
): Promise<SearchResult[]> {
  if (repoIds.length === 0) return [];

  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      content: string;
      startLine: number;
      endLine: number;
      filePath: string;
      language: string | null;
      fullName: string;
      similarity: number;
    }[]
  >(
    `
    SELECT
      c.id,
      c.content,
      c."startLine",
      c."endLine",
      f."filePath",
      f.language,
      r."fullName",
      1 - (c.embedding <=> $1::vector) AS similarity
    FROM "Chunk" c
    JOIN "RepoFile" f ON c."fileId" = f.id
    JOIN "Repository" r ON f."repositoryId" = r.id
    WHERE r.id = ANY($2::text[])
    ORDER BY c.embedding <=> $1::vector
    LIMIT $3
    `,
    embeddingStr,
    repoIds,
    limit,
  );

  const chunks = rows.map((r) => ({
    chunkId: r.id,
    content: r.content,
    startLine: r.startLine,
    endLine: r.endLine,
    filePath: r.filePath,
    language: r.language,
    repoFullName: r.fullName,
    similarity: r.similarity,
  }));

  return rerankChunks(chunks, limit);
}
