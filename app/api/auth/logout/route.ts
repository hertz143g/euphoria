import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionToken, invalidateSession } from "@/lib/session";

export async function POST() {
  try {
    const token = await getSessionToken();

    if (token) {
      await invalidateSession(token);
    }

    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  }
}
