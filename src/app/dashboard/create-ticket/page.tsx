import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import TicketForm from "@/components/TicketForm";
import { ArrowLeft } from "lucide-react";

const prisma = new PrismaClient();

export default async function CreateTicketPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Fetch Master Data
  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });
  
  const cameraTypes = await prisma.cameraType.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="resp-page-padding" style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        <Link href="/dashboard" style={styles.backBtn}>
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>

        <h1 className="resp-page-title" style={{ fontWeight: "700", color: "#1e293b", marginTop: "1rem" }}>
          Create New Ticket
        </h1>
        <TicketForm 
          locations={locations} 
          cameraTypes={cameraTypes} 
          userId={session.user.id} 
        />
      </div>
    </div>
  );
}

const styles = {
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#64748b",
    textDecoration: "none",
    fontWeight: "600",
    marginBottom: "0.5rem",
    transition: "color 0.2s",
  }
};
