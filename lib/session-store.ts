/**
 * lib/session-store.ts
 *
 * Supabase-backed session store for v6.
 * Stores generated content history in the database.
 */

import { createClient } from "@/utils/supabase/server";

export type ContentType = "video" | "image" | "article";

export interface Session {
  id: string;
  url: string;
  contentType: ContentType;
  /** Raw extracted text/metadata passed to Claude */
  fetchedContent: string;
  /** Optional user-supplied focus hint (e.g. "focus on the hook and pacing") */
  focusHint?: string | null;
  basicInsight?: string;
  advancedInsight?: string;
  brief?: string;
  createdAt: Date;
  userId?: string | null;
}

export async function createSession(session: Omit<Session, "createdAt">): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("sessions").insert({
    id: session.id,
    user_id: session.userId || null,
    url: session.url,
    content_type: session.contentType,
    fetched_content: session.fetchedContent,
    focus_hint: session.focusHint || null,
    basic_insight: session.basicInsight || null,
    advanced_insight: session.advancedInsight || null,
    brief: session.brief || null,
  });

  if (error) {
    console.error("Error creating session in Supabase:", error);
    throw new Error("Failed to save session");
  }
}

export async function getSession(id: string): Promise<Session | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return undefined;

  return {
    id: data.id,
    userId: data.user_id,
    url: data.url,
    contentType: data.content_type as ContentType,
    fetchedContent: data.fetched_content,
    focusHint: data.focus_hint || undefined,
    basicInsight: data.basic_insight || undefined,
    advancedInsight: data.advanced_insight || undefined,
    brief: data.brief || undefined,
    createdAt: new Date(data.created_at),
  };
}

export async function updateSession(id: string, patch: Partial<Session>): Promise<void> {
  const supabase = await createClient();
  const updateData: any = {};
  
  if (patch.url !== undefined) updateData.url = patch.url;
  if (patch.contentType !== undefined) updateData.content_type = patch.contentType;
  if (patch.fetchedContent !== undefined) updateData.fetched_content = patch.fetchedContent;
  if (patch.focusHint !== undefined) updateData.focus_hint = patch.focusHint;
  if (patch.basicInsight !== undefined) updateData.basic_insight = patch.basicInsight;
  if (patch.advancedInsight !== undefined) updateData.advanced_insight = patch.advancedInsight;
  if (patch.brief !== undefined) updateData.brief = patch.brief;
  if (patch.userId !== undefined) updateData.user_id = patch.userId;

  const { error } = await supabase
    .from("sessions")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Error updating session in Supabase:", error);
  }
}
