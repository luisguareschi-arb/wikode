import { Worker, type Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { redisConnection, type DeltaJobData } from "@/lib/queue/index";
import { getInstallationOctokit } from "@/lib/github/app";
import { getFileBlob, detectLanguage } from "@/lib/github/files";
import { chunkFile } from "@/lib/embeddings/chunker";
import { embedTexts } from "@/lib/embeddings/openai";

async function processDelta(job: Job<DeltaJobData>): Promise<void> {
  const { repoId, installationId, changedFiles, removedFiles, newSha } =
    job.data;

  const repo = await prisma.repository.findUnique({ where: { id: repoId } });
  if (!repo) throw new Error(`Repository ${repoId} not found`);

  await prisma.repository.update({
    where: { id: repoId },
    data: { status: "INDEXING", errorMessage: null },
  });

  const octokit = await getInstallationOctokit(installationId);

  // Remove deleted files
  for (const filePath of removedFiles) {
    await prisma.repoFile.deleteMany({
      where: { repositoryId: repoId, filePath },
    });
  }

  // Re-index changed/added files
  for (const filePath of changedFiles) {
    try {
      const blob = await getFileBlob(
        octokit,
        repo.owner,
        repo.name,
        filePath,
        newSha,
      );
      const language = detectLanguage(filePath);

      const existing = await prisma.repoFile.findUnique({
        where: { repositoryId_filePath: { repositoryId: repoId, filePath } },
        select: { id: true, sha: true },
      });
      if (existing?.sha === blob.sha) {
        continue;
      }

      // Get new sha from GitHub content
      const repoFile = await prisma.repoFile.upsert({
        where: { repositoryId_filePath: { repositoryId: repoId, filePath } },
        create: { repositoryId: repoId, filePath, language, sha: blob.sha },
        update: { sha: blob.sha, language },
      });

      await prisma.chunk.deleteMany({ where: { fileId: repoFile.id } });

      const chunks = chunkFile(blob.content, filePath, language);
      if (chunks.length === 0) continue;

      const embeddings = await embedTexts(chunks.map((c) => c.content));

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embeddingStr = `[${embeddings[i].join(",")}]`;
        await prisma.$executeRawUnsafe(
          `INSERT INTO "Chunk" (id, "fileId", content, "startLine", "endLine", embedding, "createdAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5::vector, NOW())`,
          repoFile.id,
          chunk.content,
          chunk.startLine,
          chunk.endLine,
          embeddingStr,
        );
      }
    } catch (err) {
      console.error(`[delta] Failed to process ${filePath}:`, err);
    }
  }

  await prisma.repository.update({
    where: { id: repoId },
    data: { lastIndexedSha: newSha, status: "READY" },
  });

  console.log(
    `[delta] Done: ${repo.fullName} — ${changedFiles.length} changed, ${removedFiles.length} removed`,
  );
}

export function createDeltaWorker() {
  const worker = new Worker<DeltaJobData, void, "delta">(
    "delta",
    processDelta,
    {
      connection: redisConnection,
      concurrency: 4,
    },
  );

  worker.on("completed", (job) =>
    console.log(`[delta] Job ${job.id} completed`),
  );
  worker.on("failed", async (job, err) => {
    console.error(`[delta] Job ${job?.id} failed:`, err.message);
    if (job?.data.repoId) {
      await prisma.repository.update({
        where: { id: job.data.repoId },
        data: { status: "ERROR", errorMessage: err.message },
      });
    }
  });

  return worker;
}
