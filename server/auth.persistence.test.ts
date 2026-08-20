import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const anonymousContext = {
  user: null,
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
} satisfies TrpcContext;

describe("auth-linked learner persistence", () => {
  it("rejects progress reads without an authenticated user", async () => {
    await expect(appRouter.createCaller(anonymousContext).progress.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects progress writes without an authenticated user", async () => {
    await expect(appRouter.createCaller(anonymousContext).progress.update({ courseId: "python", progressPercent: 25 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("keeps the public profile procedure separate from protected progress", async () => {
    const result = await appRouter.createCaller(anonymousContext).profile.public({ userId: 999999 });
    expect(result).toBeUndefined();
  });
});
