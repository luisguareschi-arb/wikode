import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repos = await prisma.repository.findMany({
    where: { status: "READY" },
    select: {
      id: true,
      fullName: true,
      defaultBranch: true,
    },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json({ repos });
}
