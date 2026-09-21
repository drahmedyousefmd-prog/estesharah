import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SERVICES } from "@/lib/services";
import { handleTransitionNav } from "@/lib/transition";

/**
 * The 6 patient service cards — public on the landing page. Clicking one
 * opens the request form directly (guest flow, no login needed).
 */
export function PatientServices({
  id = "services",
  heading = "خدمات المريض",
}: {
  id?: string;
  heading?: string;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      <h2 className="section-heading">{heading}</h2>
      <p className="section-sub mb-6">
        اطلب استشارتك أو حمّل روشتتك وتحليلَتِك — تُنشأ تذكرة ويرد الطبيب عليك هنا أو بالبريد
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => (
          <Link
            key={s.type}
            href={`/new/${s.type}`}
            className="category-card card"
            style={{ "--cat": s.color } as CSSProperties}
            onClick={handleTransitionNav}
          >
            <div className="cat-icon">
              <s.icon className="h-6 w-6" />
            </div>
            <span className="text-[18px] font-bold leading-tight text-[var(--text-primary)]">
              {s.title}
            </span>
            <span className="text-[13px] leading-snug text-[var(--text-secondary)]">
              {s.short}
            </span>
            <span className="mt-1 text-[12px] font-bold text-[var(--text-muted)]">
              <ArrowLeft className="mr-1 inline h-3 w-3" aria-hidden="true" />
              ابدأ الطلب
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}