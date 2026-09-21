"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, SendHorizonal, MessageSquareText } from "lucide-react";
import {
  ticketMailtoHref,
  addMessage,
  myTickets,
  usePortal,
  type Ticket,
} from "@/lib/portal-store";
import { serviceLabel } from "@/lib/services";
import { PortalTopbar } from "../portal/PortalTopbar";
import { SafetyBanner } from "../portal/SafetyBanner";
import { StatusChip, formatDate, lastMessagePreview } from "../portal/ticket-utils";

type Filter = "all" | "pending" | "answered" | "closed";

export function PatientTicketsApp() {
  const { user } = usePortal();
  const [openId, setOpenId] = useState<string | null>(null);

  const tickets = myTickets();
  const open = openId ? tickets.find((t) => t.ticket_id === openId) : undefined;
  const isGuest = !user;

  if (open) {
    return (
      <PatientTicketChat
        ticket={open}
        onBack={() => setOpenId(null)}
        isGuest={isGuest}
      />
    );
  }

  return (
    <PatientTicketsList
      tickets={tickets}
      isGuest={isGuest}
      onOpen={(id) => setOpenId(id)}
    />
  );
}

function PatientTicketsList({
  tickets,
  isGuest,
  onOpen,
}: {
  tickets: Ticket[];
  isGuest: boolean;
  onOpen: (id: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = tickets.filter((t) => (filter === "all" ? true : t.status === filter));

  return (
    <div className="min-h-dvh" id="top">
      <PortalTopbar
        title="تذاكري"
        links={
          <Link href="/" className="portal-topbar-link">
            الصفحة الرئيسية
          </Link>
        }
      />
      <SafetyBanner />
      <main className="mx-auto w-full max-w-[820px] px-4 pb-16 pt-8 sm:px-6">
        {isGuest && (
          <div className="mb-5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <p className="text-[13px] font-bold text-[var(--text-primary)]">
              أنت تستخدم الموقع كضيف — تُعرض هنا طلبات هذا الجهاز فقط.
            </p>
            <Link
              href="/login"
              className="mt-1 inline-block text-[12px] font-bold text-[var(--accent)] hover:underline"
            >
              أنشئ حسابًا لربط طلباتك والوصول إليها من أي جهاز ←
            </Link>
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold text-[var(--text-primary)]">تذاكريك</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">
              {tickets.length} تذكرة — تابع ردود الطبيب هنا
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["all", "الكل"],
                ["pending", "بانتظار الرد"],
                ["answered", "تم الرد"],
                ["closed", "مغلقة"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${filter === key ? "bg-[var(--accent)] text-white" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]"}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-[var(--text-muted)]">
            <MessageSquareText className="h-10 w-10 opacity-40" aria-hidden="true" />
            <span className="text-sm">لا توجد تذاكر هنا بعد.</span>
            <Link href="/" className="btn-pill outline">
              اطلب خدمة
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((t) => (
              <li key={t.ticket_id}>
                <button
                  type="button"
                  onClick={() => onOpen(t.ticket_id)}
                  className="ticket-row card w-full text-start"
                >
                  <span className="flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <b className="text-[15px] text-[var(--text-primary)]">
                        {serviceLabel(t.service_type)}
                      </b>
                      <StatusChip status={t.status} />
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-[var(--text-secondary)]">
                      {lastMessagePreview(t)}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-[var(--text-muted)]">
                      {formatDate(t.created_at)} •{" "}
                      {t.attachments.length > 0 ? `${t.attachments.length} مرفق` : "بدون مرفقات"}
                    </span>
                  </span>
                  <ArrowLeft className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function PatientTicketChat({
  ticket,
  onBack,
  isGuest,
}: {
  ticket: Ticket;
  onBack: () => void;
  isGuest: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);
  const [couldNotSend, setCouldNotSend] = useState(false);
  const timer = useRef<number | null>(null);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    addMessage(ticket.ticket_id, "patient", text);
    setDraft("");
    setSent(true);
    setCouldNotSend(false);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSent(false), 2500);
  };

  return (
    <div className="min-h-dvh" id="top">
      <PortalTopbar
        title="تذاكري"
        links={
          <Link href="/" className="portal-topbar-link">
            الصفحة الرئيسية
          </Link>
        }
      />
      <SafetyBanner />
      <main className="mx-auto w-full max-w-[820px] px-4 pb-16 pt-6 sm:px-6">
        {isGuest && (
          <p className="mb-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[12px] text-[var(--text-secondary)]">
            كضيف، تبقى هذه التذكرة على هذا الجهاز.{" "}
            <Link href="/login" className="font-bold text-[var(--accent)] hover:underline">
              أنشئ حسابًا لربطها بالوصول من أي جهاز
            </Link>
            .
          </p>
        )}
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1 text-[13px] font-bold text-[var(--text-secondary)] transition hover:text-[var(--accent)]"
        >
          → العودة لقائمة التذاكر
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-extrabold text-[var(--text-primary)]">
              {serviceLabel(ticket.service_type)}
            </h1>
            <p className="text-[13px] text-[var(--text-muted)]" dir="ltr">
              {ticket.ticket_id} • {formatDate(ticket.created_at)}
            </p>
          </div>
          <StatusChip status={ticket.status} />
        </div>

        {ticket.attachments.length > 0 && (
          <section className="mt-4">
            <h2 className="text-[14px] font-extrabold text-[var(--text-primary)]">المرفقات</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {ticket.attachments.map((a, i) =>
                a.type === "image" ? (
                  <img
                    key={`${a.name}-${i}`}
                    src={a.url}
                    alt={a.name}
                    className="h-20 w-20 rounded-lg border border-[var(--border)] object-cover"
                  />
                ) : (
                  <a
                    key={`${a.name}-${i}`}
                    href={a.url}
                    download={a.name}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] font-bold text-[var(--text-secondary)]"
                  >
                    📄 {a.name}
                  </a>
                )
              )}
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={() => {
            const anchor = document.createElement("a");
            anchor.href = ticketMailtoHref(ticket);
            anchor.target = "_blank";
            anchor.rel = "noreferrer";
            try {
              anchor.click();
            } catch {
              window.location.href = anchor.href;
            }
            setCouldNotSend(false);
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[13px] font-bold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          أرسل إشعارًا للطبيب بالبريد
        </button>

        <section className="chat-shell mt-5" aria-label="محادثة">
          <div className="chat-thread">
            {ticket.messages.length === 0 && (
              <p className="chat-empty">انتظر رد الطبيب — سيظهر هنا.</p>
            )}
            {ticket.messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.sender}`}>
                <p>{m.text}</p>
                <span>{formatDate(m.timestamp)}</span>
              </div>
            ))}
          </div>
          <form className="chat-composer" onSubmit={send}>
            <textarea
              dir="rtl"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="اكتب رسالتك للطبيب…"
              aria-label="رسالة جديدة"
              className="chat-input"
              rows={1}
            />
            <button type="submit" className="btn-pill primary" aria-label="إرسال">
              <SendHorizonal className="h-4 w-4" aria-hidden="true" />
              إرسال
            </button>
          </form>
        </section>
        {sent && (
          <p className="mt-2 text-[12px] font-bold text-[var(--status-safe)]">
            ✓ أُرسلت رسالتك — يظهر ردّ الطبيب هنا قريبًا.
          </p>
        )}
        {couldNotSend && (
          <p className="mt-2 text-[12px] font-bold text-[var(--status-warning)]">
            لم يفتح تطبيق البريد — استخدم زر الإشعار من الجهاز.
          </p>
        )}
      </main>
    </div>
  );
}