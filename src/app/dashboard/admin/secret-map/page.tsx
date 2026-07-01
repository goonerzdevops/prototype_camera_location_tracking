import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TicketMap from "@/components/TicketMap";

const prisma = new PrismaClient();

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  PENDING_APPROVAL: { label: "Pending",  bg: "#fef3c7", color: "#b45309" },
  APPROVED:         { label: "Approved", bg: "#dcfce7", color: "#166534" },
  REJECTED:         { label: "Rejected", bg: "#fee2e2", color: "#b91c1c" },
  DRAFT:            { label: "Draft",    bg: "#f1f5f9", color: "#64748b" },
};

export default async function SecretMapPage() {
  const session = await getServerSession(authOptions);

  // Double-check: hanya ADMIN (layout sudah proteksi, ini extra guard)
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const tickets = await prisma.ticket.findMany({
    include: {
      location: true,
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const ticketPins = tickets.map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    latitude: t.latitude,
    longitude: t.longitude,
    status: t.status,
    locationName: t.location.name,
    submittedBy: t.user.username,
    createdAt: t.createdAt.toISOString(),
  }));

  // Count per status untuk stats bar
  const counts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ padding: "1.5rem", fontFamily: "var(--font-geist-sans), sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🗺️</span>
          <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "800", color: "#0f172a" }}>
            Ticket Location Map
          </h1>
          <span style={{
            fontSize: "0.7rem", fontWeight: "700", color: "#64748b",
            backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: "9999px",
            border: "1px solid #e2e8f0", letterSpacing: "0.1em",
          }}>
            INTERNAL
          </span>
        </div>
        <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem" }}>
          Visualisasi koordinat GPS semua tiket yang telah dibuat — {tickets.length} titik total
        </p>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: "flex", gap: "0.75rem", flexWrap: "wrap",
        marginBottom: "1.25rem",
      }}>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <div key={status} style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            backgroundColor: cfg.bg, color: cfg.color,
            padding: "0.4rem 0.875rem", borderRadius: "9999px",
            fontSize: "0.8rem", fontWeight: "700",
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: "50%",
              backgroundColor: cfg.color, display: "inline-block", flexShrink: 0,
            }} />
            {cfg.label}: {counts[status] || 0}
          </div>
        ))}
      </div>

      {/* Map */}
      {tickets.length === 0 ? (
        <div style={{
          height: "500px", borderRadius: "12px", border: "2px dashed #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: "0.75rem", color: "#94a3b8",
          backgroundColor: "#f8fafc",
        }}>
          <span style={{ fontSize: "3rem" }}>📍</span>
          <p style={{ margin: 0, fontWeight: "600" }}>Belum ada ticket dengan data GPS</p>
        </div>
      ) : (
        <div style={{
          borderRadius: "12px", overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "1px solid #e2e8f0",
          height: "calc(100vh - 260px)",
          minHeight: "500px",
        }}>
          <TicketMap tickets={ticketPins} />
        </div>
      )}

      {/* Legend */}
      <div style={{
        marginTop: "1rem", padding: "0.75rem 1rem",
        backgroundColor: "#f8fafc", borderRadius: "8px",
        border: "1px solid #e2e8f0",
        fontSize: "0.8rem", color: "#64748b",
        display: "flex", alignItems: "center", gap: "0.5rem",
      }}>
        <span>💡</span>
        <span>Klik marker pada peta untuk melihat detail tiket. Halaman ini hanya bisa diakses via URL langsung.</span>
      </div>
    </div>
  );
}
