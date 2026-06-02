import { Queue } from "bullmq";
import type { ConnectionOptions } from "bullmq";

export interface IngestionJobData {
  repoId: string;
  installationId: number;
  owner: string;
  name: string;
  sha: string;
}

export interface DeltaJobData {
  repoId: string;
  installationId: number;
  changedFiles: string[];
  removedFiles: string[];
  newSha: string;
}

function parseRedisConnection(url: string): ConnectionOptions {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || "localhost",
      port: parseInt(parsed.port || "6379", 10),
      password: parsed.password || undefined,
      db: parseInt(parsed.pathname?.slice(1) || "0", 10) || 0,
      maxRetriesPerRequest: null,
    };
  } catch {
    return { host: "localhost", port: 6379, maxRetriesPerRequest: null };
  }
}

// Plain connection config — no ioredis import, avoids bundled-vs-top-level version mismatch
export const redisConnection = parseRedisConnection(
  process.env.REDIS_URL ?? "redis://localhost:6379"
);

const queueDefaults = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential" as const, delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
};

const _ingestionQueue = new Queue("ingestion", queueDefaults);
const _deltaQueue = new Queue("delta", queueDefaults);

export function enqueueIngestion(data: IngestionJobData) {
  return _ingestionQueue.add("ingest", data);
}

export function enqueueDelta(data: DeltaJobData) {
  return _deltaQueue.add("delta", data);
}
