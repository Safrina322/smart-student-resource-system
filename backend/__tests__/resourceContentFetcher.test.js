import { describe, it, expect } from "vitest";
import { isPrivateOrReservedIp, isSafeResourceUrl } from "../utils/resourceContentFetcher.js";

describe("isPrivateOrReservedIp", () => {
  it("flags loopback, private, and link-local IPv4 ranges", () => {
    expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("10.0.0.5")).toBe(true);
    expect(isPrivateOrReservedIp("172.16.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("192.168.1.1")).toBe(true);
    expect(isPrivateOrReservedIp("169.254.169.254")).toBe(true); // cloud metadata endpoint
  });

  it("allows public IPv4 addresses", () => {
    expect(isPrivateOrReservedIp("8.8.8.8")).toBe(false);
    expect(isPrivateOrReservedIp("172.32.0.1")).toBe(false); // just outside 172.16/12
  });

  it("flags loopback and unique-local IPv6 ranges", () => {
    expect(isPrivateOrReservedIp("::1")).toBe(true);
    expect(isPrivateOrReservedIp("fe80::1")).toBe(true);
    expect(isPrivateOrReservedIp("fd00::1")).toBe(true);
  });

  it("fails closed for unparseable input", () => {
    expect(isPrivateOrReservedIp("not-an-ip")).toBe(true);
  });
});

describe("isSafeResourceUrl", () => {
  it("rejects non-http(s) protocols", async () => {
    expect(await isSafeResourceUrl("file:///etc/passwd")).toBe(false);
    expect(await isSafeResourceUrl("ftp://example.com/file.pdf")).toBe(false);
  });

  it("rejects localhost", async () => {
    expect(await isSafeResourceUrl("http://localhost/secret")).toBe(false);
  });

  it("rejects a raw private IP literal without doing a DNS lookup", async () => {
    expect(await isSafeResourceUrl("http://127.0.0.1/admin")).toBe(false);
    expect(await isSafeResourceUrl("http://169.254.169.254/latest/meta-data")).toBe(false);
  });

  it("rejects malformed URLs", async () => {
    expect(await isSafeResourceUrl("not a url")).toBe(false);
  });
});
