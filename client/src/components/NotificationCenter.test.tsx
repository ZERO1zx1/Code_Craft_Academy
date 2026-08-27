// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  data: { rows: [{ id: 7, title: "Шинэ feedback", body: "Хариу ирлээ", actionUrl: "/feedback", readAt: null as Date | null, createdAt: new Date() }], unreadCount: 1 },
  mutate: vi.fn(), invalidate: vi.fn(),
}));

vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button> }));
vi.mock("wouter", () => ({ Link: ({ children, onClick, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} onClick={(event) => { event.preventDefault(); onClick?.(event); }}>{children}</a> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ notifications: { list: { invalidate: state.invalidate } } }),
    notifications: {
      list: { useQuery: () => ({ data: state.data, isLoading: false }) },
      markRead: { useMutation: ({ onSuccess }: { onSuccess?: () => void }) => ({ mutate: (payload: unknown) => { state.mutate(payload); onSuccess?.(); } }) },
    },
  },
}));

import { NotificationCenter } from "./NotificationCenter";

describe("NotificationCenter interactions", () => {
  afterEach(() => cleanup());
  beforeEach(() => { state.mutate.mockClear(); state.invalidate.mockClear(); state.data = { rows: [{ id: 7, title: "Шинэ feedback", body: "Хариу ирлээ", actionUrl: "/feedback", readAt: null, createdAt: new Date() }], unreadCount: 1 }; });

  it("marks one notification read when an unread row is opened", () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByLabelText("Мэдэгдэл харах"));
    fireEvent.click(screen.getByText("Шинэ feedback"));
    expect(state.mutate).toHaveBeenCalledWith({ notificationIds: [7] });
  });

  it("marks all notifications read and removes the unread badge after refreshed data arrives", () => {
    const view = render(<NotificationCenter />);
    expect(screen.getByText("1")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Мэдэгдэл харах"));
    fireEvent.click(screen.getByText("Бүгдийг уншсан"));
    expect(state.mutate).toHaveBeenCalledWith({});
    state.data = { rows: [{ ...state.data.rows[0], readAt: new Date() }], unreadCount: 0 };
    view.rerender(<NotificationCenter />);
    expect(screen.queryByText("1")).toBeNull();
  });
});
