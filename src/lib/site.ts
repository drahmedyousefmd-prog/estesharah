/**
 * Estesharah brand constants — single source for name, tagline, contact,
 * and site metadata used across components, layout, and social image.
 *
 * NOTE: SITE_URL is the FINAL public URL of THIS patient site once a custom
 * domain is chosen/configured. Until then it is a placeholder — swap the
 * value, rebuild, and redeploy. DOCTOR_SITE_URL is the doctor site
 * (Rochetta) where the /import page lives.
 */

/** Public URL of this patient site (TODO: set to the real custom domain). */
export const SITE_URL = "https://estesharah.example";

/** Doctor site (Rochetta) — hosts the /import link that lands tickets in the inbox. */
export const DOCTOR_SITE_URL = "https://drahmedyousefmd-prog.github.io";

/** localStorage key persisting the patient mode choice. */
export const MODE_KEY = "estesharah-mode";

export const SITE = {
  name: "استشارة",
  brandLine: "تواصل مع طبيبك",
  taglineAr: "بوابتك الآمنة للتواصل الطبي",
  taglineEn: "Your Trusted Medical Consultation Portal",
  heroLine: "اطلب استشارتك — ودع طبيبك يراجع حالتك ويرد عليك",
  description:
    "استشارة — منصة تواصل مباشر مع الطبيب: استشارة طبية عامة، قراءة تحاليل، مراجعة روشتة، رسم قلب، نظام غذائي وخطة علاجية. بدون تسجيل للطلب.",
  descriptionEn:
    "Estesharah — a direct patient-doctor consultation portal: general consultation, lab reading, prescription review, ECG, diet and treatment plans. No sign-up required to request.",
  themeColor: "#2d9cdb",
  backgroundColor: "#f7f5f1",
} as const;

export const CONTACT = {
  email: "dr.ahmed.yousef.md@gmail.com",
  mailtoSubmit: "mailto:dr.ahmed.yousef.md@gmail.com?subject=إضافة حالة طبية",
  gmailCompose: "https://mail.google.com/mail/?view=cm&fs=1&to=dr.ahmed.yousef.md@gmail.com",
  whatsapp: "https://wa.me/201121246814",
  phoneDisplay: "01121246814",
  linkedin: "https://www.linkedin.com/in/dr-ahmed-yousef/",
  creatorName: "د. أحمد يوسف",
  creatorRole: "الطبيب المتابع للطلبات",
} as const;