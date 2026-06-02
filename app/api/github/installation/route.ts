import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

/** Returns the stored GitHub App installation id (from callback cookie) for admin UI. */
export async function GET(req: NextRequest) {
  const session = await auth();
  // @ts-expect-error role is custom
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const installationId = req.cookies.get("gh_installation_id")?.value ?? null;
  return NextResponse.json({ installationId });
}
