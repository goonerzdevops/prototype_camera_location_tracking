import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { sendAdminNotification } from "@/lib/email";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { locationId, latitude, longitude, status, note, locationPhotos, cameraDevices } = body;

    if (!locationId || !latitude || !longitude) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const savedPhotos = [];

    // Process Location Photos
    if (locationPhotos && Array.isArray(locationPhotos)) {
      for (const photo of locationPhotos) {
        if (!photo.data) continue;
        const base64Data = photo.data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const fileName = `loc_${randomUUID()}.jpg`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, buffer);

        savedPhotos.push({
          type: "LOCATION",
          filePath: `/uploads/${fileName}`,
          note: photo.note || null,
        });
      }
    }

    // Process Camera Device Photos
    if (cameraDevices && Array.isArray(cameraDevices)) {
      for (const device of cameraDevices) {
        if (!device.cameraTypeId || !device.photos || !Array.isArray(device.photos)) continue;

        for (const photo of device.photos) {
          if (!photo.data) continue;
          const base64Data = photo.data.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");
          const fileName = `cam_${randomUUID()}.jpg`;
          const filePath = path.join(uploadsDir, fileName);
          fs.writeFileSync(filePath, buffer);

          savedPhotos.push({
            type: "CAMERA",
            cameraTypeId: device.cameraTypeId,
            filePath: `/uploads/${fileName}`,
            note: photo.note || null,
          });
        }
      }
    }

    if (savedPhotos.length === 0) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }

    // Generate a human-readable ticket number (e.g., TCK-20260623-1234)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const shortId = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TCK-${dateStr}-${shortId}`;

    // Save ticket to Database
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        userId: session.user.id,
        locationId,
        latitude,
        longitude,
        status: status || "PENDING_APPROVAL",
        note: note || null,
        photos: {
          create: savedPhotos,
        },
      },
    });

    // Send email notification to Admin if it's not a draft
    if (ticket.status === "PENDING_APPROVAL") {
      const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

      // Get all Admin emails from the database
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", email: { not: null } },
      });

      // Send to all admins
      for (const admin of admins) {
        if (admin.email) {
          sendAdminNotification(admin.email, ticket.ticketNumber, session.user.name || session.user.email || "User", ticket.id, appUrl).catch(console.error);
        }
      }
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error("Ticket API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
