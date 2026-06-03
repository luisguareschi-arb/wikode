import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { listAppInstallations } from "@/lib/github/app";

const COOKIE_NAME = "gh_installation_id";

/** Returns stored installation id and API-discovered suggestion for admin UI. */
export async function GET(req: NextRequest) {
  const session = await auth();
  // @ts-expect-error role is custom
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const installationId = req.cookies.get(COOKIE_NAME)?.value ?? null;

  try {
    const installations = await listAppInstallations();
    const ids = new Set(installations.map((i) => String(i.id)));
    const suggestedInstallationId =
      installationId && ids.has(installationId)
        ? installationId
        : installations.length === 1
          ? String(installations[0].id)
          : null;

    return NextResponse.json({
      installationId,
      suggestedInstallationId,
      installations,
    });
  } catch {
    return NextResponse.json({ installationId });
  }
}
