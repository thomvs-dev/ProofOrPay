"use client";

import { useEffect, useState } from "react";

export function useTypewriter(
  text: string,
  speed = 38,
  startDelay = 600,
): { displayed: string; done: boolean } {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let index = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startId = setTimeout(() => {
      intervalId = setInterval(() => {
        index += 1;
        setDisplayed(text.slice(0, index));
        if (index >= text.length) {
          if (intervalId) clearInterval(intervalId);
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(startId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}
