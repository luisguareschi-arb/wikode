import { ThreadSidebar } from "@/components/chat/ThreadSidebar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen">
      <ThreadSidebar />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
