const windowBuckets = new Map<string, number[]>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const current = windowBuckets.get(key) ?? [];
  const recent = current.filter((timestamp) => timestamp > windowStart);

  if (recent.length >= limit) {
    windowBuckets.set(key, recent);
    return false;
  }

  recent.push(now);
  windowBuckets.set(key, recent);
  return true;
}
