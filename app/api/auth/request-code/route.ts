import { NextResponse } from "next/server";
import { z } from "zod";
import { generateLoginCode, hashLoginCode } from "@/lib/crypto";
import { sendLoginCode } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const requestCodeSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const supabaseAdmin = getSupabaseAdmin();
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentCode, error: rateLimitError } = await supabaseAdmin
      .from("login_codes")
      .select("id")
      .eq("email", email)
      .gte("created_at", oneMinuteAgo)
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (rateLimitError) {
      console.error(rateLimitError);
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }

    if (recentCode) {
      return NextResponse.json({ error: "Code already requested." }, { status: 429 });
    }

    const code = generateLoginCode();
    const codeHash = hashLoginCode(email, code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: insertError } = await supabaseAdmin.from("login_codes").insert({
      email,
      code_hash: codeHash,
      expires_at: expiresAt,
      used_at: null,
    });

    if (insertError) {
      console.error(insertError);
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }

    await sendLoginCode(email, code);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send login code." }, { status: 500 });
  }
}
