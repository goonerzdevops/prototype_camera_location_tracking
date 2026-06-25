import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status, reason } = body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (session.user.role === "USER") {
      // User can only submit draft tickets
      if (ticket.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (status !== "PENDING_APPROVAL" || ticket.status !== "DRAFT") {
        return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
      }

      const updatedTicket = await prisma.ticket.update({
        where: { id: resolvedParams.id },
        data: { status: "PENDING_APPROVAL" },
      });
      return NextResponse.json({ success: true, ticket: updatedTicket });
    }

    if (session.user.role === "ADMIN") {
      if (!["APPROVED", "REJECTED"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      if (!reason || reason.trim() === "") {
        return NextResponse.json({ error: "Reason is required when approving or rejecting a ticket." }, { status: 400 });
      }

      const updatedTicket = await prisma.ticket.update({
        where: { id: resolvedParams.id },
        data: { 
          status,
          approverUsername: session.user.name || session.user.email,
          reason,
        },
      });

      return NextResponse.json({ success: true, ticket: updatedTicket });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  } catch (error: any) {
    console.error("Update Ticket Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: resolvedParams.id },
      include: { photos: true }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only allow deletion if user is the owner, or if they are admin
    if (session.user.role === "USER" && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete physical photos from disk
    const uploadsDir = path.join(process.cwd(), "public");
    for (const photo of ticket.photos) {
      if (photo.filePath) {
        const fullPath = path.join(uploadsDir, photo.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    }

    // Delete TicketPhoto records first (since we don't have Cascade set up in schema yet)
    await prisma.ticketPhoto.deleteMany({
      where: { ticketId: ticket.id }
    });

    // Delete Ticket record
    await prisma.ticket.delete({
      where: { id: ticket.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Ticket Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { randomUUID } from "crypto";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { locationId, latitude, longitude, status, note, locationPhotos, cameraDevices } = body;

    if (!locationId || !latitude || !longitude) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: resolvedParams.id },
      include: { photos: true }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    if (ticket.status !== "DRAFT") {
      return NextResponse.json({ error: "Only DRAFT tickets can be edited" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Collect all incoming photos from payload
    const incomingPhotos = [
      ...(locationPhotos || []).map((p: any) => ({ ...p, type: "LOCATION", cameraTypeId: null })),
      ...(cameraDevices || []).flatMap((d: any) => 
        (d.photos || []).map((p: any) => ({ ...p, type: "CAMERA", cameraTypeId: d.cameraTypeId }))
      )
    ];

    const incomingIds = incomingPhotos.map(p => p.id);
    const existingPhotosMap = new Map(ticket.photos.map(p => [p.id, p]));

    // 1. Delete photos that are no longer in the payload
    for (const existingPhoto of ticket.photos) {
      if (!incomingIds.includes(existingPhoto.id)) {
        // Photo was deleted by user
        if (existingPhoto.filePath) {
          const fullPath = path.join(process.cwd(), "public", existingPhoto.filePath);
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }
        await prisma.ticketPhoto.delete({ where: { id: existingPhoto.id } });
      }
    }

    // 2. Process incoming photos (Update existing, Create new)
    for (const p of incomingPhotos) {
      if (existingPhotosMap.has(p.id)) {
        // Existing photo, update note (and type/cameraTypeId just in case)
        await prisma.ticketPhoto.update({
          where: { id: p.id },
          data: {
            note: p.note || null,
            type: p.type,
            cameraTypeId: p.cameraTypeId,
          }
        });
      } else {
        // New photo, decode base64 and save to disk
        if (p.data && p.data.startsWith("data:image/")) {
          const base64Data = p.data.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");
          const fileName = `${p.type === "LOCATION" ? "loc" : "cam"}_${randomUUID()}.jpg`;
          const filePath = path.join(uploadsDir, fileName);
          fs.writeFileSync(filePath, buffer);

          await prisma.ticketPhoto.create({
            data: {
              ticketId: ticket.id,
              type: p.type,
              cameraTypeId: p.cameraTypeId,
              filePath: `/uploads/${fileName}`,
              note: p.note || null,
            }
          });
        }
      }
    }

    // 3. Update Ticket Info
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        locationId,
        latitude,
        longitude,
        note: note || null,
        status: status || "DRAFT",
      }
    });

    return NextResponse.json({ success: true, ticket: updatedTicket });

  } catch (error: any) {
    console.error("Update Draft Ticket Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
