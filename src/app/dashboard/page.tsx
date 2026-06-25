import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle, List } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Redirect admin to admin dashboard
  if (session.user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 className="resp-page-title" style={styles.title}>Dashboard</h1>
          <div style={styles.userSection}>
            <span style={styles.username}>{session.user.name}</span>
            <Link href="/api/auth/signout" style={styles.logoutBtn}>
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      <main className="resp-page-padding" style={styles.main}>
        <div style={styles.buttonContainer}>
          <Link href="/dashboard/create-ticket" style={{ ...styles.button, backgroundColor: "#3b82f6", color: "white" }}>
            <PlusCircle size={20} />
            Create Ticket
          </Link>

          <Link href="/dashboard/my-tickets" style={{ ...styles.button, backgroundColor: "#10b981", color: "white" }}>
            <List size={20} />
            View Ticket
          </Link>
        </div>
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
  buttonContainer: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap" as const,
  },
  button: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "1rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    transition: "transform 0.1s, box-shadow 0.1s",
  }
};
