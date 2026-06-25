import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ExcelJS from "exceljs";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const tickets = await prisma.ticket.findMany({
      include: {
        user: true,
        location: true,
        photos: { include: { cameraType: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Ticket History");

    // Define columns
    worksheet.columns = [
      { header: "Ticket Number", key: "ticketNumber", width: 25 },
      { header: "Status", key: "status", width: 20 },
      { header: "User (Reporter)", key: "username", width: 25 },
      { header: "Approved/Rejected By", key: "approver", width: 25 },
      { header: "Location", key: "location", width: 30 },
      { header: "Note", key: "note", width: 40 },
      { header: "Latitude", key: "latitude", width: 15 },
      { header: "Longitude", key: "longitude", width: 15 },
      { header: "Submitted Date", key: "date", width: 25 },
      { header: "Evidence Links", key: "evidence", width: 80 },
    ];

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2E8F0" },
    };

    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    tickets.forEach((ticket: any) => {
      const photoLinks = ticket.photos
        .map((p: any, index: number) => {
          const typeName = p.type === "CAMERA" ? (p.cameraType?.name || "Unknown Camera") : "Location Photo";
          return `Photo ${index + 1} (${typeName}): ${appUrl}${p.filePath}`;
        })
        .join("\n");

      const row = worksheet.addRow({
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        username: ticket.user.username,
        approver: ticket.approverUsername || "-",
        location: ticket.location.name,
        note: ticket.note || "-",
        latitude: ticket.latitude,
        longitude: ticket.longitude,
        date: new Date(ticket.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "medium" }),
        evidence: photoLinks,
      });

      // Enable Text Wrapping for the Evidence column
      row.getCell("evidence").alignment = { wrapText: true, vertical: "top" };
      // Make the row taller if there are multiple photos so the wrapping is visible
      row.height = ticket.photos.length > 1 ? ticket.photos.length * 15 + 10 : 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename="GPS_Tickets_Report_${new Date().toISOString().slice(0, 10)}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
