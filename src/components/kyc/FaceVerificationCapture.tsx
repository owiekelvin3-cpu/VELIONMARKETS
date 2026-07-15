import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, CheckCircle, RefreshCw, X } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Phase = "idle" | "camera" | "countdown" | "preview" | "error";

type FaceDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
};

declare global {
  interface Window {
    FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => FaceDetectorLike;
  }
}

interface FaceVerificationCaptureProps {
  value: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function FaceVerificationCapture({ value, onChange, disabled }: FaceVerificationCaptureProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<FaceDetectorLike | null>(null);
  const rafRef = useRef<number>(0);
  const countdownTimerRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<Phase>(value ? "preview" : "idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [faceReady, setFaceReady] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState<"center" | "hold">("center");

  useEffect(() => {
    if (!value) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    setPhase("preview");
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const cleanupCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    stopStream(streamRef.current);
    streamRef.current = null;
    setFaceReady(false);
  }, []);

  useEffect(() => () => cleanupCamera(), [cleanupCamera]);

  const watchFace = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const tick = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        rafRef.current = requestAnimationFrame(() => void tick());
        return;
      }

      try {
        if (!detectorRef.current && window.FaceDetector) {
          detectorRef.current = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        }

        if (detectorRef.current) {
          const faces = await detectorRef.current.detect(videoRef.current);
          const face = faces[0];
          if (face) {
            const box = face.boundingBox;
            const vw = videoRef.current.videoWidth || 1;
            const vh = videoRef.current.videoHeight || 1;
            const cx = (box.x + box.width / 2) / vw;
            const cy = (box.y + box.height / 2) / vh;
            const size = Math.max(box.width / vw, box.height / vh);
            const centered = cx > 0.28 && cx < 0.72 && cy > 0.22 && cy < 0.72;
            const sized = size > 0.18 && size < 0.72;
            const ready = centered && sized;
            setFaceReady(ready);
            setChallenge(ready ? "hold" : "center");
          } else {
            setFaceReady(false);
            setChallenge("center");
          }
        } else {
          // Browser has no FaceDetector — allow capture with guidance only
          setFaceReady(true);
          setChallenge("hold");
        }
      } catch {
        setFaceReady(true);
        setChallenge("hold");
      }

      rafRef.current = requestAnimationFrame(() => void tick());
    };

    rafRef.current = requestAnimationFrame(() => void tick());
  }, []);

  const startCamera = async () => {
    if (disabled) return;
    setError("");
    onChange(null);
    cleanupCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      setPhase("camera");
      setChallenge("center");
      setFaceReady(false);

      requestAnimationFrame(() => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        void video.play().then(() => watchFace()).catch(() => {
          setError(t("kyc.faceCameraError"));
          setPhase("error");
        });
      });
    } catch {
      setError(t("kyc.faceCameraDenied"));
      setPhase("error");
    }
  };

  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror to match preview
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
    );
    if (!blob) {
      setError(t("kyc.faceCaptureFailed"));
      setPhase("camera");
      return;
    }

    const file = new File([blob], `face-selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
    cleanupCamera();
    onChange(file);
    setPhase("preview");
  }, [cleanupCamera, onChange, t]);

  const beginCountdown = () => {
    if (!faceReady || disabled) return;
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
    }
    setPhase("countdown");
    setCountdown(3);
    let remaining = 3;
    countdownTimerRef.current = window.setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        if (countdownTimerRef.current) {
          window.clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        void captureFrame();
      }
    }, 700);
  };

  const retake = () => {
    onChange(null);
    void startCamera();
  };

  const cancelCamera = () => {
    cleanupCamera();
    setPhase(value ? "preview" : "idle");
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{t("kyc.faceTitle")}</p>
        <p className="mt-1 text-xs text-muted">{t("kyc.faceDesc")}</p>
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-[1.5rem] border border-border bg-[#0a0a0b]",
          phase === "idle" || phase === "error" ? "min-h-[220px]" : "aspect-[4/5] sm:aspect-[3/4]"
        )}
      >
        {(phase === "camera" || phase === "countdown") && (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
            />
            {/* Dark vignette with oval cutout */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 42% 52% at 50% 46%, transparent 54%, rgba(0,0,0,0.72) 56%)",
              }}
            />
            <div
              className={cn(
                "pointer-events-none absolute left-1/2 top-[46%] h-[58%] w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 transition-colors",
                faceReady ? "border-emerald shadow-[0_0_0_1px_rgba(16,185,129,0.35)]" : "border-white/50"
              )}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-10 text-center">
              <p className="text-sm font-medium text-white">
                {phase === "countdown"
                  ? t("kyc.faceHoldStill")
                  : challenge === "hold"
                    ? t("kyc.faceReadyPrompt")
                    : t("kyc.faceCenterPrompt")}
              </p>
              {phase === "countdown" && (
                <p className="mt-2 font-display text-4xl font-semibold text-emerald">{countdown}</p>
              )}
            </div>
          </>
        )}

        {phase === "preview" && previewUrl && (
          <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}

        {(phase === "idle" || phase === "error") && (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-emerald">
              <Camera className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold text-white">{t("kyc.faceStartTitle")}</p>
            <p className="max-w-xs text-xs leading-relaxed text-white/65">{t("kyc.faceStartDesc")}</p>
          </div>
        )}

        {(phase === "preview" || phase === "camera" || phase === "countdown") && (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
            <span className={cn("h-1.5 w-1.5 rounded-full", faceReady || phase === "preview" ? "bg-emerald" : "bg-amber-400")} />
            {t("kyc.faceLiveBadge")}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {phase === "idle" || phase === "error" ? (
          <Button type="button" variant="pill" disabled={disabled} onClick={() => void startCamera()}>
            <Camera className="h-4 w-4" />
            {t("kyc.faceStartCta")}
          </Button>
        ) : null}

        {phase === "camera" ? (
          <>
            <Button type="button" variant="pill" disabled={disabled || !faceReady} onClick={beginCountdown}>
              <Camera className="h-4 w-4" />
              {t("kyc.faceCapture")}
            </Button>
            <Button type="button" variant="outline" disabled={disabled} onClick={cancelCamera}>
              <X className="h-4 w-4" />
              {t("common.cancel")}
            </Button>
          </>
        ) : null}

        {phase === "preview" && value ? (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald/30 bg-emerald/10 px-3 py-2 text-xs font-semibold text-emerald">
              <CheckCircle className="h-3.5 w-3.5" />
              {t("kyc.faceCaptured")}
            </span>
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={retake}>
              <RefreshCw className="h-3.5 w-3.5" />
              {t("kyc.faceRetake")}
            </Button>
          </>
        ) : null}
      </div>

      <ul className="space-y-1.5 text-xs text-muted">
        <li className="flex gap-2">
          <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
          {t("kyc.faceTipLighting")}
        </li>
        <li className="flex gap-2">
          <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
          {t("kyc.faceTipGlasses")}
        </li>
        <li className="flex gap-2">
          <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
          {t("kyc.faceTipMatch")}
        </li>
      </ul>
    </div>
  );
}
