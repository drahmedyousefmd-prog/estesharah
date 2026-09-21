/**
 * Firestore sync layer — the bridge to the shared database used by BOTH
 * sites. This module is only ever loaded (and only bundles the Firebase SDK)
 * when FIREBASE_CONFIG is filled in src/lib/firebase/config.ts. Until then
 * isFirebaseConfigured() is false and every function below is a no-op.
 *
 * Schema (shared with the doctor site):
 *   tickets/{ticketId}
 *     ticket_id, patient_id, guest_token?, service_type, status,
 *     created_at, patient_profile{name,identifier}, patient_notes,
 *     attachments[{name,type}] (URLs intentionally NOT synced), engine result,
 *     last_message{text,sender,timestamp}|null
 *   tickets/{ticketId}/messages/{messageId}
 *     sender, text, timestamp
 */
import { isFirebaseConfigured } from "./config";
import type { Ticket, TicketMessage, AssistiveEngineOutput } from "@/lib/portal-store";

function toFirestoreTicket(ticket: Ticket) {
  return {
    ticket_id: ticket.ticket_id,
    patient_id: ticket.patient_id,
    guest_token: ticket.guest_token ?? null,
    service_type: ticket.service_type,
    status: ticket.status,
    created_at: ticket.created_at,
    patient_profile: ticket.patient_profile,
    patient_notes: ticket.patient_notes,
    // Attachments: store shape + name only. Their data-URLs can be megabytes;
    // transferring them is a documented limitation (same as the import-link
    // flow today). The original stays on the submitter's device.
    attachments: ticket.attachments.map((a) => ({ name: a.name, type: a.type })),
    assistive_engine_output: ticket.assistive_engine_output,
    last_message: ticket.messages.length
      ? {
          text: ticket.messages[ticket.messages.length - 1].text,
          sender: ticket.messages[ticket.messages.length - 1].sender,
          timestamp: ticket.messages[ticket.messages.length - 1].timestamp,
        }
      : null,
  };
}

function fromFirestoreTicket(s: {
  ticket_id: string;
  patient_id: string;
  guest_token?: string | null;
  service_type: Ticket["service_type"];
  status: Ticket["status"];
  created_at: string;
  patient_profile: { name?: string; identifier: string };
  patient_notes: string;
  attachments?: { name: string; type: "image" | "pdf" }[];
  assistive_engine_output?: AssistiveEngineOutput | null;
  messages?: TicketMessage[];
}): Ticket {
  const engine: AssistiveEngineOutput = s.assistive_engine_output ?? {
    source: "none",
    raw_result: "",
    visible_to_patient: false,
  };
  return {
    ticket_id: s.ticket_id,
    patient_id: s.patient_id,
    guest_token: s.guest_token ?? undefined,
    service_type: s.service_type,
    status: s.status,
    created_at: s.created_at,
    patient_profile: s.patient_profile,
    patient_notes: s.patient_notes,
    attachments: (s.attachments ?? []).map((a) => ({ name: a.name, type: a.type, url: "" })),
    assistive_engine_output: engine,
    messages: s.messages ?? [],
  };
}

async function loadApp() {
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const { FIREBASE_CONFIG } = await import("./config");
  const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG!);
  const { getAuth, signInAnonymously, onAuthStateChanged } = await import("firebase/auth");
  const auth = getAuth(app);
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  await new Promise<string>((resolve) => {
    const cur = auth.currentUser ? auth.currentUser.uid : null;
    if (cur) return resolve(cur);
    const off = onAuthStateChanged(auth, (u) => {
      off();
      resolve(u?.uid ?? "");
    });
  });
  return app;
}

async function currentUid(): Promise<string> {
  const app = await loadApp();
  const { getAuth } = await import("firebase/auth");
  return getAuth(app).currentUser?.uid ?? "";
}

/** Push a brand-new ticket to Firestore (fire-and-forget when configured). */
export async function pushTicket(ticket: Ticket): Promise<void> {
  if (!isFirebaseConfigured() || typeof window === "undefined") return;
  const uid = await currentUid();
  if (!uid) return;
  const { getFirestore, doc, setDoc } = await import("firebase/firestore");
  const db = getFirestore(await loadApp());
  await setDoc(doc(db, "tickets", ticket.ticket_id), {
    ...toFirestoreTicket(ticket),
    owner_uid: uid,
  });
}

/** Append one chat message under a ticket (fire-and-forget when configured). */
export async function pushMessage(
  ticketId: string,
  sender: "patient" | "doctor",
  text: string,
  timestamp: string,
  status?: Ticket["status"]
): Promise<void> {
  if (!isFirebaseConfigured() || typeof window === "undefined") return;
  const { getFirestore, addDoc, collection, updateDoc, doc } = await import("firebase/firestore");
  const db = getFirestore(await loadApp());
  await addDoc(collection(db, "tickets", ticketId, "messages"), { sender, text, timestamp });
  if (status) {
    await updateDoc(doc(db, "tickets", ticketId), {
      status,
      last_message: { text, sender, timestamp },
    });
  }
}

/**
 * Subscribe to the caller's own tickets (by guest token) and report each
 * snapshot as hydrated Ticket[] (attach their messages). Resolves the
 * unsubscribe function. No-op when Firebase is not configured.
 */
export async function subscribeRemoteTickets(
  guestToken: string | undefined,
  onBatch: (tickets: Ticket[]) => void
): Promise<() => void> {
  if (!isFirebaseConfigured() || typeof window === "undefined") return () => {};
  const uid = await currentUid();
  if (!uid) return () => {};
  const { collection, query, where, onSnapshot, getDocs, getFirestore, orderBy, limit } =
    await import("firebase/firestore");
  const db = getFirestore(await loadApp());

  // Patients may read ONLY their own tickets — either by owner_uid (this
  // device's anonymous auth uid) or by this device's guest token.
  const queries = [
    query(
      collection(db, "tickets"),
      where("owner_uid", "==", uid),
      orderBy("created_at", "desc"),
      limit(50)
    ),
  ];
  if (guestToken) {
    queries.push(
      query(
        collection(db, "tickets"),
        where("guest_token", "==", guestToken),
        orderBy("created_at", "desc"),
        limit(50)
      )
    );
  }

  const seen = new Map<string, Ticket>();

  const hydrateDoc = async (id: string, data: unknown) => {
    const base = fromFirestoreTicket(data as never);
    const msgs = await getDocs(
      query(collection(db, "tickets", id, "messages"), orderBy("timestamp", "asc"))
    );
    base.messages = msgs.docs.map((md) => {
      const m = md.data() as { sender: "patient" | "doctor"; text: string; timestamp: string };
      return { sender: m.sender, text: m.text, timestamp: m.timestamp } as TicketMessage;
    });
    seen.set(id, base);
  };

  const unsubs = queries.map((q) =>
    onSnapshot(
      q,
      (snap) => {
        void (async () => {
          for (const d of snap.docs) await hydrateDoc(d.id, d.data());
          onBatch([...seen.values()]);
        })();
      },
      (err: Error) => console.error("[estesharah] Firestore tickets subscription:", err)
    )
  );

  return () => unsubs.forEach((unsub) => unsub());
}