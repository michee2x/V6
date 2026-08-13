/**
 * lib/session-store.ts
 *
 * In-memory session store for v6.
 * Keyed by UUID. Resets on server restart — intentional for v1 (no auth yet).
 * When auth lands, this maps directly to a DB table.
 */

export type ContentType = "video" | "image" | "article";

export interface Session {
  id: string;
  url: string;
  contentType: ContentType;
  /** Raw extracted text/metadata passed to Claude */
  fetchedContent: string;
  basicInsight?: string;
  advancedInsight?: string;
  brief?: string;
  createdAt: Date;
}

// Module-level singleton — persists for the lifetime of the Next.js process.
// In dev, HMR clears module state, so we attach it to globalThis to prevent session loss.
const globalForStore = globalThis as unknown as {
  __sessionStore: Map<string, Session> | undefined;
};
const store = globalForStore.__sessionStore ?? new Map<string, Session>();
if (process.env.NODE_ENV !== "production") {
  globalForStore.__sessionStore = store;
}

export function createSession(session: Session): void {
  store.set(session.id, session);
}

export function getSession(id: string): Session | undefined {
  return store.get(id);
}

export function updateSession(id: string, patch: Partial<Session>): void {
  const existing = store.get(id);
  if (existing) {
    store.set(id, { ...existing, ...patch });
  }
}
