import Link from "next/link";
import { BackIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-[var(--brand)]" style={{ background: "var(--brand-tint)" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
          <path d="M11 8.5v5" />
          <path d="M8.5 11h5" />
        </svg>
      </span>
      <h1 className="text-[28px] font-extrabold text-[var(--text-primary)]">
        404 — الصفحة غير موجودة
      </h1>
      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--text-secondary)]">
        الرابط الذي تحاول الوصول إليه غير صحيح أو تم نقل الصفحة. يمكنك العودة
        للرئيسية وطلب استشارتك من خدمة جديدة.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full"
        style={{ background: "var(--accent)", color: "#fff", padding: "10px 20px", fontWeight: 700, fontFamily: "var(--font-heading)" }}
      >
        <BackIcon className="h-[18px] w-[18px]" />
        العودة للرئيسية
      </Link>
    </div>
  );
}