"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function CancelTicketButton({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
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
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", flex: 1,
            padding: "0.75rem 0.5rem", borderRadius: "8px", border: "1px solid #ef4444", fontSize: "0.85rem",
            backgroundColor: "#fef2f2", color: "#dc2626", fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            transition: "all 0.2s"
          }}
        >
          <Trash2 size={16} /> Cancel Ticket
        </button>
      </div>
    </div>
  );
}
