"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { LogoGlyph } from "../icons";
import { SITE } from "@/lib/site";
import { logout } from "@/lib/portal-store";

export function PortalTopbar({
  title,
  links,
  right,
  hideLogout = false,
}: {
  title: string;
  links?: ReactNode;
  right?: ReactNode;
  hideLogout?: boolean;
}) {
  const router = useRouter();

  const onLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="portal-topbar no-print">
      <Link href="/" className="site-logo" aria-label={`${SITE.name} — الرئيسية`}>
        <span className="site-logo-chip">
          <LogoGlyph className="h-5 w-5" />
        </span>
        {SITE.name}
        <span className="portal-topbar-title">{title}</span>
      </Link>
      <nav className="portal-topbar-links">
        {links}
        {right}
        {!hideLogout && (
          <button type="button" className="portal-topbar-action" onClick={onLogout}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            خروج
          </button>
        )}
      </nav>
    </header>
  );
}