"use client";

import { MouseScrubVideo } from "@/components/landing/MouseScrubVideo";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";

export default function LandingPage() {
  return (
    <>
      <MouseScrubVideo />
      <LandingNavbar />
      <LandingHero />
    </>
  );
}