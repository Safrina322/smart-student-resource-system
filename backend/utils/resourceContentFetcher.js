// Fetches a resource's underlying file so it can be attached to a Gemini
// request as inline media, grounding generation in the real document instead
// of only the title/description. Returns null (never throws) whenever the
// content isn't fetchable or usable, so callers always have a text-only
// fallback path.

import dns from "node:dns/promises";
import net from "node:net";

const MAX_BYTES = 20 * 1024 * 1024; // keep base64 payloads within the free-tier request size comfort zone

const FALLBACK_MIME_BY_RESOURCE_TYPE = {
  PDF: "application/pdf",
  Document: "application/pdf",
};

// resource_link is attacker-influenced (any approved lecturer upload) and
// this fetch runs server-side, so without this check a malicious link could
// make the server reach internal services or cloud metadata endpoints (SSRF).
export const isPrivateOrReservedIp = (ip) => {
  const version = net.isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("::ffff:")) {
      const embedded = lower.split(":").pop();
      return net.isIP(embedded) === 4 ? isPrivateOrReservedIp(embedded) : true;
    }
    return false;
  }
  return true; // not a parseable IP - fail closed
};

export const isSafeResourceUrl = async (urlString) => {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  if (parsed.hostname === "localhost") return false;

  if (net.isIP(parsed.hostname)) {
    return !isPrivateOrReservedIp(parsed.hostname);
  }

  try {
    const addresses = await dns.lookup(parsed.hostname, { all: true });
    return addresses.length > 0 && addresses.every((a) => !isPrivateOrReservedIp(a.address));
  } catch {
    return false;
  }
};

export const fetchResourceMedia = async (resource) => {
  if (!resource?.resource_link) return null;
  if (!["PDF", "Document", "Image"].includes(resource.resource_type)) return null;
  if (!(await isSafeResourceUrl(resource.resource_link))) return null;

  try {
    const response = await fetch(resource.resource_link);
    if (!response.ok) return null;

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength && contentLength > MAX_BYTES) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_BYTES) return null;

    const contentType = (response.headers.get("content-type") || "").split(";")[0].trim();
    const mimeType = contentType || FALLBACK_MIME_BY_RESOURCE_TYPE[resource.resource_type];
    if (!mimeType || (!mimeType.startsWith("application/pdf") && !mimeType.startsWith("image/"))) {
      return null;
    }

    return { mimeType, data: buffer.toString("base64") };
  } catch {
    return null;
  }
};
