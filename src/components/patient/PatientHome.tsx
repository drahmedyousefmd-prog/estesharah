"use client";

import Link from "next/link";
import { usePortal } from "@/lib/portal-store";
import { DOCTOR_SITE_URL } from "@/lib/site";
import { PortalTopbar } from "../portal/PortalTopbar";
import { SafetyBanner } from "../portal/SafetyBanner";
import { PatientServices } from "./PatientServices";

/**
 * Public patient entry: ONLY the six request-service cards.
 * Deliberately imports no medical/reference or categories code at all —
 * nothing drug/prescription related lives on /patient.
 */
export function PatientHome() {
  const { user } = usePortal();

  return (
    <div className="min-h-dvh" id="top">
      <PortalTopbar
        title="بوابة المريض"
        hideLogout={!user}
        links={
          <>
            <a href="#services" className="portal-topbar-link">
              الخدمات
            </a>
            <Link href="/tickets" className="portal-topbar-link">
              تذاكري
            </Link>
          </>
        }
      />
      <SafetyBanner />

      <main className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-10 sm:px-6">
        <PatientServices heading="اطلب خدمة" />

        {!user && (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-start">
            <p className="text-[13px] font-bold text-[var(--text-primary)]">
              لا تحتاج حسابًا للطلب — كل بطاقة تفتح نموذج الطلب مباشرة.
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
              عند الإرسال يُحفظ طلبك على هذا الجهاز ويمكنك متابعته في «تذاكري». إنشاء حساب
              اختياري يساعدك في الوصول لطلباتك من أي جهاز.
            </p>
          </div>
        )}

        <footer className="mt-10 border-t border-[var(--border)] pb-2 pt-6 text-center">
          <a
            href={`${DOCTOR_SITE_URL}/login`}
            className="text-[13px] font-bold text-[var(--text-muted)] transition hover:text-[var(--accent)]"
          >
            أنا طبيب — تسجيل الدخول
          </a>
        </footer>
      </main>
    </div>
  );
}