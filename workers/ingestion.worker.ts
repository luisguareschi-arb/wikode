import { Worker, type Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { redisConnection, type IngestionJobData } from "@/lib/queue/index";
import { getInstallationOctokit } from "@/lib/github/app";
import { getRepoFileTree, getFileContent, detectLanguage } from "@/lib/github/files";
import { chunkFile } from "@/lib/embeddings/chunker";
import { embedTexts } from "@/lib/embeddings/openai";

async function processIngestion(job: Job<IngestionJobData>): Promise<void> {
  const { repoId, installationId, owner, name, sha } = job.data;

  console.log(`[ingestion] Starting ingestion for ${owner}/${name} @ ${sha}`);

  await prisma.repository.update({
    where: { id: repoId },
    data: { status: "INDEXING", errorMessage: null },
  });

  const octokit = await getInstallationOctokit(installationId);

  // Get full file tree
  const files = await getRepoFileTree(octokit, owner, name, sha);
  console.log(`[ingestion] Found ${files.length} files to index`);

  let processed = 0;
  for (const file of files) {
    try {
      const content = await getFileContent(octokit, owner, name, file.path, sha);
      const language = detectLanguage(file.path);

      // Upsert the RepoFile record
      const repoFile = await prisma.repoFile.upsert({
        where: { repositoryId_filePath: { repositoryId: repoId, filePath: file.path } },
        create: { repositoryId: repoId, filePath: file.path, language, sha: file.sha },
        update: { sha: file.sha, language },
      });

      // Delete old chunks before re-embedding
      await prisma.chunk.deleteMany({ where: { fileId: repoFile.id } });

      const chunks = chunkFile(content, file.path, language);
      if (chunks.length === 0) continue;

      const embeddings = await embedTexts(chunks.map((c) => c.content));

      // Insert chunks with raw SQL (pgvector doesn't support Prisma create for Unsupported type)
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];
        const embeddingStr = `[${embedding.join(",")}]`;

        await prisma.$executeRawUnsafe(
          `INSERT INTO "Chunk" (id, "fileId", content, "startLine", "endLine", embedding, "createdAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5::vector, NOW())`,
          repoFile.id,
          chunk.content,
          chunk.startLine,
          chunk.endLine,
          embeddingStr
        );
      }

      processed++;
      await job.updateProgress(Math.round((processed / files.length) * 100));
    } catch (err) {
      console.error(`[ingestion] Failed to process file ${file.path}:`, err);
      // Continue with remaining files
    }
  }

  await prisma.repository.update({
    where: { id: repoId },
    data: { status: "READY", lastIndexedSha: sha },
  });

  console.log(`[ingestion] Done: ${owner}/${name} — indexed ${processed}/${files.length} files`);
}

export function createIngestionWorker() {
  const worker = new Worker<IngestionJobData, void, "ingest">(
    "ingestion",
    processIngestion,
    {
      connection: redisConnection,
      concurrency: 2,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[ingestion] Job ${job.id} completed`);
  });

  worker.on("failed", async (job, err) => {
    console.error(`[ingestion] Job ${job?.id} failed:`, err.message);
    if (job?.data.repoId) {
      await prisma.repository.update({
        where: { id: job.data.repoId },
        data: { status: "ERROR", errorMessage: err.message },
      });
    }
  });

  return worker;
}
