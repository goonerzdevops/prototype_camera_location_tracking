"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { useRouter } from "next/navigation";
import { Camera, Save, Send, Trash2, Eye, ArrowLeft, MapPin, X, PlusCircle, RefreshCcw, Clock, Calendar } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface Location {
  id: string;
  name: string;
}

interface CameraType {
  id: string;
  name: string;
}

export interface TicketInitialData {
  id: string;
  locationId: string;
  latitude: number;
  longitude: number;
  note: string;
  photos: {
    id: string;
    type: string;
    cameraTypeId: string | null;
    filePath: string;
    note: string | null;
  }[];
}

interface Props {
  locations: Location[];
  cameraTypes: CameraType[];
  userId: string;
  initialData?: TicketInitialData;
}

type PhotoItem = {
  id: string;
  data: string;
  note: string;
};

type CameraDevice = {
  id: string;
  cameraTypeId: string;
  photos: PhotoItem[];
};

const getDeviceName = async () => {
  if (typeof window === "undefined") return "Unknown Device";
  
  const ua = navigator.userAgent;
  const isAndroid = /android/i.test(ua);
  const prefix = isAndroid ? "Android Device " : "";

  // Try Client Hints API (Chrome/Edge Android 110+)
  const nav = navigator as any;
  if (nav.userAgentData && nav.userAgentData.getHighEntropyValues) {
    try {
      const uaData = await nav.userAgentData.getHighEntropyValues(['model']);
      if (uaData.model) return `${prefix}${uaData.model}`.trim();
    } catch (e) {
      // Ignore and fallback
    }
  }

  if (isAndroid) {
    const match = ua.match(/\bAndroid[^;]*;(.*?)(Build|;|\))/i);
    let model = match && match[1] ? match[1].trim() : "";
    if (model && model !== "K" && model !== "wv") return `${prefix}${model}`;
    return "Android Device";
  }
  
  if (/iPad|iPhone|iPod/.test(ua)) return "iOS Device";
  return "Desktop/Web";
};

export default function TicketForm({ locations, cameraTypes, userId, initialData }: Props) {
  const router = useRouter();

  const [locationId, setLocationId] = useState(initialData?.locationId || "");
  const [latitude, setLatitude] = useState<number | null>(initialData?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(initialData?.longitude || null);
  const [note, setNote] = useState(initialData?.note || ""); // global note

  const [locationPhotos, setLocationPhotos] = useState<PhotoItem[]>(() => {
    if (!initialData) return [];
    return initialData.photos
      .filter(p => p.type === "LOCATION")
      .map(p => ({ id: p.id, data: p.filePath, note: p.note || "" }));
  });

  const [cameraDevices, setCameraDevices] = useState<CameraDevice[]>(() => {
    if (!initialData) return [];
    const camPhotos = initialData.photos.filter(p => p.type === "CAMERA" && p.cameraTypeId);
    const devicesMap = new Map<string, PhotoItem[]>();
    
    // Group photos by cameraTypeId. Note: In the current DB, we don't have a distinct "DeviceId", 
    // so we group them by cameraTypeId. Each unique cameraTypeId becomes one device block.
    camPhotos.forEach(p => {
      const cId = p.cameraTypeId!;
      if (!devicesMap.has(cId)) devicesMap.set(cId, []);
      devicesMap.get(cId)?.push({ id: p.id, data: p.filePath, note: p.note || "" });
    });

    return Array.from(devicesMap.entries()).map(([cId, photos]) => ({
      id: uuidv4(),
      cameraTypeId: cId,
      photos
    }));
  });

  const [isReviewing, setIsReviewing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [activeCaptureTarget, setActiveCaptureTarget] = useState<{ type: "LOCATION" | "CAMERA", deviceId?: string } | null>(null);

  const [loadingGPS, setLoadingGPS] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const webcamRef = useRef<Webcam>(null);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  useEffect(() => {
    fetchGPS();
  }, []);

  const fetchGPS = () => {
    setLoadingGPS(true);
    setError("");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLoadingGPS(false);
        },
        (err) => {
          setError("Failed to access GPS. Please allow location permissions.");
          setLoadingGPS(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setLoadingGPS(false);
    }
  };

  interface WatermarkData {
    topLeft: string;
    bottomLeft: string;
    topRight: string;
    bottomRight: string;
  }

  const compressImage = (base64Str: string, data: WatermarkData, maxWidth = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Draw Watermark Background
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

          ctx.font = "bold 14px Arial";
          ctx.fillStyle = "white";

          // Left Side
          ctx.textAlign = "left";
          ctx.fillText(data.topLeft, 15, canvas.height - 35);
          ctx.fillText(data.bottomLeft, 15, canvas.height - 15);

          // Right Side
          ctx.textAlign = "right";
          ctx.fillText(data.topRight, canvas.width - 15, canvas.height - 35);
          ctx.fillText(data.bottomRight, canvas.width - 15, canvas.height - 15);
        }
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
    });
  };

  const openCameraFor = (type: "LOCATION" | "CAMERA", deviceId?: string) => {
    setActiveCaptureTarget({ type, deviceId });
    setIsCameraOpen(true);
  };

  const capturePhoto = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc && activeCaptureTarget) {
      const timestamp = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "medium" });
      const deviceName = await getDeviceName();
      const cameraDirection = facingMode === "environment" ? "Rear Camera" : "Front Camera";

      let topLeft = `Device: ${deviceName} (${cameraDirection})`;
      let bottomLeft = `Time: ${timestamp}`;
      let topRight = latitude && longitude ? `Lat: ${latitude.toFixed(6)} | Lng: ${longitude.toFixed(6)}` : "GPS Unknown";
      let bottomRight = "";

      if (activeCaptureTarget.type === "LOCATION") {
        const locName = locations.find(l => l.id === locationId)?.name || "Unknown Location";
        bottomRight = `Location: ${locName}`;
      } else if (activeCaptureTarget.type === "CAMERA" && activeCaptureTarget.deviceId) {
        const dev = cameraDevices.find(d => d.id === activeCaptureTarget.deviceId);
        const camName = cameraTypes.find(c => c.id === dev?.cameraTypeId)?.name || "Unknown Camera";
        bottomRight = `Camera: ${camName}`;
      }

      const watermarkData: WatermarkData = { topLeft, bottomLeft, topRight, bottomRight };
      const compressedSrc = await compressImage(imageSrc, watermarkData);
      const newPhoto: PhotoItem = { id: uuidv4(), data: compressedSrc, note: "" };

      if (activeCaptureTarget.type === "LOCATION") {
        setLocationPhotos((prev) => [...prev, newPhoto]);
      } else if (activeCaptureTarget.type === "CAMERA" && activeCaptureTarget.deviceId) {
        setCameraDevices((prev) => prev.map(dev => {
          if (dev.id === activeCaptureTarget.deviceId) {
            return { ...dev, photos: [...dev.photos, newPhoto] };
          }
          return dev;
        }));
      }
      setIsCameraOpen(false);
      setActiveCaptureTarget(null);
    }
  }, [webcamRef, activeCaptureTarget, locations, locationId, cameraDevices, cameraTypes, facingMode, latitude, longitude]);

  const removeLocationPhoto = (id: string) => {
    setLocationPhotos(prev => prev.filter(p => p.id !== id));
  };

  const updateLocationPhotoNote = (id: string, note: string) => {
    setLocationPhotos(prev => prev.map(p => p.id === id ? { ...p, note } : p));
  };

  const addCameraDevice = () => {
    setCameraDevices(prev => [...prev, { id: uuidv4(), cameraTypeId: "", photos: [] }]);
  };

  const removeCameraDevice = (id: string) => {
    setCameraDevices(prev => prev.filter(d => d.id !== id));
  };

  const updateCameraType = (id: string, cameraTypeId: string) => {
    setCameraDevices(prev => prev.map(d => d.id === id ? { ...d, cameraTypeId } : d));
  };

  const removeCameraPhoto = (deviceId: string, photoId: string) => {
    setCameraDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        return { ...d, photos: d.photos.filter(p => p.id !== photoId) };
      }
      return d;
    }));
  };

  const updateCameraPhotoNote = (deviceId: string, photoId: string, note: string) => {
    setCameraDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        return { ...d, photos: d.photos.map(p => p.id === photoId ? { ...p, note } : p) };
      }
      return d;
    }));
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean) => {
    e.preventDefault();
    if (!locationId) {
      setError("Please select Location.");
      window.scrollTo(0, 0);
      return;
    }
    if (!latitude || !longitude) {
      setError("GPS coordinates are missing. Please allow location access.");
      window.scrollTo(0, 0);
      return;
    }

    // Validation for photos
    let totalPhotos = locationPhotos.length;
    for (const dev of cameraDevices) {
      if (!dev.cameraTypeId) {
        setError("Please select a camera type for all added devices.");
        window.scrollTo(0, 0);
        return;
      }
      totalPhotos += dev.photos.length;
    }

    if (totalPhotos === 0) {
      setError("Please capture at least one photo (location or camera).");
      window.scrollTo(0, 0);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const isEditing = !!initialData;
      const url = isEditing ? `/api/tickets/${initialData.id}` : "/api/tickets";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId,
          latitude,
          longitude,
          note,
          status: isDraft ? "DRAFT" : "PENDING_APPROVAL",
          locationPhotos: locationPhotos.map(p => ({ id: p.id, data: p.data, note: p.note })),
          cameraDevices: cameraDevices.map(d => ({
            cameraTypeId: d.cameraTypeId,
            photos: d.photos.map(p => ({ id: p.id, data: p.data, note: p.note }))
          }))
        }),
      });

      if (!res.ok) throw new Error("Failed to submit ticket.");

      router.push("/dashboard/my-tickets");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
      window.scrollTo(0, 0);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="resp-card-padding" style={styles.card}>
      {error && <div style={styles.errorAlert}>{error}</div>}

      <form style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

        {!isReviewing ? (
          <>
            {/* GPS Tracker Status */}
            <div style={styles.gpsBox}>
              <div style={styles.gpsHeader}>
                <MapPin size={20} color={latitude ? "#16a34a" : "#ca8a04"} />
                <span style={{ fontWeight: 600 }}>Auto GPS Tracker</span>
              </div>
              {loadingGPS ? (
                <span style={{ color: "#ca8a04", fontSize: "0.9rem" }}>Scanning satellites...</span>
              ) : latitude && longitude ? (
                <div className="resp-gps-data" style={styles.gpsData}>
                  <span>Lat: <strong>{latitude.toFixed(6)}</strong></span>
                  <span>Lng: <strong>{longitude.toFixed(6)}</strong></span>
                </div>
              ) : (
                <button type="button" onClick={fetchGPS} style={styles.retryBtn}>Retry GPS</button>
              )}
            </div>

            {/* SECTION 1: LOCATION */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>1. Location Area</h3>
              <div style={styles.formGroup}>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  style={styles.select}
                  required
                >
                  <option value="">-- Select Master Data Location --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <button type="button" onClick={() => openCameraFor("LOCATION")} style={styles.takePhotoBtn}>
                <Camera size={20} /> Take Location Photo
              </button>

              {locationPhotos.length > 0 && (
                <div style={styles.photoGrid}>
                  {locationPhotos.map((photo) => (
                    <div key={photo.id} style={styles.photoCard}>
                      <div style={{ position: "relative" }}>
                        <img src={photo.data} alt="location" style={styles.photoImg} onClick={() => setPreviewPhoto(photo.data)} />
                        <button type="button" onClick={() => removeLocationPhoto(photo.id)} style={styles.deletePhotoBtn}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <textarea
                        placeholder="Note for this photo..."
                        value={photo.note}
                        onChange={(e) => updateLocationPhotoNote(photo.id, e.target.value)}
                        style={styles.photoNoteInput}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 2: CAMERA DEVICES */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>2. Camera Devices</h3>

              {cameraDevices.map((device, index) => (
                <div key={device.id} style={styles.deviceCard}>
                  <div style={styles.deviceHeader}>
                    <span style={{ fontWeight: 600 }}>Device #{index + 1}</span>
                    <button type="button" onClick={() => removeCameraDevice(device.id)} style={styles.removeDeviceBtn}>
                      <X size={16} /> Remove
                    </button>
                  </div>

                  <div style={styles.formGroup}>
                    <select
                      value={device.cameraTypeId}
                      onChange={(e) => updateCameraType(device.id, e.target.value)}
                      style={styles.select}
                      required
                    >
                      <option value="">-- Select Camera Type --</option>
                      {cameraTypes.map((cam) => (
                        <option key={cam.id} value={cam.id}>{cam.name}</option>
                      ))}
                    </select>
                  </div>

                  <button type="button" onClick={() => openCameraFor("CAMERA", device.id)} style={styles.takePhotoBtn}>
                    <Camera size={20} /> Take Camera Photo
                  </button>

                  {device.photos.length > 0 && (
                    <div style={styles.photoGrid}>
                      {device.photos.map((photo) => (
                        <div key={photo.id} style={styles.photoCard}>
                          <div style={{ position: "relative" }}>
                            <img src={photo.data} alt="camera" style={styles.photoImg} onClick={() => setPreviewPhoto(photo.data)} />
                            <button type="button" onClick={() => removeCameraPhoto(device.id, photo.id)} style={styles.deletePhotoBtn}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <textarea
                            placeholder="Note for this photo..."
                            value={photo.note}
                            onChange={(e) => updateCameraPhotoNote(device.id, photo.id, e.target.value)}
                            style={styles.photoNoteInput}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <button type="button" onClick={addCameraDevice} style={styles.addDeviceBtn}>
                <PlusCircle size={20} /> Add Camera Device
              </button>
            </div>

            {/* GLOBAL NOTE */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Additional Ticket Note (Optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ ...styles.select, minHeight: "80px", resize: "vertical" }}
                placeholder="Write general ticket notes here..."
              />
            </div>
          </>
        ) : (
          <div style={{ padding: "0 0.5rem" }}>
            <h3 style={styles.sectionTitle}>Review Ticket Data</h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}><MapPin size={16} /> Location Area</span>
                <span style={{ fontSize: "1rem", fontWeight: 500, color: "#1e293b" }}>{locations.find(l => l.id === locationId)?.name || "-"}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}><Clock size={16} /> GPS Coordinates</span>
                <span style={{ fontSize: "1rem", fontWeight: 500, color: "#1e293b" }}>Lat: {latitude?.toFixed(6) || "-"} | Lng: {longitude?.toFixed(6) || "-"}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}><Calendar size={16} /> Time</span>
                <span style={{ fontSize: "1rem", fontWeight: 500, color: "#1e293b" }}>{new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
              </div>
            </div>

            {note && (
              <div style={{ marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Additional Note</span>
                <p style={{ marginTop: "0.5rem", color: "#334155", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{note}</p>
              </div>
            )}

            <h3 style={styles.sectionTitle}>Evidence Photos</h3>
            
            {locationPhotos.length > 0 && (
              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "#334155", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <MapPin size={18} /> Location Photos
                </h4>
                <div style={styles.photoGrid}>
                  {locationPhotos.map((photo) => (
                    <div key={photo.id} style={styles.photoCard}>
                      <img src={photo.data} alt="location" style={styles.photoImg} onClick={() => setPreviewPhoto(photo.data)} />
                      <div style={{ padding: "0.75rem", fontSize: "0.9rem", color: "#475569", fontWeight: 500, borderTop: "1px solid #e2e8f0" }}>
                        {photo.note || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cameraDevices.map((device, idx) => {
              if (device.photos.length === 0) return null;
              const camName = cameraTypes.find(c => c.id === device.cameraTypeId)?.name || `Camera Device #${idx + 1}`;
              return (
                <div key={device.id} style={{ marginBottom: "2rem" }}>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "#334155", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Camera size={18} /> {camName}
                  </h4>
                  <div style={styles.photoGrid}>
                    {device.photos.map((photo) => (
                      <div key={photo.id} style={styles.photoCard}>
                        <img src={photo.data} alt="camera" style={styles.photoImg} onClick={() => setPreviewPhoto(photo.data)} />
                        <div style={{ padding: "0.75rem", fontSize: "0.9rem", color: "#475569", fontWeight: 500, borderTop: "1px solid #e2e8f0" }}>
                          {photo.note || "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "1.5rem" }}>
          {!isReviewing ? (
            <>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                disabled={submitting}
                style={{ ...styles.draftBtn, flex: 1, padding: "0.75rem 0.5rem", fontSize: "0.85rem", color: "#dc2626", border: "1px solid #fca5a5", backgroundColor: "#fef2f2" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={submitting}
                style={{ ...styles.draftBtn, flex: 1, padding: "0.75rem 0.5rem", fontSize: "0.85rem" }}
              >
                <Save size={16} /> Draft
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!locationId || !latitude || !longitude) {
                    setError("Please complete location and GPS before reviewing.");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    return;
                  }
                  setIsReviewing(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={submitting}
                style={{ ...styles.submitBtn, flex: 1.5, padding: "0.75rem 0.5rem", fontSize: "0.85rem", backgroundColor: "#eab308" }}
              >
                <Eye size={16} /> Review
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsReviewing(false)}
                disabled={submitting}
                style={{ ...styles.draftBtn, flex: 1, padding: "0.75rem 0.5rem", fontSize: "0.85rem" }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={submitting}
                style={{ ...styles.submitBtn, flex: 2, padding: "0.75rem 0.5rem", fontSize: "0.85rem" }}
              >
                <Send size={16} /> Final Submit
              </button>
            </>
          )}
        </div>
      </form>

      {/* CAMERA MODAL */}
      {isCameraOpen && (
        <div style={styles.cameraOverlay}>
          <div style={styles.cameraContainer}>
            <div style={styles.cameraHeader}>
              <h3 style={{ margin: 0, color: "white" }}>Live Capture</h3>
              <button type="button" onClick={() => setIsCameraOpen(false)} style={styles.closeCameraBtn}>
                <X size={24} />
              </button>
            </div>

            <div style={styles.webcamWrapper}>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }}
                style={styles.webcam}
              />
            </div>

            <div style={styles.cameraControls}>
              <button type="button" onClick={toggleCamera} style={styles.toggleBtn}>
                <RefreshCcw size={20} /> Flip
              </button>
              <button type="button" onClick={capturePhoto} style={styles.captureBtn}>
                <Camera size={28} /> Capture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
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
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  errorAlert: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    fontWeight: "500",
  },
  section: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1.5rem",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 1rem 0",
    paddingBottom: "0.5rem",
    borderBottom: "1px solid #cbd5e1"
  },
  deviceCard: {
    backgroundColor: "#ffffff",
    border: "1px dashed #cbd5e1",
    borderRadius: "8px",
    padding: "1rem",
    marginBottom: "1rem",
  },
  deviceHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    color: "#334155",
  },
  removeDeviceBtn: {
    background: "none",
    border: "none",
    color: "#ef4444",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "600",
  },
  addDeviceBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.875rem",
    backgroundColor: "#f0fdf4",
    color: "#166534",
    border: "1px dashed #166534",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  takePhotoBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "1rem",
  },
  gpsBox: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: "1rem",
  },
  gpsHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#0f172a",
  },
  gpsData: {
    display: "flex",
    gap: "1rem",
    color: "#334155",
    fontSize: "0.9rem",
  },
  retryBtn: {
    padding: "0.4rem 0.8rem",
    backgroundColor: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
    marginBottom: "1rem"
  },
  label: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "#334155",
  },
  select: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "1rem",
    backgroundColor: "white",
    color: "#0f172a",
    outline: "none",
  },
  photoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "1rem",
  },
  photoCard: {
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
  },
  photoImg: {
    width: "100%",
    height: "140px",
    objectFit: "cover" as const,
    display: "block",
    cursor: "pointer",
  },
  deletePhotoBtn: {
    position: "absolute" as const,
    top: "0.5rem",
    right: "0.5rem",
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  photoNoteInput: {
    width: "100%",
    border: "none",
    borderTop: "1px solid #e2e8f0",
    padding: "0.5rem",
    fontSize: "0.85rem",
    resize: "none" as const,
    height: "60px",
    outline: "none",
  },
  cameraOverlay: {
    position: "fixed" as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column" as const,
  },
  cameraContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    maxWidth: "800px",
    margin: "0 auto",
    width: "100%",
    height: "100%",
  },
  cameraHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
  },
  closeCameraBtn: {
    background: "none",
    border: "none",
    color: "white",
    cursor: "pointer",
    padding: "0.5rem",
  },
  webcamWrapper: {
    flex: 1,
    position: "relative" as const,
    backgroundColor: "black",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  webcam: {
    width: "100%",
    height: "100%",
    objectFit: "contain" as const,
  },
  cameraControls: {
    display: "flex",
    justifyContent: "center",
    gap: "2rem",
    padding: "1.5rem",
    backgroundColor: "black",
  },
  toggleBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "#334155",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "9999px",
    fontWeight: "600",
    cursor: "pointer",
  },
  captureBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "0.75rem 2rem",
    borderRadius: "9999px",
    fontWeight: "600",
    cursor: "pointer",
  },
  actionRow: {
    borderTop: "1px solid #e2e8f0",
    paddingTop: "1.5rem",
  },
  draftBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.875rem",
    backgroundColor: "#f8fafc",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontWeight: "600",
    color: "#475569",
    cursor: "pointer",
  },
  submitBtn: {
    flex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.875rem",
    backgroundColor: "#2563eb",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    color: "white",
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
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
