import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TicketForm, { TicketInitialData } from "@/components/TicketForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const prisma = new PrismaClient();

export default async function EditTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: resolvedParams.id },
    include: {
      photos: true,
    },
  });

  if (!ticket) {
    redirect("/dashboard");
  }

  if (ticket.userId !== session.user.id || !["DRAFT", "REJECTED"].includes(ticket.status)) {
    redirect(`/dashboard/ticket/${ticket.id}`);
  }

  const [locations, cameraTypes] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: "asc" } }),
    prisma.cameraType.findMany({ orderBy: { name: "asc" } })
  ]);

  const initialData: TicketInitialData = {
    id: ticket.id,
    locationId: ticket.locationId,
    latitude: ticket.latitude,
    longitude: ticket.longitude,
    note: ticket.note || "",
    photos: ticket.photos.map((p) => ({
      id: p.id,
      type: p.type,
      cameraTypeId: p.cameraTypeId,
      filePath: p.filePath,
      note: p.note,
    })),
  };

  return (
    <div className="resp-page-padding" style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <Link href={`/dashboard/ticket/${ticket.id}`} style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#64748b",
            textDecoration: "none",
            fontWeight: "600",
            transition: "color 0.2s",
          }}>
            <ArrowLeft size={20} /> Back to Ticket Details
          </Link>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
            {ticket.status === "REJECTED" ? "✏️ Revise Rejected Ticket" : "Edit Draft Ticket"}
          </h1>
        </div>

        <TicketForm 
          locations={locations} 
          cameraTypes={cameraTypes} 
          userId={session.user.id} 
          initialData={initialData}
        />
      </div>
    </div>
  );
}
