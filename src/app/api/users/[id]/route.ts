import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { username, email, password, role } = await req.json();

    const dataToUpdate: any = {};
    if (username) dataToUpdate.username = username;
    if (email !== undefined) dataToUpdate.email = email || null;
    if (role) dataToUpdate.role = role;
    
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: resolvedParams.id },
      data: dataToUpdate,
      select: { id: true, username: true, email: true, role: true },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Prevent deleting oneself
    if (session.user.id === resolvedParams.id) {
      return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
    }

    const ticketCount = await prisma.ticket.count({
      where: { userId: resolvedParams.id },
    });

    if (ticketCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete this user because they have submitted tickets." },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
