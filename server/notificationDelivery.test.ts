import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: { createTransport: mocks.createTransport },
}));

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: mocks.setVapidDetails,
    sendNotification: mocks.sendNotification,
  },
}));

import { deliverLearnerNotification, deliverStaffInvitationEmail } from "./notificationDelivery";

describe("learner external notification delivery", () => {
  beforeEach(() => {
    process.env.GMAIL_SMTP_USER = "academy.sender@example.test";
    process.env.GMAIL_SMTP_APP_PASSWORD = "test-app-password";
    process.env.VITE_APP_LOGO = "https://assets.example.test/codecraft-logo.png";
    mocks.sendMail.mockReset().mockResolvedValue({ messageId: "mock-message" });
    mocks.createTransport.mockReset().mockReturnValue({ sendMail: mocks.sendMail });
    mocks.setVapidDetails.mockReset();
    mocks.sendNotification.mockReset().mockResolvedValue({ statusCode: 201 });
  });

  it("uses the configured Gmail SMTP transport only for an opted-in learner with an e-mail address", async () => {
    const outcomes = await deliverLearnerNotification({
      title: "Quiz-ийн үр дүн бэлэн боллоо",
      content: "Таны үнэлгээг нээнэ үү.",
      href: "/notifications",
      email: "learner@example.test",
      emailEnabled: true,
      browserPushEnabled: false,
      subscriptions: [],
    });

    expect(mocks.createTransport).toHaveBeenCalledWith(expect.objectContaining({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: "academy.sender@example.test", pass: "test-app-password" } }));
    expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: "academy.sender@example.test",
      to: "learner@example.test",
      subject: "CodeCraft Academy · Quiz-ийн үр дүн бэлэн боллоо",
    }));
    expect(outcomes).toEqual(expect.arrayContaining([
      expect.objectContaining({ channel: "email", status: "sent", detail: "Sent through Gmail SMTP." }),
      expect.objectContaining({ channel: "push", status: "skipped" }),
    ]));
  });

  it("sends a one-time staff invitation through the configured Gmail SMTP transport", async () => {
    const outcome = await deliverStaffInvitationEmail({
      email: "reviewer@example.test",
      role: "reviewer",
      acceptUrl: "https://academy.example.test/invite/accept?token=secure-test-token",
    });

    expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: "academy.sender@example.test",
      to: "reviewer@example.test",
      subject: "CodeCraft Academy · Ажилтны урилга",
      text: expect.stringContaining("secure-test-token"),
      html: expect.stringContaining("https://assets.example.test/codecraft-logo.png"),
    }));
    expect(mocks.sendMail.mock.calls[0][0].html).toContain("Урилгыг зөвшөөрөх");
    expect(mocks.sendMail.mock.calls[0][0].html).toContain("secure-test-token");
    expect(outcome).toEqual({ channel: "email", status: "sent", detail: "Sent through Gmail SMTP." });
  });

  it("does not attempt to email a staff invitation without a trusted acceptance URL", async () => {
    const outcome = await deliverStaffInvitationEmail({ email: "reviewer@example.test", role: "teacher", acceptUrl: null });
    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ channel: "email", status: "skipped" });
  });

  it("uses the configured VAPID identity for a consented learner browser subscription", async () => {
    process.env.VAPID_PUBLIC_KEY = "B".repeat(87);
    process.env.VAPID_PRIVATE_KEY = "C".repeat(43);
    process.env.VAPID_SUBJECT = "mailto:academy@example.test";

    const outcomes = await deliverLearnerNotification({
      title: "Шинэ хичээл нэмэгдлээ",
      content: "Python курсын шинэ хичээлийг нээнэ үү.",
      href: "/curriculum",
      email: "learner@example.test",
      emailEnabled: false,
      browserPushEnabled: true,
      subscriptions: [{ endpoint: "https://push.example.test/subscription", p256dh: "a".repeat(32), auth: "b".repeat(16) }],
    });

    expect(mocks.setVapidDetails).toHaveBeenCalledWith("mailto:academy@example.test", "B".repeat(87), "C".repeat(43));
    expect(mocks.sendNotification).toHaveBeenCalledWith({
      endpoint: "https://push.example.test/subscription",
      keys: { p256dh: "a".repeat(32), auth: "b".repeat(16) },
    }, expect.stringContaining("Шинэ хичээл нэмэгдлээ"));
    expect(outcomes).toEqual(expect.arrayContaining([
      expect.objectContaining({ channel: "email", status: "skipped" }),
      expect.objectContaining({ channel: "push", status: "sent", detail: "1 browser subscription(s) notified." }),
    ]));
  });
});
