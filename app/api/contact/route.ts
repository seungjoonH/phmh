// Contact 폼 → Resend (Reply-To = 문의자 이메일)
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { buildContactEmail, parseContactPayload } from "@/lib/contact-email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service is not configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseContactPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const email = buildContactEmail(parsed.data);
  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: email.from,
    to: email.to,
    replyTo: email.replyTo,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  if (error) {
    console.error("[contact] Resend error:", error);
    const devHint =
      process.env.NODE_ENV === "development" && error.message
        ? error.message
        : null;
    return NextResponse.json(
      {
        error:
          devHint ??
          "Failed to send message. Please try again or email us directly.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, id: data?.id });
}
