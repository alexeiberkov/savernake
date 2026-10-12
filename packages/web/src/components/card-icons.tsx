import type { Food } from "@savernake/shared";

/** Fan-made SVG icons — not publisher art. */
export function FoodIcon({ food, className }: { food: Food; className?: string }) {
  switch (food) {
    case "berries":
      return (
        <svg className={className} viewBox="0 0 32 32" aria-hidden>
          <ellipse cx="16" cy="18" rx="9" ry="10" fill="#c23b3b" />
          <ellipse cx="12" cy="15" rx="3" ry="3.5" fill="#e85a5a" opacity="0.55" />
          <path
            d="M16 6c2 3 5 4 7 4-2 1-4 4-5 7-1-3-3-5-6-6 2 0 3-2 4-5z"
            fill="#3d7a3a"
          />
        </svg>
      );
    case "worms":
      return (
        <svg className={className} viewBox="0 0 32 32" aria-hidden>
          <path
            d="M8 22c2-6 4-8 8-8s5 4 8 2c1 4-1 8-5 9-5 1-9-1-11-3z"
            fill="#e0919a"
          />
          <path
            d="M10 18c2-2 4-3 7-2M14 22c2-1 4-1 6 0"
            stroke="#b85f6a"
            strokeWidth="1.2"
            fill="none"
          />
          <circle cx="22" cy="14" r="1.2" fill="#3a2030" />
        </svg>
      );
    case "eggs":
      return (
        <svg className={className} viewBox="0 0 32 32" aria-hidden>
          <ellipse cx="16" cy="17" rx="8" ry="11" fill="#f3e6c8" />
          <ellipse cx="13" cy="14" rx="2.5" ry="3" fill="#fff8e8" opacity="0.7" />
          <ellipse cx="18" cy="20" rx="1.6" ry="1.2" fill="#d9c49a" />
        </svg>
      );
    case "nuts":
      return (
        <svg className={className} viewBox="0 0 32 32" aria-hidden>
          <ellipse cx="16" cy="18" rx="8" ry="9" fill="#8b5a2b" />
          <path d="M10 14c3-2 9-2 12 0" stroke="#5c3818" strokeWidth="1.4" fill="none" />
          <path d="M16 8v4M14 9l2 2 2-2" stroke="#3d7a3a" strokeWidth="1.6" fill="none" />
          <ellipse cx="13" cy="17" rx="2" ry="2.5" fill="#a8723a" opacity="0.5" />
        </svg>
      );
  }
}

export function LeafVpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden>
      <path
        d="M16 4c8 4 12 10 12 16-6 2-12 2-16 0C8 14 10 8 16 4z"
        fill="#c23b3b"
      />
      <path
        d="M16 6c0 8-1 14-4 20"
        stroke="#7a1f1f"
        strokeWidth="1.3"
        fill="none"
      />
      <path
        d="M16 10c3 2 6 5 8 9M16 14c2 2 4 4 5 7"
        stroke="#e87878"
        strokeWidth="1"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}

export function BurrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 28" aria-hidden>
      <ellipse cx="10" cy="16" rx="8" ry="7" fill="#7a7268" />
      <ellipse cx="30" cy="17" rx="7" ry="6" fill="#6a635a" />
      <ellipse cx="20" cy="14" rx="10" ry="9" fill="#8a8278" />
      <ellipse cx="20" cy="14" rx="5" ry="4.5" fill="#4a433c" />
    </svg>
  );
}

export function DropletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 20" aria-hidden>
      <path
        d="M8 1c4 6 7 9 7 12a7 7 0 1 1-14 0C1 10 4 7 8 1z"
        fill="#5eb0d4"
        stroke="#2a6a88"
        strokeWidth="0.8"
      />
    </svg>
  );
}

export function CaveTokenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 16" aria-hidden>
      <path
        d="M2 14 L10 2 L18 14 Z"
        fill="#c4a882"
        stroke="#5c3d2e"
        strokeWidth="1"
      />
      <path d="M7 14c1-3 5-3 6 0" fill="#3a2a1c" />
    </svg>
  );
}
