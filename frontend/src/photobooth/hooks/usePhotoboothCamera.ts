import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

type CameraDevice = {
  deviceId: string;
  label: string;
};

export function usePhotoboothCamera(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
) {
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!enabled) {
      setIsReady(false);
      setError("");
      if (videoElement) {
        videoElement.srcObject = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    let cancelled = false;

    const start = async () => {
      try {
        setLoading(true);
        setError("");
        setIsReady(false);

        const nextStream = await navigator.mediaDevices.getUserMedia({
          video: selectedDeviceId
            ? {
                deviceId: { exact: selectedDeviceId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              }
            : {
                facingMode: "user",
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
          audio: false,
        });

        if (cancelled) {
          nextStream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        streamRef.current = nextStream;

        if (videoElement) {
          videoElement.srcObject = nextStream;
          await videoElement.play().catch(() => undefined);
        }

        const discoveredDevices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) {
          const availableVideoDevices = discoveredDevices
            .filter((device) => device.kind === "videoinput")
            .map((device, index) => ({
              deviceId: device.deviceId,
              label: device.label || `Camera ${index + 1}`,
            }));

          setDevices(availableVideoDevices);
          if (!selectedDeviceId && availableVideoDevices[0]?.deviceId) {
            const preferred =
              availableVideoDevices.find((device) => /front|facetime|user/i.test(device.label)) ??
              availableVideoDevices[0];
            setSelectedDeviceId(preferred.deviceId);
          }
          setIsReady(true);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Photobooth camera is unavailable.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (videoElement) {
        videoElement.pause();
        videoElement.srcObject = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [enabled, selectedDeviceId, videoRef]);

  const deviceLabel = useMemo(
    () => devices.find((device) => device.deviceId === selectedDeviceId)?.label ?? "Auto camera",
    [devices, selectedDeviceId],
  );

  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    loading,
    error,
    isReady,
    deviceLabel,
  };
}
