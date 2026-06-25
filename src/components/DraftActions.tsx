"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Send, ArrowLeft, Trash2, Edit } from "lucide-react";

export default function DraftActions({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [isReviewing, setIsReviewing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PENDING_APPROVAL" }),
      });

      if (res.ok) {
        alert("Ticket submitted successfully!");
        router.push("/dashboard/my-tickets");
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to submit ticket.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel and delete this ticket? This action cannot be undone, and all associated photos will be permanently removed.")) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Ticket has been deleted successfully.");
        router.push("/dashboard/my-tickets");
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to delete ticket.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "2rem", borderTop: "1px solid #e2e8f0", paddingTop: "1.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "nowrap" }}>
        {!isReviewing ? (
          <>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", flex: 1,
                padding: "0.75rem 0.5rem", borderRadius: "8px", border: "1px solid #ef4444", fontSize: "0.85rem",
                backgroundColor: "#fef2f2", color: "#dc2626", fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                transition: "all 0.2s"
              }}
            >
              <Trash2 size={16} /> Cancel
            </button>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/ticket/${ticketId}/edit`)}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", flex: 1,
                padding: "0.75rem 0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem",
                backgroundColor: "#f8fafc", color: "#475569", fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                transition: "all 0.2s"
              }}
            >
              <Edit size={16} /> Edit
            </button>
            <button 
              type="button" 
              onClick={() => {
                setIsReviewing(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", flex: 1.5,
                padding: "0.75rem 0.5rem", borderRadius: "8px", border: "none", fontSize: "0.85rem",
                backgroundColor: "#eab308", color: "#ffffff", fontWeight: "600",
                cursor: "pointer", transition: "all 0.2s"
              }}
            >
              <Eye size={16} /> Review
            </button>
          </>
        ) : (
          <>
            <button 
              type="button" 
              onClick={() => setIsReviewing(false)} 
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", flex: 1,
                padding: "0.75rem 0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem",
                backgroundColor: "#f8fafc", color: "#475569", fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button 
              type="button" 
              onClick={handleSubmit} 
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", flex: 2,
                padding: "0.75rem 0.5rem", borderRadius: "8px", border: "none", fontSize: "0.85rem",
                backgroundColor: "#2563eb", color: "#ffffff", fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1
              }}
            >
              <Send size={16} /> Final Submit
            </button>
          </>
        )}
      </div>
    </div>
  );
}
