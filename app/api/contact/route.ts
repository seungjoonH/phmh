// Contact 폼 → Resend (센터별 API 키, Reply-To = 문의자 이메일)
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { buildContactEmail, parseContactPayload } from "@/lib/contact-email";
import { getContactResendApiKey } from "@/lib/contact-mail";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

  const apiKey = getContactResendApiKey(parsed.data.center);
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service is not configured" },
      { status: 503 },
    );
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
    const message =
      typeof error.message === "string" && error.message.trim().length > 0
        ? error.message
        : "Email delivery failed.";
    return NextResponse.json(
      {
        error: message,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, id: data?.id });
}
