"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, MapPin, Camera, LogOut, Users } from "lucide-react";

export default function AdminNavigation({ username }: { username: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuItems = [
    { name: "My Approval", path: "/dashboard/admin", icon: <LayoutDashboard size={20} /> },
    { name: "Users", path: "/dashboard/admin/users", icon: <Users size={20} /> },
    { name: "Locations", path: "/dashboard/admin/locations", icon: <MapPin size={20} /> },
    { name: "Camera Types", path: "/dashboard/admin/camera-types", icon: <Camera size={20} /> },
  ];

  return (
    <>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.leftSection}>
            <button onClick={toggleMenu} style={styles.hamburgerBtn} aria-label="Toggle menu">
              <Menu size={24} color="#1e293b" />
            </button>
            <h1 className="resp-page-title" style={styles.title}>GPS Admin</h1>
          </div>
          <div style={styles.userSection}>
            <span style={styles.userEmail}>{username}</span>
            <Link href="/api/auth/signout" style={styles.logoutBtn}>
              <LogOut size={16} /> Sign Out
            </Link>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div 
          style={styles.overlay} 
          onClick={toggleMenu} 
          aria-label="Close menu"
        />
      )}

      {/* Sidebar Drawer */}
      <div style={{ ...styles.sidebar, transform: isOpen ? "translateX(0)" : "translateX(-100%)" }}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Admin Menu</h2>
          <button onClick={toggleMenu} style={styles.closeBtn}>
            <X size={24} color="#64748b" />
          </button>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path} 
                onClick={toggleMenu}
                style={{ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) }}
              >
                {item.icon} {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

const styles = {
  header: {
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    padding: "1rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    position: "sticky" as const,
    top: 0,
    zIndex: 40,
  },
  headerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  hamburgerBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0.25rem",
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
  userEmail: {
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
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 45,
  },
  sidebar: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    bottom: 0,
    width: "280px",
    backgroundColor: "#ffffff",
    boxShadow: "4px 0 15px rgba(0,0,0,0.1)",
    zIndex: 50,
    transition: "transform 0.3s ease-in-out",
    display: "flex",
    flexDirection: "column" as const,
  },
  sidebarHeader: {
    padding: "1.5rem",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sidebarTitle: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#1e293b",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  nav: {
    padding: "1rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.875rem 1rem",
    color: "#475569",
    textDecoration: "none",
    fontWeight: "600",
    borderRadius: "8px",
    transition: "background 0.2s",
  },
  navLinkActive: {
    backgroundColor: "#eff6ff",
    color: "#2563eb",
  }
};
