function normalizeKey(relKey: string) {
  const segments = relKey
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean);
  if (!segments.length || segments.some(segment => segment === "." || segment === "..")) {
    throw new Error("Invalid storage key");
  }
  return segments.join("/");
}

function appendHashSuffix(relKey: string) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const lastSlash = relKey.lastIndexOf("/");
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot <= lastSlash) return `${relKey}-${hash}`;
  return `${relKey.slice(0, lastDot)}-${hash}${relKey.slice(lastDot)}`;
}

function storageConfig() {
  const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY?.trim();
  if (!accessKey) throw new Error("BUNNY_STORAGE_ACCESS_KEY is not configured");

  return {
    accessKey,
    zone: (process.env.BUNNY_STORAGE_ZONE || "membership-susan").trim(),
    endpoint: (process.env.BUNNY_STORAGE_ENDPOINT || "https://ny.storage.bunnycdn.com").replace(/\/+$/, ""),
  };
}

function storageApiUrl(key: string) {
  const config = storageConfig();
  const encodedPath = key.split("/").map(encodeURIComponent).join("/");
  return {
    config,
    url: `${config.endpoint}/${encodeURIComponent(config.zone)}/${encodedPath}`,
  };
}

export function encodeStorageKey(key: string) {
  return Buffer.from(normalizeKey(key), "utf8").toString("base64url");
}

export function decodeStorageKey(encodedKey: string) {
  return normalizeKey(Buffer.from(encodedKey, "base64url").toString("utf8"));
}

export function protectedMediaUrl(key: string) {
  return `/api/member/media/${encodeStorageKey(key)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const { config, url } = storageApiUrl(key);
  const body = typeof data === "string" ? Buffer.from(data) : new Uint8Array(data);
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: config.accessKey,
      "Content-Type": contentType,
    },
    body,
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`Bunny storage upload failed (${response.status}): ${detail}`);
  }
  return { key, url: protectedMediaUrl(key) };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: protectedMediaUrl(key) };
}

export async function fetchStoredObject(relKey: string, range?: string) {
  const key = normalizeKey(relKey);
  const { config, url } = storageApiUrl(key);
  const headers: Record<string, string> = { AccessKey: config.accessKey };
  if (range) headers.Range = range;
  return fetch(url, { headers });
}
