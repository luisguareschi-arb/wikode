import { AppSidebar } from "@/components/layout/AppSidebar";

interface AppShellProps {
  isAdmin: boolean;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  children: React.ReactNode;
}

export function AppShell({ isAdmin, user, children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-[hsl(var(--app-surface))]">
      <AppSidebar isAdmin={isAdmin} user={user} />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-[hsl(var(--app-surface))]">
        {children}
      </main>
    </div>
  );
}
