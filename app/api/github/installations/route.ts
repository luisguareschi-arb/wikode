import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getInstallationOctokit, listAppInstallations } from "@/lib/github/app";

const COOKIE_NAME = "gh_installation_id";

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/",
  } as const;
}

function resolveSuggested(
  installations: { id: number }[],
  storedId: string | null,
): string | null {
  const ids = new Set(installations.map((i) => String(i.id)));
  if (storedId && ids.has(storedId)) return storedId;
  if (installations.length === 1) return String(installations[0].id);
  return null;
}

/** Lists GitHub App installations and the stored / suggested installation id. */
export async function GET(req: NextRequest) {
  const session = await auth();
  // @ts-expect-error role is custom
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const installations = await listAppInstallations();
    const storedInstallationId = req.cookies.get(COOKIE_NAME)?.value ?? null;
    const suggestedInstallationId = resolveSuggested(
      installations,
      storedInstallationId,
    );

    return NextResponse.json({
      installations,
      storedInstallationId,
      suggestedInstallationId,
    });
  } catch (err) {
    console.error("Failed to list GitHub App installations", err);
    return NextResponse.json(
      { error: "Failed to list installations" },
      { status: 502 },
    );
  }
}

/** Verifies an installation id and persists it in the admin cookie. */
export async function POST(req: NextRequest) {
  const session = await auth();
  // @ts-expect-error role is custom
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const rawId = body?.installationId;
  const installationId =
    typeof rawId === "number"
      ? rawId
      : typeof rawId === "string"
        ? parseInt(rawId, 10)
        : NaN;

  if (!Number.isFinite(installationId)) {
    return NextResponse.json(
      { error: "installationId is required" },
      { status: 400 },
    );
  }

  try {
    await getInstallationOctokit(installationId);
  } catch {
    return NextResponse.json(
      { error: "Invalid or inaccessible installation" },
      { status: 400 },
    );
  }

  const response = NextResponse.json({
    installationId: String(installationId),
  });
  response.cookies.set(COOKIE_NAME, String(installationId), cookieOptions());
  return response;
}
