/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readLearningState } from "@/lib/localLearning";
import LearningHub from "./LearningHub";

vi.mock("wouter", () => ({
  Link: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => <a href={href} className={className}>{children}</a>,
}));

describe("free learning hub discovery tools", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  it("filters paths by a lesson keyword without using an API", () => {
    render(<LearningHub />);
    fireEvent.change(screen.getByRole("textbox", { name: "Хичээл хайх" }), { target: { value: "branch" } });
    expect(screen.getByText("Open Source Workflow Lab")).toBeTruthy();
    expect(screen.queryByText("Semantic HTML Portfolio")).toBeNull();
    expect(screen.getByText("2 matching lesson")).toBeTruthy();
  });

  it("filters paths with a topic chip independently from the language filter", () => {
    render(<LearningHub />);
    fireEvent.click(screen.getByRole("button", { name: "Git workflow" }));
    expect(screen.getByText("Open Source Workflow Lab")).toBeTruthy();
    expect(screen.queryByText("Semantic HTML Portfolio")).toBeNull();
    expect(screen.getAllByText(/Git workflow lesson/).length).toBeGreaterThan(0);
  });

  it("stores a checked GitHub portfolio task only in local browser state", async () => {
    render(<LearningHub />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Profile README repository/ }));
    await waitFor(() => expect(readLearningState().portfolioChecklistIds).toContain("profile-readme"));
    expect(screen.getByText("1 / 8")).toBeTruthy();
  });
});
