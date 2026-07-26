import { describe, it, expect } from "vitest";
import { parseJwtPayload, isTokenExpired } from "./jwt.js";

const base64url = (obj) =>
  btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const makeToken = (payload) => `header.${base64url(payload)}.signature`;

describe("parseJwtPayload", () => {
  it("decodes a well-formed JWT payload", () => {
    const token = makeToken({ id: 1, role: "student" });
    expect(parseJwtPayload(token)).toEqual({ id: 1, role: "student" });
  });

  it("returns null for a malformed token", () => {
    expect(parseJwtPayload("not-a-jwt")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parseJwtPayload("")).toBeNull();
  });
});

describe("isTokenExpired", () => {
  it("treats an unparseable token as expired", () => {
    expect(isTokenExpired("garbage")).toBe(true);
  });

  it("treats a token with no exp claim as never expiring", () => {
    const token = makeToken({ id: 1, role: "student" });
    expect(isTokenExpired(token)).toBe(false);
  });

  it("treats a past exp as expired", () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) - 60 });
    expect(isTokenExpired(token)).toBe(true);
  });

  it("treats a future exp as not expired", () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(isTokenExpired(token)).toBe(false);
  });
});
