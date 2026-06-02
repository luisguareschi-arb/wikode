import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getInstallationOctokit } from "@/lib/github/app";

// Store the latest installation ID in the database (or env for MVP)
// For now we persist it to a simple KV in a future migration; for Phase 1,
// we store it in a dedicated table-less approach via a well-known config record.
// We'll store it on the first Repository or as an env-like record.

export async function GET(req: NextRequest) {
  const session = await auth();
  // @ts-expect-error role is custom
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const installationId = req.nextUrl.searchParams.get("installation_id");
  const setupAction = req.nextUrl.searchParams.get("setup_action");

  if (!installationId) {
    return NextResponse.redirect(new URL("/admin?error=no_installation_id", req.url));
  }

  // Verify the installation is accessible
  try {
    await getInstallationOctokit(parseInt(installationId, 10));
  } catch {
    return NextResponse.redirect(new URL("/admin?error=invalid_installation", req.url));
  }

  // Store the installation ID in a cookie for use in the admin UI
  const response = NextResponse.redirect(new URL(`/admin/repos?installation_id=${installationId}&setup_action=${setupAction ?? "install"}`, req.url));
  response.cookies.set("gh_installation_id", installationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  });

  return response;
}
