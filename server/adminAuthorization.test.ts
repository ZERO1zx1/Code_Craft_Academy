import { describe, expect, it } from "vitest";
import { NOT_ADMIN_ERR_MSG } from "../shared/const";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createLearnerContext(): TrpcContext {
  return {
    user: { id: 42, openId: "learner-42", name: "Learner", email: "learner@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("admin router authorization", () => {
  it("rejects a learner before any teacher data can be requested", async () => {
    const caller = appRouter.createCaller(createLearnerContext());
    await expect(caller.admin.overview()).rejects.toThrow(NOT_ADMIN_ERR_MSG);
  });
});
