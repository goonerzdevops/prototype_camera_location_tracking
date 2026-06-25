"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Check } from "lucide-react";

interface User {
  id: string;
  username: string;
  email: string | null;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("USER");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setFormUsername("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("USER");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!formUsername.trim() || !formPassword.trim()) {
      alert("Username and Password are required!");
      return;
    }
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: formUsername, 
          email: formEmail, 
          password: formPassword, 
          role: formRole 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");
      resetForm();
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formUsername.trim()) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: formUsername, 
          email: formEmail, 
          password: formPassword || undefined, // only send if changed
          role: formRole 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      resetForm();
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="resp-page-padding">Loading...</div>;

  return (
    <main className="resp-page-padding" style={styles.main}>
      <div style={styles.headerRow}>
        <h2 style={styles.title}>Manage Users</h2>
        {!isAdding && (
          <button 
            style={styles.addBtn} 
            onClick={() => { resetForm(); setIsAdding(true); }}
          >
            <Plus size={16} /> Add User
          </button>
        )}
      </div>

      {error && <div style={styles.errorAlert}>{error}</div>}

      <div style={styles.card}>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>Username</th>
                <th style={styles.th}>Email (Notifications)</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>New Password</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isAdding && (
                <tr style={styles.tr}>
                  <td style={styles.td}>
                    <input type="text" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="username" style={styles.input} />
                  </td>
                  <td style={styles.td}>
                    <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@ext.com" style={styles.input} />
                  </td>
                  <td style={styles.td}>
                    <select value={formRole} onChange={(e) => setFormRole(e.target.value)} style={styles.input}>
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td style={styles.td}>
                    <input type="text" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="password" style={styles.input} />
                  </td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <button onClick={handleCreate} style={styles.iconBtnSuccess} title="Save"><Check size={18} /></button>
                    <button onClick={resetForm} style={styles.iconBtnDanger} title="Cancel"><X size={18} /></button>
                  </td>
                </tr>
              )}

              {users.map((user) => (
                <tr key={user.id} style={styles.tr}>
                  <td style={styles.td}>
                    {editingId === user.id ? (
                      <input type="text" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} style={styles.input} />
                    ) : (
                      <strong>{user.username}</strong>
                    )}
                  </td>
                  <td style={styles.td}>
                    {editingId === user.id ? (
                      <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} style={styles.input} />
                    ) : (
                      <span style={{ color: user.email ? "#334155" : "#94a3b8" }}>{user.email || "No email"}</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    {editingId === user.id ? (
                      <select value={formRole} onChange={(e) => setFormRole(e.target.value)} style={styles.input}>
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    ) : (
                      <span style={{
                        ...styles.badge,
                        ...(user.role === "ADMIN" ? styles.badgeAdmin : styles.badgeUser)
                      }}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td style={styles.td}>
                    {editingId === user.id ? (
                      <input type="text" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="(Leave blank to keep)" style={styles.input} />
                    ) : (
                      <span style={{ color: "#cbd5e1" }}>********</span>
                    )}
                  </td>
                  <td style={{ ...styles.td, textAlign: "right", minWidth: "100px" }}>
                    {editingId === user.id ? (
                      <>
                        <button onClick={() => handleUpdate(user.id)} style={styles.iconBtnSuccess} title="Save"><Check size={18} /></button>
                        <button onClick={resetForm} style={styles.iconBtnDanger} title="Cancel"><X size={18} /></button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => { 
                            setEditingId(user.id); 
                            setFormUsername(user.username); 
                            setFormEmail(user.email || ""); 
                            setFormRole(user.role);
                            setFormPassword("");
                            setIsAdding(false); 
                          }} 
                          style={styles.iconBtn} title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(user.id)} style={styles.iconBtnDanger} title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

const styles = {
  main: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },
  addBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
  },
  errorAlert: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: "1rem",
    borderRadius: "6px",
    marginBottom: "1rem",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    textAlign: "left" as const,
  },
  trHead: {
    backgroundColor: "#f1f5f9",
    borderBottom: "2px solid #e2e8f0",
  },
  th: {
    padding: "1rem 1.5rem",
    color: "#475569",
    fontWeight: "600",
    fontSize: "0.9rem",
    textTransform: "uppercase" as const,
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
  },
  td: {
    padding: "1rem 1.5rem",
    color: "#334155",
    fontSize: "0.95rem",
  },
  input: {
    width: "100%",
    padding: "0.5rem",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    outline: "none",
  },
  badge: {
    padding: "0.25rem 0.6rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: "700",
  },
  badgeAdmin: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  badgeUser: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
  },
  iconBtn: {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    padding: "0.25rem",
    marginLeft: "0.5rem",
  },
  iconBtnSuccess: {
    background: "none",
    border: "none",
    color: "#16a34a",
    cursor: "pointer",
    padding: "0.25rem",
    marginLeft: "0.5rem",
  },
  iconBtnDanger: {
    background: "none",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    padding: "0.25rem",
    marginLeft: "0.5rem",
  }
};
