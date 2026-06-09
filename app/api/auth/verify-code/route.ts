import { NextResponse } from "next/server";
import { z } from "zod";
import { hashLoginCode } from "@/lib/crypto";
import { createSession, setSessionCookie } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const verifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
});

type LoginCodeRow = {
  id: string;
  code_hash: string;
};

type UserRow = {
  id: string;
  email: string;
};

async function findOrCreateUser(email: string): Promise<UserRow> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: existingUser, error: selectError } = await supabaseAdmin
    .from("users")
    .select("id, email")
    .eq("email", email)
    .maybeSingle<UserRow>();

  if (selectError) {
    throw new Error(selectError.message);
  }

  if (existingUser) {
    return existingUser;
  }

  const { data: newUser, error: insertError } = await supabaseAdmin
    .from("users")
    .insert({ email })
    .select("id, email")
    .single<UserRow>();

  if (insertError || !newUser) {
    throw new Error(insertError?.message || "Failed to create user.");
  }

  return newUser;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or code." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const code = parsed.data.code;
    const supabaseAdmin = getSupabaseAdmin();
    const { data: loginCode, error: codeError } = await supabaseAdmin
      .from("login_codes")
      .select("id, code_hash")
      .eq("email", email)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<LoginCodeRow>();

    if (codeError) {
      console.error(codeError);
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }

    if (!loginCode || loginCode.code_hash !== hashLoginCode(email, code)) {
      return NextResponse.json({ error: "Invalid code." }, { status: 401 });
    }

    const user = await findOrCreateUser(email);
    const { error: updateError } = await supabaseAdmin
      .from("login_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", loginCode.id);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }

    const token = await createSession(user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      user: {
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to verify login code." }, { status: 500 });
  }
}
