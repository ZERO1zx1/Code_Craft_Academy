import { describe, expect, it, vi } from "vitest";
import { saveBeforeConfirm } from "./persistenceState";

describe("saveBeforeConfirm", () => {
  it("confirms the UI only after the durable write resolves", async () => {
    const confirm = vi.fn();
    const reject = vi.fn();
    const saved = await saveBeforeConfirm(async () => "saved", confirm, reject);

    expect(saved).toBe(true);
    expect(confirm).toHaveBeenCalledOnce();
    expect(reject).not.toHaveBeenCalled();
  });

  it("keeps the UI unconfirmed when the durable write fails", async () => {
    const confirm = vi.fn();
    const reject = vi.fn();
    const saved = await saveBeforeConfirm(async () => { throw new Error("offline"); }, confirm, reject);

    expect(saved).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
    expect(reject).toHaveBeenCalledOnce();
  });
});
