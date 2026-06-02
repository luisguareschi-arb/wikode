import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threads = await prisma.thread.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { repos: { include: { repository: true } } },
  });

  return NextResponse.json({ threads });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, repoIds } = await req.json();

  const thread = await prisma.thread.create({
    data: {
      userId: session.user.id,
      title,
      repos: repoIds?.length
        ? { create: repoIds.map((id: string) => ({ repositoryId: id })) }
        : undefined,
    },
    include: { repos: { include: { repository: true } } },
  });

  return NextResponse.json({ thread }, { status: 201 });
}
