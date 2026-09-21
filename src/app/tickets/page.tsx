import type { Metadata } from "next";
import { PatientTicketsApp } from "@/components/patient/PatientTicketsApp";

export const metadata: Metadata = {
  title: "تذاكري",
  robots: { index: false },
  alternates: { canonical: "/tickets" },
};

export default function TicketsPage() {
  return <PatientTicketsApp />;
}