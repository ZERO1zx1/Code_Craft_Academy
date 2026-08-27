/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FreePathLesson from "./FreePathLesson";

vi.mock("wouter", () => ({
  Link: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => <a href={href} className={className}>{children}</a>,
}));

describe("frontend-only lesson routes", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  it("opens the lesson navigation and checks an HTML quest without storing progress", async () => {
    render(<FreePathLesson params={{ language: "html", lesson: "html-what-is-html" }} />);
    const toggle = screen.getByRole("button", { name: /24 lesson харах/ });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Код шалгах" }));
    await waitFor(() => expect(screen.getByText(/Quest амжилттай боллоо/)).toBeTruthy());
  });

  it("checks a GitHub command locally without a remote repository or API", async () => {
    render(<FreePathLesson params={{ language: "github", lesson: "github-what-is-github" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Command шалгах" }));
    await waitFor(() => expect(screen.getByText(/Command structure зөв байна/)).toBeTruthy());
  });

  it("opens later lessons directly without requiring prior quest completion", () => {
    const routes = [
      { language: "html", lesson: "html-aria-label", title: /aria-label/ },
      { language: "javascript", lesson: "js-try-catch", title: /try\/catch/ },
      { language: "python", lesson: "py-class", title: /class/ },
      { language: "github", lesson: "github-flow", title: /GitHub flow/ },
    ] as const;
    routes.forEach((route) => {
      render(<FreePathLesson params={route} />);
      expect(screen.getAllByRole("heading", { name: route.title }).length).toBeGreaterThan(0);
      expect(screen.queryByText("NODE LOCKED")).toBeNull();
      cleanup();
    });
  });
});
