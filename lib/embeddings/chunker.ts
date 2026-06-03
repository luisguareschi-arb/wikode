export interface Chunk {
  content: string;
  startLine: number;
  endLine: number;
  filePath: string;
  language: string;
}

const CHUNK_SIZE_TOKENS = 400;
const CHUNK_OVERLAP_TOKENS = 80;
// rough approximation: 1 token ≈ 4 chars
const CHARS_PER_TOKEN = 4;

const CHUNK_SIZE_CHARS = CHUNK_SIZE_TOKENS * CHARS_PER_TOKEN;
const OVERLAP_CHARS = CHUNK_OVERLAP_TOKENS * CHARS_PER_TOKEN;

export function chunkFile(
  content: string,
  filePath: string,
  language: string,
): Chunk[] {
  const lines = content.split("\n");

  if (language === "markdown") {
    return chunkMarkdown(lines, filePath, language);
  }

  return chunkCode(lines, filePath, language);
}

function chunkMarkdown(
  lines: string[],
  filePath: string,
  language: string,
): Chunk[] {
  const chunks: Chunk[] = [];
  let currentLines: string[] = [];
  let startLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeading = /^#{1,6}\s/.test(line);

    if (isHeading && currentLines.length > 0) {
      const content = currentLines.join("\n").trim();
      if (content) {
        chunks.push({
          content,
          startLine,
          endLine: startLine + currentLines.length - 1,
          filePath,
          language,
        });
      }
      startLine = i + 1;
      currentLines = [line];
    } else {
      currentLines.push(line);
    }

    // Force split if the chunk gets too large
    const currentText = currentLines.join("\n");
    if (currentText.length > CHUNK_SIZE_CHARS && currentLines.length > 1) {
      const content = currentLines.slice(0, -1).join("\n").trim();
      if (content) {
        chunks.push({ content, startLine, endLine: i, filePath, language });
      }
      const overlap = currentLines.slice(-Math.ceil(OVERLAP_CHARS / 80));
      startLine = i + 1 - overlap.length;
      currentLines = [...overlap, line];
    }
  }

  if (currentLines.length > 0) {
    const content = currentLines.join("\n").trim();
    if (content) {
      chunks.push({
        content,
        startLine,
        endLine: lines.length,
        filePath,
        language,
      });
    }
  }

  return chunks;
}

function chunkCode(
  lines: string[],
  filePath: string,
  language: string,
): Chunk[] {
  const chunks: Chunk[] = [];
  let startLine = 1;
  let currentChars = 0;
  let chunkStartIdx = 0;

  for (let i = 0; i < lines.length; i++) {
    currentChars += lines[i].length + 1;

    if (currentChars >= CHUNK_SIZE_CHARS) {
      const content = lines
        .slice(chunkStartIdx, i + 1)
        .join("\n")
        .trim();
      if (content) {
        chunks.push({ content, startLine, endLine: i + 1, filePath, language });
      }

      // Overlap: step back by OVERLAP_CHARS worth of lines
      let overlapChars = 0;
      let overlapStart = i;
      while (overlapStart > chunkStartIdx && overlapChars < OVERLAP_CHARS) {
        overlapChars += lines[overlapStart].length + 1;
        overlapStart--;
      }

      chunkStartIdx = overlapStart + 1;
      startLine = chunkStartIdx + 1;
      currentChars = lines
        .slice(chunkStartIdx, i + 1)
        .reduce((acc, l) => acc + l.length + 1, 0);
    }
  }

  // Final chunk
  if (chunkStartIdx < lines.length) {
    const content = lines.slice(chunkStartIdx).join("\n").trim();
    if (content) {
      chunks.push({
        content,
        startLine,
        endLine: lines.length,
        filePath,
        language,
      });
    }
  }

  return chunks;
}
