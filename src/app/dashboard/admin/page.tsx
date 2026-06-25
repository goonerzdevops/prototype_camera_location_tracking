import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";

const prisma = new PrismaClient();

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch all ticket count for the statistics
  const totalTicketsCount = await prisma.ticket.count();

  // Fetch only pending tickets for the cards view
  const pendingTickets = await prisma.ticket.findMany({
    where: { status: "PENDING_APPROVAL" },
    include: { location: true, user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={styles.container}>
      <main className="resp-page-padding" style={styles.main}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <a href="/api/export" style={styles.exportBtn} download>
            <Download size={18} /> Export Data
          </a>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <h3 style={styles.statNumber}>{pendingTickets.length}</h3>
            <p style={styles.statLabel}>Pending</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statNumber}>{totalTicketsCount}</h3>
            <p style={styles.statLabel}>Total Tickets</p>
          </div>
        </div>

        {pendingTickets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", backgroundColor: "white", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
            <h3 style={{ fontSize: "1.25rem", color: "#334155", marginBottom: "0.5rem" }}>No Pending ticket</h3>
            <p style={{ color: "#64748b" }}>There are currently no tickets waiting for approval.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {pendingTickets.map((ticket) => (
              <div key={ticket.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.ticketNumber}>{ticket.ticketNumber}</span>
                  <span style={{ ...styles.badge, ...styles.badgeWarning }}>
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>
                
                <div style={styles.cardBody}>
                  <div style={styles.infoRow}>
                    <span style={{ fontWeight: 600 }}>User:</span>
                    <span style={{ color: "#64748b" }}>{ticket.user.username}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={{ fontWeight: 600 }}>Location:</span>
                    <span style={{ color: "#64748b" }}>{ticket.location.name}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={{ fontWeight: 600 }}>Date:</span>
                    <span style={{ color: "#64748b" }}>
                      {new Date(ticket.createdAt).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                </div>

                <div style={styles.cardFooter}>
                  <Link href={`/dashboard/ticket/${ticket.id}`} style={styles.viewDetailsBtn}>
                    View Details & Process
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "var(--font-geist-sans), sans-serif",
  },
  exportBtn: {
    color: "#047857",
    textDecoration: "none",
    fontSize: "0.9rem",
    fontWeight: "600",
    padding: "0.6rem 1rem",
    borderRadius: "6px",
    backgroundColor: "#d1fae5",
    transition: "background 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  main: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  statsRow: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
  },
  statCard: {
    backgroundColor: "white",
    padding: "1rem",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    flex: "1",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
  },
  statNumber: {
    fontSize: "2rem",
    fontWeight: "800",
    color: "#1e293b",
    margin: "0 0 0.5rem 0",
  },
  statLabel: {
    color: "#64748b",
    margin: 0,
    fontWeight: "500",
    fontSize: "0.85rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
    display: "flex",
    flexDirection: "column" as const,
  },
  cardHeader: {
    padding: "1.25rem",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fafaf9",
  },
  ticketNumber: {
    fontWeight: "700",
    color: "#1e293b",
    fontSize: "0.95rem",
  },
  cardBody: {
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
    flexGrow: 1,
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.9rem",
    color: "#334155",
  },
  cardFooter: {
    padding: "1rem 1.25rem",
    borderTop: "1px solid #f1f5f9",
    backgroundColor: "#fafaf9",
  },
  badge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: "700",
    letterSpacing: "0.025em",
  },
  badgeWarning: {
    backgroundColor: "#fef3c7",
    color: "#b45309",
  },
  viewDetailsBtn: {
    display: "block",
    textAlign: "center" as const,
    width: "100%",
    padding: "0.6rem",
    backgroundColor: "transparent",
    color: "#3b82f6",
    fontWeight: "600",
    textDecoration: "none",
    borderRadius: "6px",
    border: "1px solid #bfdbfe",
    transition: "all 0.2s",
  }
};
