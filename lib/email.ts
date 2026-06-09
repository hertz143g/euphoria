import "server-only";

import { Resend } from "resend";

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }

  if (!from) {
    throw new Error("Missing EMAIL_FROM environment variable.");
  }

  return { apiKey, from };
}

export async function sendLoginCode(email: string, code: string): Promise<void> {
  const { apiKey, from } = getEmailConfig();
  const resend = new Resend(apiKey);

  if (process.env.NODE_ENV !== "production") {
    console.info(`Sending login code email to ${email}.`);
  }

  const result = await resend.emails.send({
    from,
    to: email,
    subject: "Код входа в Эйфорию",
    text: `Ваш код входа: ${code}. Он действует 10 минут.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.45;">
        <h1 style="margin: 0 0 16px;">Эйфория</h1>
        <p style="margin: 0 0 12px;">Ваш код входа:</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px;">${code}</div>
        <p style="margin: 16px 0 0; color: #555;">Код действует 10 минут.</p>
      </div>
    `,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }
}
