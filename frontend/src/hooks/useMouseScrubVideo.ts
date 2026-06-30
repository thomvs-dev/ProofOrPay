"use client";

import { useCallback, useEffect, useRef } from "react";

const SENSITIVITY = 0.8;

export function computeScrubDelta(
  deltaX: number,
  innerWidth: number,
  duration: number,
): number {
  if (innerWidth <= 0 || duration <= 0) return 0;
  return (deltaX / innerWidth) * SENSITIVITY * duration;
}

export function clampTime(time: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.min(Math.max(time, 0), duration);
}

export function useMouseScrubVideo(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled = true,
) {
  const prevXRef = useRef<number | null>(null);
  const targetTimeRef = useRef(0);
  const seekingRef = useRef(false);

  const seekToTarget = useCallback(() => {
    const video = videoRef.current;
    if (!video || seekingRef.current) return;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;

    seekingRef.current = true;
    video.currentTime = clampTime(targetTimeRef.current, video.duration);
  }, [videoRef]);

  const handleSeeked = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    seekingRef.current = false;
    const clamped = clampTime(targetTimeRef.current, video.duration);
    if (Math.abs(video.currentTime - clamped) > 0.01) {
      seekToTarget();
    }
  }, [seekToTarget, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !enabled) return;

    const onLoaded = () => {
      targetTimeRef.current = 0;
      video.currentTime = 0;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      const prevX = prevXRef.current;
      prevXRef.current = e.clientX;
      if (prevX === null) return;

      const delta = e.clientX - prevX;
      targetTimeRef.current = clampTime(
        targetTimeRef.current + computeScrubDelta(delta, window.innerWidth, video.duration),
        video.duration,
      );

      if (!seekingRef.current) {
        seekToTarget();
      }
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("seeked", handleSeeked);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("seeked", handleSeeked);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [enabled, handleSeeked, seekToTarget, videoRef]);

  return { SENSITIVITY };
}
