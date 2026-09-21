"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ServiceType, TicketStatus } from "./services";
import { serviceLabel, statusLabel } from "./services";
import { CONTACT } from "./site";

export type SiteRole = "doctor" | "patient";

export interface Attachment {
  type: "image" | "pdf";
  name: string;
  url: string;
}

export interface TicketMessage {
  sender: "patient" | "doctor";
  text: string;
  timestamp: string;
}

/**
 * Assistive engine output attached to a ticket. Spec hard-requirement:
 * `visible_to_patient` must remain `false` — the patient never sees it.
 */
export interface AssistiveEngineOutput {
  source: "ocr_prescription_engine" | "ecg_reading_engine" | "none";
  raw_result: string;
  visible_to_patient: false;
}

export interface Ticket {
  ticket_id: string;
  patient_id: string;
  /** UUID bound to this browser when the ticket was created as a guest (`patient_id` = "guest"). */
  guest_token?: string;
  service_type: ServiceType;
  status: TicketStatus;
  created_at: string;
  patient_profile: { name?: string; identifier: string };
  patient_notes: string;
  attachments: Attachment[];
  assistive_engine_output: AssistiveEngineOutput;
  messages: TicketMessage[];
}

export interface PortalUser {
  id: string;
  identifier: string;
  name: string;
  role: SiteRole;
  passwordHash: string;
  createdAt: string;
}

const USERS_KEY = "rochetta-users";
const TICKETS_KEY = "rochetta-tickets";
const SESSION_KEY = "rochetta-session";
const GUEST_KEY = "rochetta-guest-token";

/** Stable unique guest identity for this browser (no login). */
function getGuestToken(): string {
  if (!hasWindow()) return "";
  try {
    const existing = localStorage.getItem(GUEST_KEY);
    if (existing) return existing;
    const fresh =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : "guest-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem(GUEST_KEY, fresh);
    return fresh;
  } catch {
    return "guest-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}

/** Demo-only default password for the single doctor account (shown on the login screen). */
export const DOCTOR_PASSWORD = "rochetta123";
/** The one hub email used for the doctor account and the mailto alert. */
export const DOCTOR_IDENTIFIER = CONTACT.email.toLowerCase();

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function readJSON<T>(key: string): T | null {
  if (!hasWindow()) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (!hasWindow()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or disabled — demo keeps working in memory */
  }
}

function hashPassword(pw: string): string {
  let h = 5381;
  const s = encodeURIComponent(pw);
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return "h" + h.toString(36) + s.length.toString(36);
}

function uid(prefix: string): string {
  return (
    prefix +
    Math.random().toString(36).slice(2, 8) +
    Date.now().toString(36).slice(-4)
  );
}

export interface PortalSnapshot {
  ready: boolean;
  user: PortalUser | null;
  tickets: Ticket[];
  pendingCounts: Partial<Record<ServiceType, number>>;
  doctorPendingTotal: number;
}

let ready = false;
let users: PortalUser[] = [];
let tickets: Ticket[] = [];
let sessionUserId: string | null = null;
let snapshot: PortalSnapshot = {
  ready: false,
  user: null,
  tickets: [],
  pendingCounts: {},
  doctorPendingTotal: 0,
};

const listeners = new Set<() => void>();

function currentUser(): PortalUser | null {
  return users.find((u) => u.id === sessionUserId) ?? null;
}

function buildSnapshot(): PortalSnapshot {
  const user = currentUser();
  const pendingCounts: Partial<Record<ServiceType, number>> = {};
  let doctorPendingTotal = 0;
  for (const t of tickets) {
    if (t.status === "pending") {
      pendingCounts[t.service_type] = (pendingCounts[t.service_type] ?? 0) + 1;
      doctorPendingTotal++;
    }
  }
  return { ready, user, tickets, pendingCounts, doctorPendingTotal };
}

function emit(): void {
  snapshot = buildSnapshot();
  listeners.forEach((l) => l());
}

/** Loads everything from localStorage and seeds the doctor account exactly once. */
export function initPortal(): void {
  if (!hasWindow()) return;
  users = readJSON<PortalUser[]>(USERS_KEY) ?? [];
  tickets = readJSON<Ticket[]>(TICKETS_KEY) ?? [];
  sessionUserId = readJSON<string>(SESSION_KEY);
  if (!users.some((u) => u.role === "doctor")) {
    users = [
      ...users,
      {
        id: "doctor",
        identifier: DOCTOR_IDENTIFIER,
        name: "د. أحمد يوسف",
        role: "doctor",
        passwordHash: hashPassword(DOCTOR_PASSWORD),
        createdAt: new Date().toISOString(),
      },
    ];
    writeJSON(USERS_KEY, users);
  }
  ready = true;
  emit();
  // When Firebase is configured, subscribe to this guest's own tickets and
  // merge remote changes (doctor replies) into the local store in real time.
  // The firebase chunk is only fetched the first time this runs with config set.
  const token = getGuestToken();
  if (token) {
    void import("./firebase/firestore")
      .then((m) => m.subscribeRemoteTickets(token, mergeRemote))
      .catch((err: unknown) => console.error("[estesharah] remote sync:", err));
  }
}

/** Merge remote tickets into the local store, preferring local attachments and newer messages. */
function mergeRemote(remote: ImportSyncTicket[]): void {
  const existingById = new Map(tickets.map((t) => [t.ticket_id, t]));
  let changed = false;
  for (const r of remote) {
    const cur = existingById.get(r.ticket_id);
    if (!cur) {
      tickets = [r as Ticket, ...tickets];
      changed = true;
      continue;
    }
    let next: Ticket = cur;
    if (r.messages.length > cur.messages.length) {
      next = { ...cur, messages: r.messages, status: r.status };
      changed = true;
    } else if (cur.status !== r.status) {
      next = { ...cur, status: r.status };
      changed = true;
    }
    if (next !== cur) {
      tickets = tickets.map((t) => (t.ticket_id === r.ticket_id ? next : t));
    }
  }
  if (changed) {
    writeJSON(TICKETS_KEY, tickets);
    emit();
  }
}

type ImportSyncTicket = Ticket;

export function subscribePortal(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getPortalSnapshot(): PortalSnapshot {
  return snapshot;
}

/** Reactive snapshot of the local portal store (users, session, tickets). */
export function usePortal(): PortalSnapshot {
  useSyncExternalStore(subscribePortal, getPortalSnapshot, getPortalSnapshot);
  useEffect(() => {
    initPortal();
  }, []);
  return snapshot;
}

function ensureReady(): void {
  if (!ready) initPortal();
}

export function login(
  identifier: string,
  password: string
): { ok: boolean; error?: string; role?: SiteRole } {
  ensureReady();
  const id = identifier.trim().toLowerCase();
  if (id === DOCTOR_IDENTIFIER) {
    const target = users.find((u) => u.role === "doctor");
    if (!target || hashPassword(password) !== target.passwordHash) {
      return { ok: false, error: "كلمة مرور الطبيب غير صحيحة" };
    }
    sessionUserId = target.id;
    writeJSON(SESSION_KEY, target.id);
    emit();
    return { ok: true, role: "doctor" };
  }
  const u = users.find((x) => x.identifier === id && x.role === "patient");
  if (!u) {
    return { ok: false, error: "لا يوجد حساب بهذا البريد/الرقم — سجّل أولاً" };
  }
  if (hashPassword(password) !== u.passwordHash) {
    return { ok: false, error: "كلمة المرور غير صحيحة" };
  }
  sessionUserId = u.id;
  writeJSON(SESSION_KEY, u.id);
  mergeGuestTicketsTo(u.id);
  emit();
  return { ok: true, role: "patient" };
}

export function signup(
  identifier: string,
  password: string,
  name: string
): { ok: boolean; error?: string } {
  ensureReady();
  const id = identifier.trim().toLowerCase();
  if (id === DOCTOR_IDENTIFIER) {
    return { ok: false, error: "هذا الحساب محجوز لحساب الطبيب" };
  }
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(id);
  const phoneOk = /^[0-9+\s().-]{8,15}$/.test(id);
  if (!emailOk && !phoneOk) {
    return { ok: false, error: "أدخل بريدًا إلكترونيًا أو رقم موبايل صالحًا" };
  }
  if (users.some((x) => x.identifier === id)) {
    return { ok: false, error: "هذا الحساب مسجّل بالفعل — سجّل دخولك" };
  }
  if (password.length < 4) {
    return { ok: false, error: "كلمة المرور 4 أحرف على الأقل" };
  }
  const user: PortalUser = {
    id: uid("u"),
    identifier: id,
    name: name.trim().slice(0, 30) || "مريض",
    role: "patient",
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  users = [...users, user];
  writeJSON(USERS_KEY, users);
  sessionUserId = user.id;
  writeJSON(SESSION_KEY, user.id);
  mergeGuestTicketsTo(user.id);
  emit();
  return { ok: true };
}

export function logout(): void {
  ensureReady();
  sessionUserId = null;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function createTicket(args: {
  serviceType: ServiceType;
  patientNotes: string;
  attachments: Attachment[];
  name?: string;
  identifier?: string;
}): Ticket | null {
  ensureReady();
  const u = currentUser();
  const token = u ? undefined : getGuestToken();
  const identifier = (args.identifier ?? "").trim().toLowerCase();
  const ticket: Ticket = {
    ticket_id: uid("RKT-"),
    patient_id: u?.id ?? "guest",
    guest_token: token,
    service_type: args.serviceType,
    status: "pending",
    created_at: new Date().toISOString(),
    patient_profile: { name: (args.name ?? "").trim() || undefined, identifier },
    patient_notes: args.patientNotes,
    attachments: args.attachments,
    assistive_engine_output: {
      source:
        args.serviceType === "prescription_reading"
          ? "ocr_prescription_engine"
          : args.serviceType === "ecg_reading"
            ? "ecg_reading_engine"
            : "none",
      raw_result: "",
      visible_to_patient: false,
    },
    messages: [],
  };
  tickets = [...tickets, ticket];
  writeJSON(TICKETS_KEY, tickets);
  emit();
  if (ticket.guest_token) {
    void import("./firebase/firestore")
      .then((m) => m.pushTicket(ticket))
      .catch((err: unknown) => console.error("[estesharah] push ticket:", err));
  }
  return ticket;
}

/** Import payload shared from a submitted consultation via the WhatsApp/Gmail forward link (`/import?t=…`). */
export interface ImportPayload {
  id: string;
  t: ServiceType;
  n: string;
  nm?: string;
  c?: string;
  d: string;
}

function toB64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): string {
  const str = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4 ? "=".repeat(4 - (str.length % 4)) : "";
  const bin = atob(str + pad);
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Encode a ticket into a compact `?t=` payload for the import link. */
export function encodeTicketPayload(p: ImportPayload): string {
  return toB64Url(JSON.stringify(p));
}

/** Decode an import payload; `null` when the payload is malformed. */
export function decodeTicketPayload(raw: string): ImportPayload | null {
  try {
    const p = JSON.parse(fromB64Url(raw)) as Partial<ImportPayload>;
    if (typeof p.id !== "string" || !p.id) return null;
    if (!isServiceType(p.t)) return null;
    if (typeof p.n !== "string") return null;
    return {
      id: p.id,
      t: p.t,
      n: p.n,
      nm: typeof p.nm === "string" ? p.nm : undefined,
      c: typeof p.c === "string" ? p.c : undefined,
      d: typeof p.d === "string" ? p.d : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Save a consultation that arrived via the WhatsApp/Gmail forward link into this
 * device's tickets (the doctor's inbox reads the same store). Returns the stored
 * ticket, or `"exists"` when the ticket_id is already present.
 */
export function importTicket(p: ImportPayload): Ticket | "exists" {
  ensureReady();
  const exists = tickets.some((x) => x.ticket_id === p.id);
  if (exists) return "exists";
  const ticket: Ticket = {
    ticket_id: p.id,
    patient_id: "guest",
    service_type: p.t,
    status: "pending",
    created_at: p.d,
    patient_profile: { name: p.nm?.trim() || undefined, identifier: (p.c ?? "").trim().toLowerCase() },
    patient_notes: p.n,
    attachments: [],
    assistive_engine_output: {
      source:
        p.t === "prescription_reading"
          ? "ocr_prescription_engine"
          : p.t === "ecg_reading"
            ? "ecg_reading_engine"
            : "none",
      raw_result: "",
      visible_to_patient: false,
    },
    messages: [],
  };
  tickets = [ticket, ...tickets];
  writeJSON(TICKETS_KEY, tickets);
  emit();
  return ticket;
}

function isServiceType(v: unknown): v is ServiceType {
  return (
    typeof v === "string" &&
    ["general_consultation", "lab_reading", "prescription_reading", "ecg_reading", "diet_plan", "treatment_plan"].includes(
      v as ServiceType
    )
  );
}

/** All tickets visible on this device: either the logged-in patient's tickets or the local guest's tickets. */
export function myTickets(): Ticket[] {
  ensureReady();
  const token = getGuestToken();
  const u = currentUser();
  return tickets
    .filter((t) =>
      u
        ? t.patient_id === u.id || (t.guest_token && t.guest_token === token)
        : t.guest_token === token
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Number of guest tickets on this device (for the login/signup "link existing tickets" hint). */
export function guestTicketCount(): number {
  if (!hasWindow()) return 0;
  ensureReady();
  const token = localStorage.getItem(GUEST_KEY);
  if (!token) return 0;
  return tickets.filter((t) => t.guest_token === token).length;
}

/**
 * After a guest creates a patient account (signup or first login), link this device's guest
 * tickets to the account so they are accessible from any device.
 */
function mergeGuestTicketsTo(userId: string): void {
  ensureReady();
  const token = getGuestToken();
  let merged = false;
  tickets = tickets.map((t) => {
    if (t.guest_token === token && t.patient_id !== userId) {
      merged = true;
      const updated = { ...t, patient_id: userId };
      delete updated.guest_token;
      return updated;
    }
    return t;
  });
  if (merged) writeJSON(TICKETS_KEY, tickets);
}

export function allTickets(): Ticket[] {
  ensureReady();
  return [...tickets].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function ticketById(id: string): Ticket | undefined {
  ensureReady();
  return tickets.find((t) => t.ticket_id === id);
}

export function addMessage(
  ticketId: string,
  sender: "patient" | "doctor",
  text: string
): void {
  ensureReady();
  const textTrimmed = text.trim();
  if (!textTrimmed) return;
  const current = tickets.find((t) => t.ticket_id === ticketId);
  if (!current) return;
  const updated: Ticket = {
    ...current,
    messages: [
      ...current.messages,
      { sender, text: textTrimmed, timestamp: new Date().toISOString() },
    ],
  };
  if (sender === "doctor" && updated.status === "pending") {
    updated.status = "answered";
  }
  tickets = tickets.map((t) => (t.ticket_id === ticketId ? updated : t));
  writeJSON(TICKETS_KEY, tickets);
  emit();
  if (current.guest_token) {
    void import("./firebase/firestore")
      .then((m) => m.pushMessage(ticketId, sender, textTrimmed, new Date().toISOString(), updated.status))
      .catch((err: unknown) => console.error("[estesharah] push message:", err));
  }
}

export function setTicketStatus(ticketId: string, status: TicketStatus): void {
  ensureReady();
  tickets = tickets.map((t) => (t.ticket_id === ticketId ? { ...t, status } : t));
  writeJSON(TICKETS_KEY, tickets);
  emit();
}

/** Mailto link that alerts the doctor by email with the ticket summary (local demo delivery). */
export function ticketMailtoHref(t: Ticket): string {
  const subject = `طلب جديد عبر Rochetta — ${t.ticket_id} (${serviceLabel(t.service_type)})`;
  const body = [
    `رقم التذكرة: ${t.ticket_id}`,
    `الخدمة: ${serviceLabel(t.service_type)}`,
    `الحالة: ${statusLabel(t.status)}`,
    `المريض: ${t.patient_profile.name || t.patient_profile.identifier}`,
    ``,
    `تفاصيل الطلب:`,
    t.patient_notes,
    ``,
    `المرفقات معروضة داخل بوابة الطبيب > طلبات المرضى (نظام محلي تجريبي).`,
  ].join("\n");
  return `mailto:${DOCTOR_IDENTIFIER}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}