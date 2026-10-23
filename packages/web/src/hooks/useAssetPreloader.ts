import { useEffect, useState } from "react";
import { PLACEHOLDER_PATHS, PLACEHOLDER_ANIMALS } from "@savernake/shared";

function getAllImageUrls(): string[] {
  const paths = PLACEHOLDER_PATHS.map((c) => `/paths/${c.id}.png`);
  const animals = PLACEHOLDER_ANIMALS.map((c) => `/animals/${c.artSlug}.png`);
  return ["/advisors/board.jpg", ...paths, ...animals];
}

const URLS = getAllImageUrls();

export type PreloadState = {
  loaded: number;
  total: number;
  done: boolean;
  progress: number; // 0–1
};

/** Preloads all game card images once; result is stable after first call. */
export function useAssetPreloader(): PreloadState {
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    let count = 0;

    URLS.forEach((url) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        count += 1;
        setLoaded(count);
      };
      img.src = url;
    });
  }, []);

  const done = loaded >= URLS.length;
  return {
    loaded,
    total: URLS.length,
    done,
    progress: URLS.length > 0 ? loaded / URLS.length : 1,
  };
}
