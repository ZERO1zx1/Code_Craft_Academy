import nodemailer from "nodemailer";
import webpush from "web-push";

type DeliveryStatus = "sent" | "skipped" | "failed";

type PushSubscriptionPayload = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type NotificationDeliveryOutcome = {
  channel: "email" | "push";
  status: DeliveryStatus;
  detail?: string;
};

export type InvitationEmailDeliveryOutcome = {
  channel: "email";
  status: DeliveryStatus;
  detail?: string;
};

let smtpTransport: nodemailer.Transporter | undefined;

function getSmtpTransport() {
  const user = process.env.GMAIL_SMTP_USER;
  const password = process.env.GMAIL_SMTP_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !password) return undefined;

  smtpTransport ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: password },
  });
  return smtpTransport;
}

function shortError(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 480) : "Unknown delivery error";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function getBrandLogoUrl() {
  const candidate = process.env.VITE_APP_LOGO?.trim();
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function invitationEmailHtml(input: { roleLabel: string; acceptUrl: string }) {
  const logoUrl = getBrandLogoUrl();
  const logo = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" width="48" height="48" alt="CodeCraft Academy" style="display:block;width:48px;height:48px;border-radius:14px;object-fit:cover" />`
    : `<div style="width:48px;height:48px;border-radius:14px;background:#17152c;color:#ffffff;font:800 18px/48px Arial,sans-serif;text-align:center">&gt;_</div>`;
  const safeUrl = escapeHtml(input.acceptUrl);
  return `<!doctype html><html lang="mn"><body style="margin:0;padding:0;background:#f6f5fb;color:#17152c;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e7e5f5"><tr><td style="padding:30px 34px;background:linear-gradient(135deg,#17152c,#39207c)">${logo}<p style="margin:18px 0 0;color:#c4b5fd;font-size:12px;font-weight:700;letter-spacing:1.4px">CODECRAFT ACADEMY</p><h1 style="margin:8px 0 0;color:#ffffff;font-size:28px;line-height:1.25">Ажилтны урилга</h1></td></tr><tr><td style="padding:34px"><p style="margin:0;font-size:16px;line-height:1.65">Танд CodeCraft Academy-д <strong>${escapeHtml(input.roleLabel)}</strong> эрхээр нэгдэх урилга ирлээ.</p><p style="margin:18px 0 28px;color:#625f73;font-size:14px;line-height:1.65">Доорх товчийг ашиглан урилгыг зөвшөөрнө үү. Холбоос нь 7 хоногийн хүчинтэй бөгөөд нэг л удаа ашиглагдана.</p><a href="${safeUrl}" style="display:inline-block;background:#17152c;color:#ffffff;border-radius:10px;padding:14px 20px;text-decoration:none;font-size:14px;font-weight:700">Урилгыг зөвшөөрөх</a><p style="margin:28px 0 0;color:#625f73;font-size:12px;line-height:1.6">Хэрэв товч ажиллахгүй бол энэ холбоосыг нээнэ үү:<br/><a href="${safeUrl}" style="color:#6d28d9;word-break:break-all">${safeUrl}</a></p><p style="margin:20px 0 0;color:#8d899b;font-size:12px;line-height:1.6">Хэрэв та энэ урилгыг хүлээгээгүй бол и-мэйлийг үл тоомсорлоно уу.</p></td></tr></table></td></tr></table></body></html>`;
}

export async function deliverStaffInvitationEmail(input: {
  email: string;
  role: "reviewer" | "teacher";
  acceptUrl: string | null;
}): Promise<InvitationEmailDeliveryOutcome> {
  if (!input.acceptUrl) {
    return { channel: "email", status: "skipped", detail: "A trusted acceptance URL is not available." };
  }

  const transport = getSmtpTransport();
  if (!transport) {
    return { channel: "email", status: "skipped", detail: "Gmail SMTP is not configured." };
  }

  const roleLabel = input.role === "teacher" ? "багш" : "шалгагч";
  try {
    await transport.sendMail({
      from: process.env.GMAIL_SMTP_USER,
      to: input.email,
      subject: "CodeCraft Academy · Ажилтны урилга",
      text: `Танд CodeCraft Academy-д ${roleLabel} эрхээр нэгдэх урилга ирлээ.\n\nУрилгыг зөвшөөрөх холбоос (7 хоногийн хүчинтэй, нэг удаа ашиглагдана):\n${input.acceptUrl}\n\nХэрэв энэ урилгыг та хүлээгээгүй бол энэ и-мэйлийг үл тоомсорлоно уу.`,
      html: invitationEmailHtml({ roleLabel, acceptUrl: input.acceptUrl }),
    });
    return { channel: "email", status: "sent", detail: "Sent through Gmail SMTP." };
  } catch (error) {
    return { channel: "email", status: "failed", detail: shortError(error) };
  }
}

export async function deliverLearnerNotification(input: {
  title: string;
  content: string;
  href?: string | null;
  email?: string | null;
  emailEnabled: boolean;
  browserPushEnabled: boolean;
  subscriptions: PushSubscriptionPayload[];
}): Promise<NotificationDeliveryOutcome[]> {
  const outcomes: NotificationDeliveryOutcome[] = [];

  if (!input.emailEnabled) {
    outcomes.push({ channel: "email", status: "skipped", detail: "Email notifications are disabled." });
  } else if (!input.email) {
    outcomes.push({ channel: "email", status: "skipped", detail: "No learner email address is available." });
  } else {
    const transport = getSmtpTransport();
    if (!transport) {
      outcomes.push({ channel: "email", status: "skipped", detail: "Gmail SMTP is not configured." });
    } else {
      try {
        await transport.sendMail({
          from: process.env.GMAIL_SMTP_USER,
          to: input.email,
          subject: `CodeCraft Academy · ${input.title}`,
          text: `${input.content}${input.href ? `\n\nНээх: ${input.href}` : ""}`,
        });
        outcomes.push({ channel: "email", status: "sent", detail: "Sent through Gmail SMTP." });
      } catch (error) {
        outcomes.push({ channel: "email", status: "failed", detail: shortError(error) });
      }
    }
  }

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || (process.env.GMAIL_SMTP_USER ? `mailto:${process.env.GMAIL_SMTP_USER}` : "");
  if (!input.browserPushEnabled) {
    outcomes.push({ channel: "push", status: "skipped", detail: "Browser push is disabled." });
  } else if (!input.subscriptions.length) {
    outcomes.push({ channel: "push", status: "skipped", detail: "No browser push subscription is registered." });
  } else if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    outcomes.push({ channel: "push", status: "skipped", detail: "VAPID keys are not configured." });
  } else {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    const payload = JSON.stringify({ title: input.title, body: input.content, href: input.href ?? "/notifications" });
    try {
      await Promise.all(input.subscriptions.map((subscription) => webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      }, payload)));
      outcomes.push({ channel: "push", status: "sent", detail: `${input.subscriptions.length} browser subscription(s) notified.` });
    } catch (error) {
      outcomes.push({ channel: "push", status: "failed", detail: shortError(error) });
    }
  }

  return outcomes;
}
