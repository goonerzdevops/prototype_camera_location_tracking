"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Check } from "lucide-react";

interface Location {
  id: string;
  name: string;
  createdAt: string;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/locations");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      setError("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreate = async () => {
    if (!editName.trim()) return;
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setEditName("");
      setIsAdding(false);
      fetchLocations();
    } catch (err) {
      alert("Failed to create location.");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/locations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditingId(null);
      setEditName("");
      fetchLocations();
    } catch (err) {
      alert("Failed to update location.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;
    try {
      const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      fetchLocations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="resp-page-padding">Loading...</div>;

  return (
    <main className="resp-page-padding" style={styles.main}>
      <div style={styles.headerRow}>
        <h2 style={styles.title}>Manage Locations</h2>
        {!isAdding && (
          <button 
            style={styles.addBtn} 
            onClick={() => { setIsAdding(true); setEditName(""); setEditingId(null); }}
          >
            <Plus size={16} /> Add Location
          </button>
        )}
      </div>

      {error && <div style={styles.errorAlert}>{error}</div>}

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.trHead}>
              <th style={styles.th}>Location Name</th>
              <th style={styles.th}>Created Date</th>
              <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isAdding && (
              <tr style={styles.tr}>
                <td style={styles.td}>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter location name"
                    style={styles.input}
                    autoFocus
                  />
                </td>
                <td style={styles.td}>-</td>
                <td style={{ ...styles.td, textAlign: "right" }}>
                  <button onClick={handleCreate} style={styles.iconBtnSuccess} title="Save"><Check size={18} /></button>
                  <button onClick={() => setIsAdding(false)} style={styles.iconBtnDanger} title="Cancel"><X size={18} /></button>
                </td>
              </tr>
            )}

            {locations.map((loc) => (
              <tr key={loc.id} style={styles.tr}>
                <td style={styles.td}>
                  {editingId === loc.id ? (
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={styles.input}
                      autoFocus
                    />
                  ) : (
                    <strong>{loc.name}</strong>
                  )}
                </td>
                <td style={styles.td}>{new Date(loc.createdAt).toLocaleDateString()}</td>
                <td style={{ ...styles.td, textAlign: "right" }}>
                  {editingId === loc.id ? (
                    <>
                      <button onClick={() => handleUpdate(loc.id)} style={styles.iconBtnSuccess} title="Save"><Check size={18} /></button>
                      <button onClick={() => setEditingId(null)} style={styles.iconBtnDanger} title="Cancel"><X size={18} /></button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => { setEditingId(loc.id); setEditName(loc.name); setIsAdding(false); }} 
                        style={styles.iconBtn} title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(loc.id)} style={styles.iconBtnDanger} title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {!isAdding && locations.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                  No locations found. Click 'Add Location' to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const styles = {
  main: {
    maxWidth: "800px",
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
  },
  input: {
    width: "100%",
    padding: "0.5rem",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "0.95rem",
    outline: "none",
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
