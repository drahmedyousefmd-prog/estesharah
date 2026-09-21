import type { Metadata } from "next";
import { PatientHome } from "@/components/patient/PatientHome";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <PatientHome />;
}