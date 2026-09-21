import type { ReactElement, SVGProps } from "react";
import {
  Brain,
  Pill,
  ShieldPlus,
  HeartPulse,
  Droplets,
  LayoutGrid,
  Search,
  Printer,
  ArrowLeft,
  Mail,
  Stethoscope,
  OctagonAlert,
  TriangleAlert,
  CircleCheck,
  ChevronDown,
  ClipboardList,
  CloudRain,
  type LucideIcon,
} from "lucide-react";
import type { ChapterIconKey } from "@/lib/types";

export function SkinIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 5.5c3-1.5 6 1.5 9 0s6 1.5 9 0" />
      <path d="M2 12c3-1.5 6 1.5 9 0s6 1.5 9 0" />
      <path d="M2 18.5c3-1.5 6 1.5 9 0s6 1.5 9 0" />
    </svg>
  );
}

export function LungsIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3.5v4" />
      <path d="M12 7.5c-1.4 0-2.7 1.2-3 2.8-.3 1.5.3 3.2 0 4.7-.5 2.5 1.1 4.8 3.5 4.8 1 0 1.8-.5 1.8-1.4V10l-2.3-2.5z" />
      <path d="M12 7.5c1.4 0 2.7 1.2 3 2.8.3 1.5-.3 3.2 0 4.7.5 2.5-1.1 4.8-3.5 4.8-1 0-1.8-.5-1.8-1.4V10l2.3-2.5z" />
    </svg>
  );
}

export function StomachIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 3.2c.8.8.8 1.4 0 2.2M13.6 2.7c.8.8.8 1.4 0 2.2" />
      <path d="M3.5 13C3.5 8.9 7.4 5 12.5 5s9 3.9 9 8c0 3.8-2.9 6.5-9 6.5S3.5 16.8 3.5 13z" />
      <path d="M5.5 19.5h14" />
    </svg>
  );
}

export function LinkedinIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="3.5" />
      <path d="M8.1 11.3v5.2" />
      <path d="M8.1 7.7v.4" />
      <path d="M12.4 16.5v-3.1c0-1.1.7-1.8 1.7-1.8s1.7.8 1.7 1.8v3.1" />
      <path d="M12.4 11.3v.2" />
    </svg>
  );
}

export function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 448 512" fill="currentColor" className={className} aria-hidden="true">
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
    </svg>
  );
}

/* ---- Chapter icon mapping ---- */

const LUCIDE_MAP: Record<string, LucideIcon> = {
  brain: Brain,
  pill: Pill,
  syringe: ShieldPlus,
  heart: HeartPulse,
  droplet: Droplets,
  grid: LayoutGrid,
};

const CUSTOM_MAP: Record<string, (p: { className?: string }) => ReactElement> = {
  jar: SkinIcon,
  lungs: LungsIcon,
  bowl: StomachIcon,
};

export function ChapterIcon({
  name,
  className = "",
}: {
  name: ChapterIconKey;
  className?: string;
}) {
  const Lucide = LUCIDE_MAP[name];
  if (Lucide) {
    return <Lucide className={className} strokeWidth={2} aria-hidden="true" />;
  }
  const Custom = CUSTOM_MAP[name];
  return <Custom className={className} />;
}

/* ---- UI icons ---- */

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

export const SearchIcon = (p: IconProps) => <Search strokeWidth={2} {...p} />;
export const PrintIcon = (p: IconProps) => <Printer strokeWidth={2} {...p} />;
export const BackIcon = (p: IconProps) => <ArrowLeft strokeWidth={2} {...p} />;
export const MailIcon = (p: IconProps) => <Mail strokeWidth={2} {...p} />;
export const StethoscopeIcon = (p: IconProps) => <Stethoscope strokeWidth={2} {...p} />;
export const ChevronDownIcon = (p: IconProps) => <ChevronDown strokeWidth={2} {...p} />;
export const OctagonAlertIcon = (p: IconProps) => <OctagonAlert strokeWidth={2} {...p} />;
export const TriangleAlertIcon = (p: IconProps) => <TriangleAlert strokeWidth={2} {...p} />;
export const CircleCheckIcon = (p: IconProps) => <CircleCheck strokeWidth={2} {...p} />;
export const PillIcon = (p: IconProps) => <Pill strokeWidth={2} {...p} />;
export const CloudRainIcon = (p: IconProps) => <CloudRain strokeWidth={2} {...p} />;
export const ClipboardListIcon = (p: IconProps) => <ClipboardList strokeWidth={2} {...p} />;

/* ---- Rochetta brand mark ---- */

/**
 * Rochetta glyph — a heartbeat pulse with a capsule resting on the plateau.
 * Inherits `currentColor`; designed for nav chips and avatars (tint surfaces).
 */
export function LogoGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.5 12h4.5l2.5-4.5 3 9 2-4.5h7" />
      <g transform="rotate(-12 17.8 12)">
        <rect
          x="15.6"
          y="10.8"
          width="4.4"
          height="2.4"
          rx="1.2"
          fill="currentColor"
          stroke="none"
        />
      </g>
    </svg>
  );
}

/**
 * Full Rochetta logo — teal tile + white pulse + capsule.
 * `variant="light"` swaps to a white tile with teal glyph (for dark/teal
 * surfaces such as the Open Graph image backgrounds).
 */
export function LogoMark({
  className = "",
  variant = "brand",
}: {
  className?: string;
  variant?: "brand" | "light";
}) {
  const tile = variant === "light" ? "#ffffff" : "var(--brand, #1f5b54)";
  const glyph = variant === "light" ? "var(--brand, #1f5b54)" : "#ffffff";
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="2" y="2" width="60" height="60" rx="14" fill={tile} />
      <g stroke={glyph} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M10 36h12l5-9 6 14 3.5-9H52" />
      </g>
      <g transform="rotate(-12 46.5 32)">
        <rect x="41" y="29.2" width="11" height="5.6" rx="2.8" fill={glyph} />
      </g>
    </svg>
  );
}