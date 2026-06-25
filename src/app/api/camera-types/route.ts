import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cameraTypes = await prisma.cameraType.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(cameraTypes);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch camera types" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const cameraType = await prisma.cameraType.create({
      data: { name },
    });

    return NextResponse.json(cameraType, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create camera type" }, { status: 500 });
  }
}
