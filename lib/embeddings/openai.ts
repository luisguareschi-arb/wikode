import OpenAI from "openai";

const BATCH_SIZE = 100;
const MODEL = "text-embedding-3-large";
// 1536 dims stays under pgvector's HNSW 2000-dimension limit; text-embedding-3-large supports reduction
const DIMENSIONS = 1536;

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const openai = getClient();
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await openai.embeddings.create({
      model: MODEL,
      input: batch,
      dimensions: DIMENSIONS,
    });

    // Results are returned in the same order as inputs
    const batchEmbeddings = response.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);

    embeddings.push(...batchEmbeddings);
  }

  return embeddings;
}

export async function embedText(text: string): Promise<number[]> {
  const results = await embedTexts([text]);
  return results[0];
}
