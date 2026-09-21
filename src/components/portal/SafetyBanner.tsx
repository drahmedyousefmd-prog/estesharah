import { TriangleAlert } from "lucide-react";

/**
 * Non-dismissible safety disclaimer bar displayed on every patient screen.
 */
export function SafetyBanner() {
  return (
    <div className="safety-banner" role="note">
      <TriangleAlert className="safety-banner-icon" aria-hidden="true" />
      <p>
        <strong>إخلاء مسؤولية:</strong> المحتوى والردود هنا لأغراض الرجوع العامة
        ولا تُغني أبدًا عن استشارة طبيبك المعالج. أي نتيجة آلية هي مساعدة للطبيب
        فقط ولا تصل للمريض كتشخيص.
      </p>
    </div>
  );
}