import type { TicketStatus } from "@/lib/services";
import { statusLabel } from "@/lib/services";

export function StatusChip({ status }: { status: TicketStatus }) {
  return <span className={`status-chip ${status}`}>{statusLabel(status)}</span>;
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function lastMessagePreview(t: {
  messages: { sender: "patient" | "doctor"; text: string }[];
}): string {
  const last = t.messages[t.messages.length - 1];
  if (!last) return "لا توجد رسائل بعد";
  return `${last.sender === "doctor" ? "الطبيب" : "المريض"}: ${last.text}`;
}