import { describe, expect, it } from "vitest";
import { buildCertificateProfileUrl } from "../client/src/lib/certificateProfileQr";

describe("certificate profile QR target", () => {
  it("resolves to the learner's canonical public profile without a double slash", () => {
    expect(buildCertificateProfileUrl("https://codecraft.example/", 42)).toBe("https://codecraft.example/profile/42");
  });
});
