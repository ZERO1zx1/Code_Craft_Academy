// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { lessonDetails } from "../shared/curriculum";

let currentAttempt: { score: number } | undefined;
const refetch = vi.fn();
const submitMutate = vi.fn();
let submitOptions: { onSuccess?: () => void } | undefined;

vi.mock("wouter", async () => {
  const React = await import("react");
  return {
    Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => React.createElement("a", { href, ...props }, children),
    useRoute: () => [true, { courseId: "python", lessonId: "py-if" }],
  };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: 412, name: "Quiz Learner" } }),
}));

vi.mock("@/const", () => ({ startLogin: vi.fn() }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    quiz: {
      getAttempt: {
        useQuery: () => ({
          get data() {
            return currentAttempt;
          },
          refetch,
        }),
      },
      submit: {
        useMutation: (options: { onSuccess?: () => void }) => {
          submitOptions = options;
          return { mutate: submitMutate, isPending: false, error: null, reset: vi.fn() };
        },
      },
    },
  },
}));

import Quiz from "../client/src/pages/Quiz";

describe("quiz route interactions", () => {
  afterEach(() => {
    cleanup();
    currentAttempt = undefined;
    refetch.mockReset();
    submitMutate.mockReset();
    submitOptions = undefined;
  });

  it("loads the lesson quiz, records selections, submits answers, shows explanations, and displays the saved score", async () => {
    const questions = lessonDetails["py-if"]?.quiz;
    expect(questions).toHaveLength(2);
    submitMutate.mockImplementation((input) => {
      currentAttempt = { score: 100 };
      submitOptions?.onSuccess?.();
      return input;
    });

    const user = userEvent.setup();
    render(<Quiz />);

    expect(screen.getByRole("heading", { name: "if — нөхцөл шалгах" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Хариултаа шалгах" })).toBeDisabled();

    for (const question of questions!) {
      await user.click(screen.getByRole("button", { name: question.options[question.answer] }));
    }

    const submitButton = screen.getByRole("button", { name: "Хариултаа шалгах" });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitMutate).toHaveBeenCalledWith({
        courseId: "python",
        lessonId: "py-if",
        answers: questions!.map((question) => question.answer),
      });
    });
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(await screen.findAllByText(/Тайлбар:/)).toHaveLength(questions!.length);
    expect(screen.getByText("2/2 · 100%")).toBeInTheDocument();
    expect(screen.getByText("Хадгалагдсан дүн: 100%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Дахин оролдох" })).toBeInTheDocument();
  });

  it("renders an already persisted attempt when the protected quiz query returns it", () => {
    currentAttempt = { score: 50 };
    render(<Quiz />);

    expect(screen.getByText("Хадгалагдсан дүн: 50%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Нөхцөл truthy үед" }));
    expect(screen.getByText("1/2 хариулт сонгогдсон.")).toBeInTheDocument();
  });
});
