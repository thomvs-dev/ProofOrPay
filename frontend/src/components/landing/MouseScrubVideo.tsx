"use client";

import { useEffect, useRef, useState } from "react";
import { useMouseScrubVideo } from "@/hooks/useMouseScrubVideo";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4";

export function MouseScrubVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scrubEnabled, setScrubEnabled] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setScrubEnabled(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useMouseScrubVideo(videoRef, scrubEnabled);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || scrubEnabled) return;
    video.currentTime = 0;
  }, [scrubEnabled]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover object-[70%_center]"
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
      />
      <div className="absolute inset-0 landing-gradient-overlay" />
    </div>
  );
}
