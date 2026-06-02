import { Octokit } from "@octokit/rest";

const INCLUDED_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx",
  ".py", ".go", ".rs", ".java",
  ".rb", ".php", ".cs", ".cpp",
  ".c", ".md",
]);

const EXCLUDED_DIRS = new Set([
  "node_modules", ".git", "dist", "build",
  ".next", "coverage", "__pycache__", "vendor",
  ".cache", "tmp",
]);

const EXCLUDED_PATTERNS = [
  /\.lock$/,
  /\.min\.js$/,
  /\.min\.css$/,
  /\.map$/,
  /\.generated\./,
  /\.pb\.go$/,
  /\.pb\.ts$/,
];

export interface FileEntry {
  path: string;
  sha: string;
}

function shouldInclude(filePath: string): boolean {
  const parts = filePath.split("/");

  for (const part of parts.slice(0, -1)) {
    if (EXCLUDED_DIRS.has(part)) return false;
  }

  const filename = parts[parts.length - 1];
  const dotIdx = filename.lastIndexOf(".");
  if (dotIdx === -1) return false;

  const ext = filename.slice(dotIdx);
  if (!INCLUDED_EXTENSIONS.has(ext)) return false;

  for (const pattern of EXCLUDED_PATTERNS) {
    if (pattern.test(filename)) return false;
  }

  return true;
}

export async function getRepoFileTree(
  octokit: Octokit,
  owner: string,
  repo: string,
  treeSha: string
): Promise<FileEntry[]> {
  const { data } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: treeSha,
    recursive: "1",
  });

  const files: FileEntry[] = [];
  for (const item of data.tree) {
    if (item.type === "blob" && item.path && item.sha) {
      if (shouldInclude(item.path)) {
        files.push({ path: item.path, sha: item.sha });
      }
    }
  }

  return files;
}

export async function getFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePath: string,
  ref: string
): Promise<string> {
  const blob = await getFileBlob(octokit, owner, repo, filePath, ref);
  return blob.content;
}

export async function getFileBlob(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePath: string,
  ref: string
): Promise<{ content: string; sha: string }> {
  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path: filePath,
    ref,
  });

  if ("content" in data && data.encoding === "base64") {
    return {
      content: Buffer.from(data.content, "base64").toString("utf-8"),
      sha: data.sha,
    };
  }

  throw new Error(`Unexpected content format for ${filePath}`);
}

export function detectLanguage(filePath: string): string {
  const ext = filePath.slice(filePath.lastIndexOf("."));
  const map: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "tsx",
    ".js": "javascript",
    ".jsx": "jsx",
    ".py": "python",
    ".go": "go",
    ".rs": "rust",
    ".java": "java",
    ".rb": "ruby",
    ".php": "php",
    ".cs": "csharp",
    ".cpp": "cpp",
    ".c": "c",
    ".md": "markdown",
  };
  return map[ext] ?? "plaintext";
}
