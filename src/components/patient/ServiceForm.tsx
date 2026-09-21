"use client";

import { useRef, useState, useMemo } from "react";
import Link from "next/link";
import { TriangleAlert, UploadCloud, CheckCircle2 } from "lucide-react";
import type { ServiceType } from "@/lib/services";
import { SERVICES } from "@/lib/services";
import { CONTACT, SITE, DOCTOR_SITE_URL } from "@/lib/site";
import { MailIcon, WhatsAppIcon } from "@/components/icons";
import type { Attachment } from "@/lib/portal-store";
import { createTicket, encodeTicketPayload, usePortal } from "@/lib/portal-store";
import { PortalTopbar } from "../portal/PortalTopbar";
import { SafetyBanner } from "../portal/SafetyBanner";

interface FieldValue {
  value: string;
  file?: Attachment;
}

interface SelectedFile {
  type: "image" | "pdf";
  name: string;
  url: string;
}

export function ServiceForm({ serviceType }: { serviceType: ServiceType }) {
  const service = useMemo(() => SERVICES.find((s) => s.type === serviceType)!, [serviceType]);
  const { user } = usePortal();
  const [contactName, setContactName] = useState(user?.name ?? "");
  const [contactIdentifier, setContactIdentifier] = useState(user?.identifier ?? "");
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [checkedEmergency, setCheckedEmergency] = useState<string[]>([]);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [forwardText, setForwardText] = useState("");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const setField = (name: string, value: string) =>
    setValues((prev) => ({
      ...prev,
      [name]: { ...(prev[name] ?? { value: "" }), value },
    } as Record<string, FieldValue>));

  const readFile = (name: string, f?: File) => {
    setFileError(null);
    if (!f) {
      setValues((prev) => ({
        ...prev,
        [name]: { ...(prev[name] ?? { value: "" }), file: undefined, value: "" } as FieldValue,
      } as Record<string, FieldValue>));
      return;
    }
    if (f.size > 2.5 * 1024 * 1024) {
      setFileError("حجم الملف كبير — أرفق صورة أقل من 2.5 ميجابايت");
      if (fileRefs.current[name]) fileRefs.current[name].value = "";
      return;
    }
    const isPdf = f.type === "application/pdf";
    if (!isPdf && !f.type.startsWith("image/")) {
      setFileError("المرفق يجب أن يكون صورة أو PDF");
      if (fileRefs.current[name]) fileRefs.current[name].value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const selected: SelectedFile = {
        type: isPdf ? "pdf" : "image",
        name: f.name,
        url: String(reader.result),
      };
      setValues((prev) => ({
        ...prev,
        [name]: { ...(prev[name] ?? { value: "" }), file: selected, value: f.name } as FieldValue,
      } as Record<string, FieldValue>));
    };
    reader.readAsDataURL(f);
  };

  const toggleEmergency = (item: string) =>
    setCheckedEmergency((cur) =>
      cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item]
    );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (service.emergencyChecklist && checkedEmergency.length > 0) {
      setEmergencyTriggered(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const identifier = contactIdentifier.trim().toLowerCase();
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(identifier);
    const phoneOk = /^[0-9+\s().-]{8,15}$/.test(identifier);
    if (!emailOk && !phoneOk) {
      setError("أدخل بريدًا إلكترونيًا أو رقم موبايل للتواصل معك بالرد");
      return;
    }

    const notes: string[] = [];
    for (const field of service.fields) {
      const v = values[field.name];
      if (field.type === "file") {
        if (field.required && !v?.file) {
          setError(`أرفق ${field.label}`);
          return;
        }
        continue;
      }
      const raw = (v?.value ?? "").trim();
      if (field.required && !raw) {
        setError(`أكمل حقل: ${field.label}`);
        return;
      }
      if (raw) notes.push(`${field.label}: ${raw}`);
    }

    const attachments: Attachment[] = service.fields
      .map((f) => values[f.name]?.file)
      .filter((x): x is Attachment => Boolean(x));

    if (attachments.length === 0 && service.fields.some((f) => f.type === "file" && f.required)) {
      setError("الرجاء إرفاق الملف المطلوب");
      return;
    }

    const ticket = createTicket({
      serviceType: service.type,
      patientNotes: notes.join("\n") || "—",
      attachments,
      name: contactName.trim() || undefined,
      identifier,
    });
    if (ticket) {
      setTicketId(ticket.ticket_id);
      const importUrl = `${DOCTOR_SITE_URL}/import?t=${encodeTicketPayload({
        id: ticket.ticket_id,
        t: service.type,
        n: notes.join("\n") || "—",
        nm: contactName.trim() || undefined,
        c: identifier,
        d: ticket.created_at,
      })}`;
      const body = [
        `طلب جديد عبر ${SITE.name}`,
        `الخدمة: ${service.title}`,
        contactName.trim() ? `الاسم: ${contactName.trim()}` : null,
        `التواصل: ${identifier}`,
        `رقم التذكرة: ${ticket.ticket_id}`,
        "",
        "التفاصيل:",
        notes.join("\n") || "—",
        "",
        "لحفظ الطلب في صندوق طلبات المرضى اضغط الرابط التالي:",
        importUrl,
      ]
        .filter((x): x is string => Boolean(x))
        .join("\n");
      setForwardText(body);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError("تعذّر إنشاء الطلب — حاول مرة أخرى");
    }
  };

  const Icon = service.icon;
  const inputCls =
    "w-full rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none";

  return (
    <div className="min-h-dvh" id="top">
      <PortalTopbar
        title="طلب جديد"
        links={
          <Link href="/" className="portal-topbar-link">
            الصفحة الرئيسية
          </Link>
        }
      />
      <SafetyBanner />

      <main className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-8 sm:px-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-[13px] font-bold text-[var(--text-secondary)] transition hover:text-[var(--accent)]"
        >
          → العودة للخدمات
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <span className="cat-icon" style={{ background: `${service.color}16`, color: service.color }}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-[22px] font-extrabold text-[var(--text-primary)]">{service.title}</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">{service.description}</p>
          </div>
        </div>

        {emergencyTriggered && (
          <section
            className="mb-6 rounded-2xl border border-[color-mix(in srgb,var(--status-danger)_40%,transparent)] bg-[color-mix(in srgb,var(--status-danger)_7%,transparent)] p-5"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-6 w-6 shrink-0 text-[var(--status-danger)]" aria-hidden="true" />
              <div>
                <h2 className="text-[17px] font-extrabold text-[var(--status-danger)]">
                  لا تُكمل إرسال هذا الطلب
                </h2>
                <p className="mt-1 text-[14px] leading-relaxed text-[var(--text-primary)]">
                  الأعراض التي علّمت عليها ({checkedEmergency.length}) قد تكون حالة طارئة.
                  <strong> توجّه فورًا لأقرب قسم طوارئ</strong> أو اطلب الإسعاف. لا ننشئ تذكرة
                  عادية لمثل هذه الحالات.
                </p>
                <ul className="mt-3 list-inside list-disc space-y-1 text-[14px] text-[var(--text-primary)]">
                  {checkedEmergency.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {done && ticketId ? (
          <section className="rounded-2xl border border-[color-mix(in srgb,var(--status-safe)_35%,transparent)] bg-[color-mix(in srgb,var(--status-safe)_7%,transparent)] p-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[var(--status-safe)]" aria-hidden="true" />
            <h2 className="text-[18px] font-extrabold text-[var(--text-primary)]">
              تم إنشاء الطلب بنجاح
            </h2>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
              رقم التذكرة: <b dir="ltr">{ticketId}</b> — سيقوم الطبيب بالرد خلال أقرب وقت.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/tickets" className="btn-pill primary">
                متابعة في تذاكري
              </Link>
            </div>

            <div className="mt-5 rounded-xl border border-dashed border-[var(--accent)] bg-[color-mix(in srgb,var(--accent)_6%,transparent)] px-4 py-3 text-start">
              <p className="text-[13px] font-bold text-[var(--text-primary)]">
                إرسال نسخة الطلب إلى الطبيب
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                اضغط أحد الزرين فيفتح تطبيق الرسائل جاهزًا بالإرسال إلى {CONTACT.creatorName}.
                المرفقات تبقى محفوظة في «تذاكري» ولا تُرسل مع النسخة.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  className="btn-pill"
                  style={{ background: "#25d366", color: "#fff", border: "none" }}
                  href={`${CONTACT.whatsapp}?text=${encodeURIComponent(forwardText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  إرسال عبر واتساب
                </a>
                <a
                  className="btn-pill primary"
                  href={`${CONTACT.gmailCompose}&su=${encodeURIComponent(`طلب استشارة عبر Rochetta — ${ticketId}`)}&body=${encodeURIComponent(forwardText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MailIcon className="h-4 w-4" />
                  إرسال عبر جيميل
                </a>
              </div>
            </div>

            {!user && (
              <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-start">
                <p className="text-[13px] font-bold text-[var(--text-primary)]">
                  هل تريد إنشاء حساب؟
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                  لحفظ طلباتك والوصول إليها من أي جهاز. إنشاء الحساب اختياري — سيتم ربط
                  الطلبات التي أرسلتَها من هذا الجهاز بحسابك تلقائيًا.
                </p>
                <Link
                  href="/login"
                  className="mt-3 inline-flex items-center gap-1 rounded-full border border-[var(--accent)] px-4 py-1.5 text-[13px] font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
                >
                  إنشاء حساب لاحقًا
                </Link>
              </div>
            )}
          </section>
        ) : (
          <form onSubmit={onSubmit} className="card flex flex-col gap-4 p-6">
            {error && (
              <p className="rounded-xl border border-[color-mix(in srgb,var(--status-danger)_35%,transparent)] bg-[color-mix(in srgb,var(--status-danger)_8%,transparent)] px-4 py-2.5 text-[14px] font-bold text-[var(--status-danger)]">
                {error}
              </p>
            )}
            {fileError && (
              <p className="rounded-xl border border-[color-mix(in srgb,var(--status-warning)_35%,transparent)] bg-[color-mix(in srgb,var(--status-warning)_8%,transparent)] px-4 py-2.5 text-[14px] font-bold text-[var(--status-warning)]">
                {fileError}
              </p>
            )}

            <p className="text-[13px] text-[var(--text-secondary)]">
              بيانات الاتصال — تُستخدم للرد عليك فقط (لست بحاجة لتسجيل دخول).
              {user?.name ? " نعرفك بالفعل — عدّل إن لزم." : ""}
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="text-[14px] font-bold text-[var(--text-primary)]">
                الاسم <span className="font-normal text-[var(--text-muted)]">(اختياري)</span>
              </span>
              <input
                className={inputCls}
                placeholder="الاسم"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                aria-label="الاسم (اختياري)"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[14px] font-bold text-[var(--text-primary)]">
                بريد إلكتروني أو رقم موبايل <b className="text-[var(--status-danger)]"> *</b>
              </span>
              <input
                className={inputCls}
                dir="ltr"
                placeholder="example@mail.com أو 20xxxxxxxxx"
                value={contactIdentifier}
                onChange={(e) => setContactIdentifier(e.target.value)}
                aria-label="بريد إلكتروني أو رقم موبايل"
              />
            </label>

            {service.fields.map((field) => (
              <label key={field.name} className="flex flex-col gap-1.5">
                <span className="text-[14px] font-bold text-[var(--text-primary)]">
                  {field.label}
                  {field.required && <b className="text-[var(--status-danger)]"> *</b>}
                </span>
                {field.type === "textarea" && (
                  <textarea
                    className={`${inputCls} min-h-[96px] resize-y`}
                    placeholder={field.placeholder}
                    value={values[field.name]?.value ?? ""}
                    onChange={(e) => setField(field.name, e.target.value)}
                    required={field.required}
                  />
                )}
                {field.type === "text" && (
                  <input
                    className={inputCls}
                    placeholder={field.placeholder}
                    value={values[field.name]?.value ?? ""}
                    onChange={(e) => setField(field.name, e.target.value)}
                    required={field.required}
                  />
                )}
                {field.type === "number" && (
                  <input
                    className={inputCls}
                    type="number"
                    inputMode="numeric"
                    placeholder={field.placeholder}
                    value={values[field.name]?.value ?? ""}
                    onChange={(e) => setField(field.name, e.target.value)}
                    required={field.required}
                  />
                )}
                {field.type === "select" && field.options && (
                  <select
                    className={inputCls}
                    value={values[field.name]?.value ?? ""}
                    onChange={(e) => setField(field.name, e.target.value)}
                    required={field.required}
                  >
                    <option value="">اختر…</option>
                    {field.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
                {field.type === "file" && (
                  <>
                    <input
                      ref={(el) => {
                        fileRefs.current[field.name] = el;
                      }}
                      className="portal-file-input"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => readFile(field.name, e.target.files?.[0])}
                    />
                    {values[field.name]?.file && (
                      <span className="text-[12px] font-bold text-[var(--status-safe)]">
                        ✓ {values[field.name]?.file?.name}
                      </span>
                    )}
                  </>
                )}
                {field.hint && (
                  <span className="text-[12px] text-[var(--text-muted)]">{field.hint}</span>
                )}
              </label>
            ))}

            {service.emergencyChecklist && (
              <fieldset className="rounded-xl border border-[color-mix(in srgb,var(--status-danger)_30%,transparent)] bg-[color-mix(in srgb,var(--status-danger)_4%,transparent)] p-4">
                <legend className="px-2 text-[13px] font-extrabold text-[var(--status-danger)]">
                  هل لديك أي من هذه الأعراض الآن؟
                </legend>
                <div className="flex flex-col gap-2">
                  {service.emergencyChecklist.map((item) => (
                    <label key={item} className="flex cursor-pointer items-center gap-2.5 text-[14px] text-[var(--text-primary)]">
                      <input
                        type="checkbox"
                        checked={checkedEmergency.includes(item)}
                        onChange={() => toggleEmergency(item)}
                        className="h-4 w-4 accent-[var(--status-danger)]"
                      />
                      {item}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-[12px] text-[var(--text-muted)]">
                  إن وجد أيٌّ منها، لن نُرسل الطلب وسنوجّهك للطوارئ بدلًا من ذلك.
                </p>
              </fieldset>
            )}

            <button type="submit" className="btn-pill primary mt-1">
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              إرسال الطلب للطبيب
            </button>
          </form>
        )}
      </main>
    </div>
  );
}