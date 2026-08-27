import { describe, expect, it } from "vitest";
import { countUnreadNotifications, notificationReadPayload } from "./notificationState";

describe("notification center state", () => {
  it("counts unread rows without counting read notifications", () => {
    expect(countUnreadNotifications([{ id: 1, readAt: null }, { id: 2, readAt: new Date() }, { id: 3, readAt: null }])).toBe(2);
  });

  it("creates distinct mark-one and mark-all payloads", () => {
    expect(notificationReadPayload(8)).toEqual({ notificationIds: [8] });
    expect(notificationReadPayload()).toEqual({});
  });
});
