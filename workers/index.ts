import { config } from "dotenv";
config();
import { createIngestionWorker } from "./ingestion.worker.js";
import { createDeltaWorker } from "./delta.worker.js";

console.log("[workers] Starting Wikode workers...");

const ingestionWorker = createIngestionWorker();
const deltaWorker = createDeltaWorker();

console.log("[workers] Ingestion worker running");
console.log("[workers] Delta worker running");

async function shutdown() {
  console.log("[workers] Shutting down...");
  await Promise.all([ingestionWorker.close(), deltaWorker.close()]);
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
