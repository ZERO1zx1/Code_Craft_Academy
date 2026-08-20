import { describe, expect, it } from "vitest";
import { formatTutorAnswer } from "./routers";

describe("AI tutor response handling", () => {
  it("returns a normal text answer", () => {
    expect(formatTutorAnswer("Алхам алхмаар шалгаарай.")).toBe("Алхам алхмаар шалгаарай.");
  });

  it("joins structured text content from the model", () => {
    expect(formatTutorAnswer([{ text: "Эхлээд " }, { text: "condition-оо шалга." }])).toBe("Эхлээд condition-оо шалга.");
  });

  it("returns a safe retry message when the model has no usable answer", () => {
    expect(formatTutorAnswer(undefined)).toContain("дахин оролдоно уу");
    expect(formatTutorAnswer("   ")).toContain("дахин оролдоно уу");
  });
});
