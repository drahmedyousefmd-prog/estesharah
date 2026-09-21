import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SERVICES, serviceByType } from "@/lib/services";
import { ServiceForm } from "@/components/patient/ServiceForm";

export const metadata: Metadata = {
  robots: { index: false },
  alternates: { canonical: "/new" },
};

export function generateStaticParams() {
  return SERVICES.map((s) => ({ serviceType: s.type }));
}

export default async function NewRequestPage({
  params,
}: {
  params: Promise<{ serviceType: string }>;
}) {
  const { serviceType } = await params;
  const def = serviceByType(serviceType);
  if (!def) notFound();

  return <ServiceForm serviceType={def.type} />;
}