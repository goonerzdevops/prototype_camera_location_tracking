import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Eye, ArrowLeft } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";

const prisma = new PrismaClient();

export default async function MyTicketsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Fetch tickets for the logged in user
  const tickets = await prisma.ticket.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link href="/dashboard" style={styles.backBtn}>
              <ArrowLeft size={20} />
            </Link>
            <h1 className="resp-page-title" style={styles.title}>My Tickets</h1>
          </div>
          <div style={styles.userSection}>
            <span style={styles.username}>{session.user.name}</span>
            <SignOutButton style={styles.logoutBtn}>Sign Out</SignOutButton>
          </div>
        </div>
      </header>

      <main className="resp-page-padding" style={styles.main}>
        {tickets.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📸</div>
            <h3 style={styles.emptyTitle}>No tickets found</h3>
            <p style={styles.emptyText}>You haven't submitted any GPS or Camera reports yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {tickets.map((ticket) => (
              <div key={ticket.id} style={styles.card}>
                <div style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={styles.ticketNumber}>{ticket.ticketNumber}</span>
                    <span
                      style={{
                        ...styles.badge,
                        ...(ticket.status === "APPROVED"
                          ? styles.badgeSuccess
                          : ticket.status === "REJECTED"
                          ? styles.badgeError
                          : styles.badgeWarning),
                      }}
                    >
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                  <Link href={`/dashboard/ticket/${ticket.id}`} style={{ color: "#64748b", transition: "color 0.2s" }} title="View Details">
                    <Eye size={22} />
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
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily: "var(--font-geist-sans), sans-serif",
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    padding: "1rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  headerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: {
    color: "#64748b",
    display: "flex",
    alignItems: "center",
  },
  title: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  username: {
    color: "#64748b",
    fontSize: "0.8rem",
    fontWeight: "500",
  },
  logoutBtn: {
    color: "#ef4444",
    textDecoration: "none",
    fontSize: "0.9rem",
    fontWeight: "600",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    backgroundColor: "#fef2f2",
    transition: "background 0.2s",
  },
  main: {
    maxWidth: "1200px",
    margin: "0 auto",
    paddingTop: "2rem",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem 2rem",
    backgroundColor: "white",
    borderRadius: "12px",
    border: "1px dashed #cbd5e1",
    textAlign: "center" as const,
  },
  emptyIcon: {
    fontSize: "3rem",
    marginBottom: "1rem",
  },
  emptyTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#334155",
    margin: "0 0 0.5rem 0",
  },
  emptyText: {
    color: "#94a3b8",
    margin: 0,
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  ticketNumber: {
    fontWeight: "700",
    color: "#1e293b",
    fontSize: "0.95rem",
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
  badgeSuccess: {
    backgroundColor: "#dcfce3",
    color: "#166534",
  },
  badgeError: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
  },
};
