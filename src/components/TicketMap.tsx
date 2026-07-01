"use client";

import { useEffect, useRef } from "react";

interface TicketPin {
  id: string;
  ticketNumber: string;
  latitude: number;
  longitude: number;
  status: string;
  locationName: string;
  submittedBy: string;
  createdAt: string;
}

interface Props {
  tickets: TicketPin[];
}

const STATUS_CONFIG: Record<string, { color: string; label: string; hex: string }> = {
  PENDING_APPROVAL: { color: "orange",  label: "Pending Approval", hex: "#f59e0b" },
  APPROVED:         { color: "green",   label: "Approved",          hex: "#22c55e" },
  REJECTED:         { color: "red",     label: "Rejected",          hex: "#ef4444" },
  DRAFT:            { color: "gray",    label: "Draft",             hex: "#94a3b8" },
};

export default function TicketMap({ tickets }: Props) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Leaflet harus diimport client-side (tidak support SSR)
    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      // Fix default icon path untuk Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Inisialisasi map — center ke Indonesia
      const defaultCenter: [number, number] =
        tickets.length > 0
          ? [tickets[0].latitude, tickets[0].longitude]
          : [-2.5489, 118.0149];

      const map = L.map(containerRef.current, {
        center: defaultCenter,
        zoom: tickets.length > 0 ? 13 : 5,
        zoomControl: true,
      });

      mapRef.current = map;

      // OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Plot semua ticket sebagai marker
      tickets.forEach((ticket) => {
        const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.DRAFT;

        // Custom colored circle marker
        const marker = L.circleMarker([ticket.latitude, ticket.longitude], {
          radius: 10,
          fillColor: cfg.hex,
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        });

        const submittedDate = new Date(ticket.createdAt).toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        });

        marker.bindPopup(`
          <div style="min-width:220px; font-family:sans-serif;">
            <div style="font-weight:700; font-size:14px; margin-bottom:8px; color:#0f172a;">
              ${ticket.ticketNumber}
            </div>
            <div style="display:flex; flex-direction:column; gap:5px; font-size:13px; color:#334155;">
              <div>
                <span style="color:#94a3b8; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.05em;">Status</span><br/>
                <span style="
                  display:inline-block; margin-top:2px;
                  padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:700;
                  background:${cfg.hex}22; color:${cfg.hex}; border:1px solid ${cfg.hex}66;
                ">${cfg.label}</span>
              </div>
              <div>
                <span style="color:#94a3b8; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.05em;">Lokasi</span><br/>
                <b>${ticket.locationName}</b>
              </div>
              <div>
                <span style="color:#94a3b8; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.05em;">Submitted By</span><br/>
                ${ticket.submittedBy}
              </div>
              <div>
                <span style="color:#94a3b8; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.05em;">Tanggal</span><br/>
                ${submittedDate}
              </div>
              <div>
                <span style="color:#94a3b8; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.05em;">Koordinat</span><br/>
                <code style="font-size:11px;">${ticket.latitude.toFixed(6)}, ${ticket.longitude.toFixed(6)}</code>
              </div>
            </div>
            <a href="/dashboard/ticket/${ticket.id}"
               style="
                 display:block; margin-top:10px; text-align:center;
                 padding:6px 12px; background:#2563eb; color:white;
                 border-radius:6px; font-size:12px; font-weight:600;
                 text-decoration:none;
               ">
              Lihat Detail Tiket →
            </a>
          </div>
        `, { maxWidth: 280 });

        marker.addTo(map);
      });

      // Auto fit bounds jika ada banyak marker
      if (tickets.length > 1) {
        const bounds = L.latLngBounds(
          tickets.map((t) => [t.latitude, t.longitude] as [number, number])
        );
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [tickets]);

  return (
    <>
      {/* Leaflet CSS — harus di-load manual karena tidak ada global import */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", minHeight: "500px", borderRadius: "12px" }}
      />
    </>
  );
}
