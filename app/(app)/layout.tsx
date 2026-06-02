import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";
import { MessageSquare, Settings, LogOut, Code2 } from "lucide-react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  // @ts-expect-error role is custom
  const isAdmin = session.user?.role === "ADMIN";

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r bg-white flex flex-col">
        <div className="flex items-center gap-2 px-4 py-4 border-b">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600">
            <Code2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900">Wikode</span>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1">
          <Link
            href="/chat"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <Settings className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="border-t p-3">
          <div className="flex items-center gap-2 mb-2 px-1">
            {session.user?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name ?? "User"}
                className="h-7 w-7 rounded-full"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-gray-900">{session.user?.name}</p>
              <p className="truncate text-xs text-gray-500">{session.user?.email}</p>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2 text-gray-600">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
