export interface ThreadListItem {
  id: string;
  title: string | null;
  updatedAt: string;
}

export interface ThreadGroup {
  label: string;
  threads: ThreadListItem[];
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function groupThreadsByDate(threads: ThreadListItem[]): ThreadGroup[] {
  const today = startOfDay(new Date());
  const yesterday = today - 86_400_000;

  const buckets = new Map<string, ThreadListItem[]>();

  for (const thread of threads) {
    const day = startOfDay(new Date(thread.updatedAt));
    let label: string;
    if (day === today) label = "Today";
    else if (day === yesterday) label = "Yesterday";
    else if (today - day <= 7 * 86_400_000) label = "Previous 7 days";
    else label = "Older";

    const list = buckets.get(label) ?? [];
    list.push(thread);
    buckets.set(label, list);
  }

  const order = ["Today", "Yesterday", "Previous 7 days", "Older"];
  return order
    .filter((label) => buckets.has(label))
    .map((label) => ({ label, threads: buckets.get(label)! }));
}
