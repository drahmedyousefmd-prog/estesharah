import type { Metadata } from "next";
import { PortalLogin } from "@/components/login/PortalLogin";

export const metadata: Metadata = {
  title: "اختر بوابتك — Rochetta",
  alternates: { canonical: "/login" },
  robots: { index: false },
};

export default function LoginPage() {
  return <PortalLogin />;
}