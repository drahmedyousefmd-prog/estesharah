import {
  Activity,
  Apple,
  ClipboardList,
  FileText,
  FlaskConical,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

export type ServiceType =
  | "general_consultation"
  | "lab_reading"
  | "prescription_reading"
  | "ecg_reading"
  | "diet_plan"
  | "treatment_plan";

export type TicketStatus = "pending" | "answered" | "closed";

export type ServiceFieldType = "text" | "textarea" | "number" | "select" | "file";

export interface ServiceFieldOption {
  value: string;
  label: string;
}

export interface ServiceField {
  name: string;
  label: string;
  type: ServiceFieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: ServiceFieldOption[];
}

export interface ServiceDef {
  type: ServiceType;
  icon: LucideIcon;
  title: string;
  short: string;
  description: string;
  color: string;
  fields: ServiceField[];
  /** Appears on the general consultation form only — blocks submission if any is checked. */
  emergencyChecklist?: string[];
  /** Assistive engine attached to the doctor-side raw output (never shown to the patient). */
  engine?: "ocr_prescription_engine" | "ecg_reading_engine";
}

export const SERVICES: ServiceDef[] = [
  {
    type: "general_consultation",
    icon: Stethoscope,
    title: "استشارة طبية عامة",
    short: "وصف شكواك واحصل على توجيه طبي مبدئي",
    description:
      "اكتب الأعراض بالتفصيل وسيتابعها الطبيب في أقرب وقت. لا تشارك بيانات حساسة عموماً — هذه بوابة تجريبية.",
    color: "#3e7ea6",
    fields: [
      {
        name: "symptoms",
        label: "الشكوى / الأعراض بالتفصيل",
        type: "textarea",
        required: true,
        placeholder: "متى بدأت الأعراض؟ شدتها؟ هل تناولت أي دواء؟…",
      },
      {
        name: "photo",
        label: "أرفق أي صور مساعدة (اختياري)",
        type: "file",
        hint: "تحاليل سابقة، صور حبوب، تقارير…",
      },
    ],
    emergencyChecklist: [
      "ألم أو ضغط قوي في الصدر",
      "صعوبة شديدة في التنفس",
      "نزيف حاد أو فقدان وعي",
      "ضعف مفاجئ أو تنميل في نصف الجسم",
    ],
  },
  {
    type: "lab_reading",
    icon: FlaskConical,
    title: "قراءة تحليل",
    short: "أرفق نتيجة التحليل ليراجعها الطبيب",
    description: "أرفق صورة أو PDF لنتيجة التحليل واكتب أي ملاحظات. يقرأها الطبيب ويشرحها لك.",
    color: "#7a8c3f",
    fields: [
      {
        name: "file",
        label: "صورة أو PDF للتحليل",
        type: "file",
        required: true,
      },
      {
        name: "notes",
        label: "ملاحظات (تاريخ التحليل، هل كنت صائمًا…)",
        type: "textarea",
        placeholder: "اختياري",
      },
    ],
  },
  {
    type: "prescription_reading",
    icon: FileText,
    title: "اقرألي الروشتة",
    short: "صوّر الروشتة وسيقرأها لك الطبيب",
    description:
      "صوّر الروشتة بوضوح (يفضَّل في ضوء جيد). المرفق يمر عبر محرك قراءة آلي كمساعد للطبيب فقط — لا تُرسل النتيجة الآلية للمريض أبدًا.",
    color: "#6e5db3",
    engine: "ocr_prescription_engine",
    fields: [
      {
        name: "file",
        label: "صورة الروشتة",
        type: "file",
        required: true,
        hint: "صورة واحدة واضحة — لا تُمرَّر أي نتيجة آلية للمريض",
      },
      {
        name: "notes",
        label: "ملاحظات (اختياري)",
        type: "textarea",
        placeholder: "مثال: الروشتة لطفل عمره 6 سنوات",
      },
    ],
  },
  {
    type: "ecg_reading",
    icon: Activity,
    title: "رسم قلب (ECG)",
    short: "أرفق صورة رسم القلب لمراجعتها",
    description:
      "أرفق صورة واضحة لشريط رسم القلب. يُمرَّر المرفق عبر محرك قراءة آلي كمساعد فقط — والتشخيص على الطبيب.",
    color: "#b23b3b",
    engine: "ecg_reading_engine",
    fields: [
      {
        name: "file",
        label: "صورة شريط رسم القلب",
        type: "file",
        required: true,
      },
      {
        name: "notes",
        label: "ملاحظات (اختياري)",
        type: "textarea",
      },
    ],
  },
  {
    type: "diet_plan",
    icon: Apple,
    title: "نظام غذائي",
    short: "خطة تغذية تناسب هدفك",
    description: "أدخل بياناتك الأساسية وهدفك ليضع الطبيب نظامًا غذائيًا مناسبًا.",
    color: "#4a8b7c",
    fields: [
      { name: "age", label: "العمر", type: "number", required: true },
      { name: "weight", label: "الوزن (كجم)", type: "number", required: true },
      { name: "height", label: "الطول (سم)", type: "number", required: true },
      {
        name: "goal",
        label: "الهدف",
        type: "select",
        required: true,
        options: [
          { value: "lose", label: "إنقاص وزن" },
          { value: "gain", label: "زيادة وزن" },
          { value: "diabetes", label: "تنظيم سكر" },
          { value: "maintain", label: "صيانة عامة" },
        ],
      },
      {
        name: "allergies",
        label: "حساسية أو أطعمة ممنوعة (اختياري)",
        type: "textarea",
      },
    ],
  },
  {
    type: "treatment_plan",
    icon: ClipboardList,
    title: "خطة علاجية",
    short: "لحالة تشخيصية معروفة ومتابعتها",
    description: "اكتب التشخيص المعروف والأدوية الحالية ليقترح الطبيب خطة متابعة مناسبة.",
    color: "#c1652b",
    fields: [
      {
        name: "condition",
        label: "الحالة / التشخيص المعروف",
        type: "textarea",
        required: true,
      },
      {
        name: "drugs",
        label: "الأدوية الحالية (اختياري)",
        type: "textarea",
      },
    ],
  },
];

export function serviceByType(type: string): ServiceDef | undefined {
  return SERVICES.find((s) => s.type === type);
}

/** Inbox filter tabs for the doctor, in display order. */
export const SERVICE_TABS = SERVICES.map((s) => ({
  type: s.type,
  label: s.title,
}));

export function serviceLabel(type: ServiceType): string {
  return serviceByType(type)?.title ?? type;
}

export function statusLabel(status: TicketStatus): string {
  switch (status) {
    case "pending":
      return "بانتظار الرد";
    case "answered":
      return "تم الرد";
    case "closed":
      return "مُغلقة";
  }
}