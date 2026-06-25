"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

export default function AdminActions({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const updateStatus = async (status: "APPROVED" | "REJECTED") => {
    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }

    if (!confirm(`Are you sure you want to mark this ticket as ${status}?`)) return;
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      router.push("/dashboard/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error updating ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.actionContainer}>
      <h3 style={styles.title}>Admin Actions</h3>
      
      {error && <div style={styles.errorAlert}>{error}</div>}

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "0.95rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: "0.5rem" }}>
          Reason <span style={{color:'red'}}>*</span>
        </label>
        <textarea 
          placeholder="Please write the reason for approval or rejection..."
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(""); }}
          style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", minHeight: "80px", resize: "vertical", outline: "none", fontSize: "0.95rem" }}
          required
        />
      </div>

      <div style={styles.btnRow}>
        <button 
          onClick={() => updateStatus("APPROVED")} 
          disabled={loading}
          style={styles.approveBtn}
        >
          <CheckCircle size={18} /> Approve Ticket
        </button>
        <button 
          onClick={() => updateStatus("REJECTED")} 
          disabled={loading}
          style={styles.rejectBtn}
        >
          <XCircle size={18} /> Reject Ticket
        </button>
      </div>
    </div>
  );
}

const styles = {
  errorAlert: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.9rem",
    fontWeight: "500",
  },
  actionContainer: {
    marginTop: "2rem",
    paddingTop: "1.5rem",
    borderTop: "2px dashed #e2e8f0",
  },
  title: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#334155",
    marginBottom: "1rem",
  },
  btnRow: {
    display: "flex",
    gap: "1rem",
  },
  approveBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    backgroundColor: "#16a34a",
    color: "white",
    border: "none",
    padding: "0.875rem",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(22, 163, 74, 0.3)",
  },
  rejectBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    padding: "0.875rem",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.3)",
  }
};
