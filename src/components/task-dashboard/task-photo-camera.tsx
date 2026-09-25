"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, SwitchCamera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const MAX_CAPTURE_SIZE = 300 * 1024;
const MAX_CAPTURE_EDGE = 1600;
const MIN_CAPTURE_EDGE = 480;
const JPEG_QUALITIES = [0.85, 0.72, 0.6, 0.5];

type Props = {
  disabled?: boolean;
  fileNamePrefix: string;
  onCapture: (photo: File) => void;
};

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

function scaledDimensions(width: number, height: number, longestEdge: number) {
  const scale = Math.min(1, longestEdge / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

async function compressedPhoto(video: HTMLVideoElement, fileNamePrefix: string) {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("Kamera belum siap. Tunggu sebentar lalu coba lagi.");
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Browser tidak dapat memproses foto kamera.");

  let longestEdge = Math.max(MIN_CAPTURE_EDGE, Math.min(MAX_CAPTURE_EDGE, Math.max(video.videoWidth, video.videoHeight)));

  while (longestEdge >= MIN_CAPTURE_EDGE) {
    const dimensions = scaledDimensions(video.videoWidth, video.videoHeight, longestEdge);
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    context.drawImage(video, 0, 0, dimensions.width, dimensions.height);

    for (const quality of JPEG_QUALITIES) {
      const blob = await canvasBlob(canvas, quality);
      if (blob && blob.size <= MAX_CAPTURE_SIZE) {
        return new File([blob], `${fileNamePrefix}-${Date.now()}.jpg`, { type: "image/jpeg" });
      }
    }

    if (longestEdge === MIN_CAPTURE_EDGE) {
      break;
    }
    longestEdge = Math.max(MIN_CAPTURE_EDGE, Math.floor(longestEdge * 0.75));
  }

  throw new Error("Foto belum dapat dikompresi hingga 300 KB. Coba ambil ulang atau unggah foto manual.");
}

function cameraErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") return "Izin kamera ditolak. Anda masih dapat mengunggah foto manual.";
    if (error.name === "NotFoundError" || error.name === "OverconstrainedError") return "Kamera yang dipilih tidak tersedia.";
  }
  return "Kamera tidak dapat dibuka. Pastikan Anda memakai HTTPS dan memiliki izin kamera.";
}

export function TaskPhotoCamera({ disabled = false, fileNamePrefix, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraIDs, setCameraIDs] = useState<string[]>([]);
  const [activeCameraID, setActiveCameraID] = useState("");
  const [opening, setOpening] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => undefined);
    return () => {
      if (video.srcObject === stream) video.srcObject = null;
    };
  }, [stream]);

  useEffect(() => () => stopStream(streamRef.current), []);

  function closeCamera() {
    stopStream(streamRef.current);
    streamRef.current = null;
    setStream(null);
    setCameraIDs([]);
    setActiveCameraID("");
  }

  async function openCamera(deviceID?: string) {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Kamera membutuhkan browser modern melalui HTTPS.");
      return;
    }

    setOpening(true);
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: deviceID
          ? { deviceId: { exact: deviceID }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const previousStream = streamRef.current;
      streamRef.current = nextStream;
      setStream(nextStream);
      stopStream(previousStream);

      const cameraDevices = (await navigator.mediaDevices.enumerateDevices())
        .filter((device) => device.kind === "videoinput")
        .map((device) => device.deviceId);
      const activeID = nextStream.getVideoTracks()[0]?.getSettings().deviceId ?? cameraDevices[0] ?? "";
      setCameraIDs(cameraDevices);
      setActiveCameraID(activeID);
    } catch (error) {
      toast.error(cameraErrorMessage(error));
    } finally {
      setOpening(false);
    }
  }

  async function switchCamera() {
    const currentIndex = cameraIDs.indexOf(activeCameraID);
    const nextID = cameraIDs[(currentIndex + 1) % cameraIDs.length];
    if (nextID) await openCamera(nextID);
  }

  async function capturePhoto() {
    if (!videoRef.current) return;

    setCapturing(true);
    try {
      const photo = await compressedPhoto(videoRef.current, fileNamePrefix);
      onCapture(photo);
      closeCamera();
      toast.success(`Foto diambil (${Math.ceil(photo.size / 1024)} KB).`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengambil foto.");
    } finally {
      setCapturing(false);
    }
  }

  if (!stream) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => void openCamera()} disabled={disabled || opening}>
        <Camera />
        {opening ? "Membuka kamera…" : "Buka kamera"}
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed bg-muted/30 p-3">
      <video ref={videoRef} className="aspect-video w-full rounded-md bg-black object-cover" aria-label="Preview kamera" muted playsInline />
      <div className="flex flex-wrap gap-2">
        {cameraIDs.length > 1 ? (
          <Button type="button" variant="outline" size="sm" onClick={() => void switchCamera()} disabled={disabled || opening || capturing}>
            <SwitchCamera />
            Ganti kamera
          </Button>
        ) : null}
        <Button type="button" size="sm" onClick={() => void capturePhoto()} disabled={disabled || opening || capturing}>
          <Camera />
          {capturing ? "Mengompresi…" : "Ambil foto"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={closeCamera} disabled={capturing}>
          Tutup kamera
        </Button>
      </div>
    </div>
  );
}
