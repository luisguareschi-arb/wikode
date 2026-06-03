import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  // @ts-expect-error role is custom
  const isAdmin = session.user?.role === "ADMIN";

  return (
    <AppShell
      isAdmin={isAdmin}
      user={{
        name: session.user?.name,
        email: session.user?.email,
        image: session.user?.image,
      }}
    >
      {children}
    </AppShell>
  );
}
