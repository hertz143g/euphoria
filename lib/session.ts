import "server-only";

import { cookies } from "next/headers";
import { generateSessionToken, hashValue } from "./crypto";
import { getSupabaseAdmin } from "./supabase-admin";

const SESSION_DAYS = 30;
const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60;
const SESSION_MS = SESSION_SECONDS * 1000;

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "euphoria_session";

type SessionRow = {
  user_id: string;
  expires_at: string;
};

type UserRow = {
  id: string;
  email: string;
};

export async function createSession(userId: string): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();
  const token = generateSessionToken();
  const tokenHash = hashValue(token);
  const expiresAt = new Date(Date.now() + SESSION_MS).toISOString();

  const { error } = await supabaseAdmin.from("sessions").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  return token;
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function invalidateSession(token: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const tokenHash = hashValue(token);
  const { error } = await supabaseAdmin.from("sessions").delete().eq("token_hash", tokenHash);

  if (error) {
    throw new Error(`Failed to invalidate session: ${error.message}`);
  }
}

export async function getCurrentUserFromSession(): Promise<{ id: string; email: string } | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  const tokenHash = hashValue(token);
  const { data: session, error: sessionError } = await supabaseAdmin
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle<SessionRow>();

  if (sessionError) {
    throw new Error(`Failed to read session: ${sessionError.message}`);
  }

  if (!session) {
    return null;
  }

  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, email")
    .eq("id", session.user_id)
    .maybeSingle<UserRow>();

  if (userError) {
    throw new Error(`Failed to read user: ${userError.message}`);
  }

  return user;
}
