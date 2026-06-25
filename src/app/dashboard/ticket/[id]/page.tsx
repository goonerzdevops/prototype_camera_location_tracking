import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Clock } from "lucide-react";
import AdminActions from "@/components/AdminActions";
import DraftActions from "@/components/DraftActions";
import PhotoGallery from "@/components/PhotoGallery";
import CancelTicketButton from "@/components/CancelTicketButton";

const prisma = new PrismaClient();

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Fetch ticket with relations
  const ticket = await prisma.ticket.findUnique({
    where: { id: resolvedParams.id },
    include: {
      location: true,
      photos: {
        include: { cameraType: true }
      },
      user: true,
    },
  });

  if (!ticket) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1>Ticket Not Found</h1>
          <Link href="/dashboard">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Ensure normal users can only view their own tickets
  if (session.user.role === "USER" && ticket.userId !== session.user.id) {
    redirect("/dashboard");
  }

  return (
    <div className="resp-page-padding" style={styles.container}>
      <div style={styles.maxWidth}>

        <Link href="/dashboard" style={styles.backBtn}>
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h1 style={styles.title}>{ticket.ticketNumber}</h1>
              <p style={styles.subtitle}>Submitted by {ticket.user.email}</p>
            </div>
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

          <div style={styles.cardBody}>
            <h3 style={styles.sectionTitle}>Ticket Details</h3>

            <div style={styles.detailGrid}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}><MapPin size={16} /> Location Area</span>
                <span style={styles.detailValue}>{ticket.location.name}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}><Clock size={16} /> GPS Coordinates</span>
                <span style={styles.detailValue}>Lat: {ticket.latitude.toFixed(6)} | Lng: {ticket.longitude.toFixed(6)}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}><Calendar size={16} /> Submitted Date</span>
                <span style={styles.detailValue}>
                  {new Date(ticket.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium", timeStyle: "short"
                  })}
                </span>
              </div>
            </div>

            {ticket.note && (
              <div style={{ marginTop: "1.5rem" }}>
                <span style={styles.detailLabel}>Additional Note</span>
                <p style={{ marginTop: "0.5rem", color: "#334155", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                  {ticket.note}
                </p>
              </div>
            )}

            {ticket.reason && (
              <div style={{ marginTop: "1.5rem", backgroundColor: "#fffbeb", padding: "1rem", borderRadius: "8px", border: "1px dashed #f59e0b" }}>
                <span style={{ ...styles.detailLabel, color: "#b45309" }}>Approval/Rejection Reason</span>
                <p style={{ marginTop: "0.5rem", color: "#92400e", lineHeight: "1.6", whiteSpace: "pre-wrap", fontWeight: 500 }}>
                  {ticket.reason}
                </p>
              </div>
            )}

            <h3 style={styles.sectionTitle}>Evidence Photos</h3>
            <PhotoGallery photos={ticket.photos} />

            {session.user.role === "ADMIN" && ticket.status === "PENDING_APPROVAL" && (
              <AdminActions ticketId={ticket.id} />
            )}

            {session.user.role === "USER" && ticket.status === "DRAFT" && (
              <DraftActions ticketId={ticket.id} />
            )}

            {session.user.role === "USER" && ticket.status === "PENDING_APPROVAL" && (
              <CancelTicketButton ticketId={ticket.id} />
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily: "var(--font-geist-sans), sans-serif",
  },
  maxWidth: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#64748b",
    textDecoration: "none",
    fontWeight: "600",
    marginBottom: "1.5rem",
    transition: "color 0.2s",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
  },
  cardHeader: {
    padding: "1.5rem",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#fafaf9",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 0.25rem 0",
  },
  subtitle: {
    color: "#64748b",
    fontSize: "0.95rem",
    margin: 0,
  },
  badge: {
    padding: "0.35rem 0.85rem",
    borderRadius: "9999px",
    fontSize: "0.85rem",
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
  cardBody: {
    padding: "1.5rem",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#334155",
    marginBottom: "1rem",
    borderBottom: "2px solid #f1f5f9",
    paddingBottom: "0.5rem",
    marginTop: "2rem",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
  },
  detailLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  detailValue: {
    fontSize: "1rem",
    fontWeight: "500",
    color: "#1e293b",
  },
  photoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "1.5rem",
  },
  photoCard: {
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    backgroundColor: "#f8fafc",
  },
  photoImg: {
    width: "100%",
    height: "250px",
    objectFit: "cover" as const,
    display: "block",
  },
  photoMeta: {
    padding: "0.75rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#475569",
    fontSize: "0.9rem",
    fontWeight: "500",
    borderTop: "1px solid #e2e8f0",
  }
};
