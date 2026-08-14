import { useEffect } from "react";

import type { NormalizedPoint } from "@/photobooth/types";

const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";
const FACE_LANDMARKER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export function useFaceLandmarker(params: {
  video: HTMLVideoElement | null;
  enabled: boolean;
  onLandmarks: (landmarks: NormalizedPoint[] | null) => void;
  onStatusChange?: (status: { loading: boolean; error: string }) => void;
}) {
  const { video, enabled, onLandmarks, onStatusChange } = params;

  useEffect(() => {
    if (!enabled || !video) {
      onLandmarks(null);
      return;
    }

    let active = true;
    let animationFrame = 0;
    let lastVideoTime = -1;
    let landmarker: { detectForVideo: typeof Function; close: () => void } | null = null;

    const run = async () => {
      try {
        onStatusChange?.({ loading: true, error: "" });
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
        landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: FACE_LANDMARKER_MODEL,
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });

        onStatusChange?.({ loading: false, error: "" });

        const detectFrame = () => {
          if (!active || !landmarker || !video) {
            return;
          }

          if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            const result = landmarker.detectForVideo(video, performance.now());
            const nextLandmarks = result.faceLandmarks[0];
            onLandmarks(
              nextLandmarks
                ? nextLandmarks.map((point) => ({ x: point.x, y: point.y, z: point.z }))
                : null,
            );
          }

          animationFrame = window.requestAnimationFrame(detectFrame);
        };

        detectFrame();
      } catch (caughtError) {
        if (active) {
          onLandmarks(null);
          onStatusChange?.({
            loading: false,
            error:
              caughtError instanceof Error
                ? caughtError.message
                : "AR face tracking could not be initialized.",
          });
        }
      }
    };

    void run();

    return () => {
      active = false;
      window.cancelAnimationFrame(animationFrame);
      onLandmarks(null);
      onStatusChange?.({ loading: false, error: "" });
      landmarker?.close();
    };
  }, [enabled, onLandmarks, onStatusChange, video]);
}
