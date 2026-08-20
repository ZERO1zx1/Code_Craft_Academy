import webpush from "web-push";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("browser push VAPID configuration", () => {
  it("exposes the configured public key to an authenticated learner while accepting the full server-side key set", async () => {
    expect(process.env.VAPID_PUBLIC_KEY).toBeTruthy();
    expect(process.env.VAPID_PRIVATE_KEY).toBeTruthy();
    expect(process.env.VAPID_SUBJECT).toMatch(/^mailto:|^https:\/\//);

    expect(() => webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    )).not.toThrow();

    const caller = appRouter.createCaller({
      user: { id: 1 } as TrpcContext["user"],
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    } satisfies TrpcContext);
    const config = await caller.notifications.pushConfig();

    expect(config).toEqual({ publicKey: process.env.VAPID_PUBLIC_KEY });
    expect(config.publicKey).not.toContain(process.env.VAPID_PRIVATE_KEY!);
  });
});
