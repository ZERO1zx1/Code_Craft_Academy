import { beforeEach, describe, expect, it, vi } from "vitest";
import { encodeOAuthState, OAUTH_STATE_COOKIE, COOKIE_NAME } from "@shared/const";

const { exchangeCodeForToken, getUserInfo, createSessionToken, upsertUser } = vi.hoisted(() => ({
  exchangeCodeForToken: vi.fn(),
  getUserInfo: vi.fn(),
  createSessionToken: vi.fn(),
  upsertUser: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({
  sdk: { exchangeCodeForToken, getUserInfo, createSessionToken },
}));
vi.mock("./db", () => ({ upsertUser }));

import { registerOAuthRoutes } from "./_core/oauth";

type Handler = (req: any, res: any) => Promise<void>;

describe("OAuth callback persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exchangeCodeForToken.mockResolvedValue({ accessToken: "access-token" });
    getUserInfo.mockResolvedValue({ openId: "oauth-user-42", name: "OAuth Learner", email: "learner@example.com", loginMethod: "google" });
    createSessionToken.mockResolvedValue("session-token");
    upsertUser.mockResolvedValue(undefined);
  });

  it("upserts the OAuth learner and issues a session cookie before redirecting", async () => {
    let handler: Handler | undefined;
    const app = { get: vi.fn((_path: string, callback: Handler) => { handler = callback; }) };
    registerOAuthRoutes(app as any);

    const state = encodeOAuthState({ redirectUri: "https://app.example.com", nonce: "nonce-42" });
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      clearCookie: vi.fn(),
      cookie: vi.fn(),
      redirect: vi.fn(),
    };

    await handler?.({
      query: { code: "oauth-code", state },
      headers: { cookie: `${OAUTH_STATE_COOKIE}=nonce-42` },
    }, response);

    expect(upsertUser).toHaveBeenCalledWith(expect.objectContaining({ openId: "oauth-user-42", email: "learner@example.com" }));
    expect(createSessionToken).toHaveBeenCalledWith("oauth-user-42", expect.any(Object));
    expect(response.clearCookie).toHaveBeenCalledWith(OAUTH_STATE_COOKIE, expect.any(Object));
    expect(response.cookie).toHaveBeenCalledWith(COOKIE_NAME, "session-token", expect.objectContaining({ maxAge: expect.any(Number) }));
    expect(response.redirect).toHaveBeenCalledWith(302, "/");
  });

  it("rejects a callback when the state nonce does not match the browser cookie", async () => {
    let handler: Handler | undefined;
    const app = { get: vi.fn((_path: string, callback: Handler) => { handler = callback; }) };
    registerOAuthRoutes(app as any);
    const state = encodeOAuthState({ redirectUri: "https://app.example.com", nonce: "expected" });
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };

    await handler?.({ query: { code: "oauth-code", state }, headers: { cookie: `${OAUTH_STATE_COOKIE}=different` } }, response);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(upsertUser).not.toHaveBeenCalled();
  });
});
