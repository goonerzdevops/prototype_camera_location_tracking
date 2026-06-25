"use client";

import { useState } from "react";
import { Camera, MapPin, X } from "lucide-react";

interface Photo {
  id: string;
  type: string;
  filePath: string;
  note?: string | null;
  cameraType?: { name: string } | null;
}

export default function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  if (!photos || photos.length === 0) return null;

  const locationPhotos = photos.filter(p => p.type === "LOCATION");
  const cameraPhotos = photos.filter(p => p.type === "CAMERA");

  // Group camera photos by cameraType
  const cameraGroups: Record<string, Photo[]> = {};
  cameraPhotos.forEach(p => {
    const camName = p.cameraType?.name || "Unknown Camera";
    if (!cameraGroups[camName]) cameraGroups[camName] = [];
    cameraGroups[camName].push(p);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {locationPhotos.length > 0 && (
        <div>
          <h4 style={styles.groupTitle}><MapPin size={18} /> Location Photos</h4>
          <div style={styles.photoGrid}>
            {locationPhotos.map((photo) => (
              <div key={photo.id} style={styles.photoCard}>
                <img src={photo.filePath} alt="Location Evidence" style={styles.photoImg} onClick={() => setPreviewPhoto(photo.filePath)} />
                {photo.note && (
                  <div style={styles.photoNote}>
                    <p style={{ margin: 0 }}>{photo.note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.entries(cameraGroups).map(([cameraName, camPhotos]) => (
        <div key={cameraName}>
          <h4 style={styles.groupTitle}><Camera size={18} /> {cameraName} Photos</h4>
          <div style={styles.photoGrid}>
            {camPhotos.map((photo) => (
              <div key={photo.id} style={styles.photoCard}>
                <img src={photo.filePath} alt={`${cameraName} Evidence`} style={styles.photoImg} onClick={() => setPreviewPhoto(photo.filePath)} />
                {photo.note && (
                  <div style={styles.photoNote}>
                    <p style={{ margin: 0 }}>{photo.note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {previewPhoto && (
        <div style={styles.previewOverlay} onClick={() => setPreviewPhoto(null)}>
          <div style={styles.previewContainer} onClick={(e) => e.stopPropagation()}>
            <button style={styles.previewCloseBtn} onClick={() => setPreviewPhoto(null)}>
              <X size={24} />
            </button>
            <img src={previewPhoto} alt="Preview" style={styles.previewImg} />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  groupTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#334155",
    margin: "0 0 1rem 0",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  photoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "1rem",
  },
  photoCard: {
    position: "relative" as const,
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column" as const,
  },
  photoImg: {
    width: "100%",
    height: "150px",
    objectFit: "cover" as const,
    display: "block",
    cursor: "pointer",
  },
  photoNote: {
    padding: "0.75rem",
    fontSize: "0.85rem",
    color: "#475569",
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    lineHeight: "1.4",
  },
  previewOverlay: {
    position: "fixed" as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  previewContainer: {
    position: "relative" as const,
    maxWidth: "90vw",
    maxHeight: "90vh",
    display: "flex",
    justifyContent: "center",
  },
  previewImg: {
    maxWidth: "100%",
    maxHeight: "90vh",
    objectFit: "contain" as const,
    borderRadius: "8px",
  },
  previewCloseBtn: {
    position: "absolute" as const,
    top: "-1rem",
    right: "-1rem",
    backgroundColor: "white",
    borderRadius: "50%",
    border: "none",
    color: "#0f172a",
    cursor: "pointer",
    padding: "0.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  }
};
