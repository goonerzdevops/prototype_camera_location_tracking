import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const cameraType = await prisma.cameraType.update({
      where: { id: resolvedParams.id },
      data: { name },
    });

    return NextResponse.json(cameraType);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update camera type" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if the camera type is being used by any tickets
    const photoCount = await prisma.ticketPhoto.count({
      where: { cameraTypeId: resolvedParams.id },
    });

    if (photoCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete this camera type because it is used in existing ticket photos." },
        { status: 400 }
      );
    }

    await prisma.cameraType.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete camera type" }, { status: 500 });
  }
}
