import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

function normalizeKey(relKey: string) {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function hasExternalS3() {
  return Boolean(
    process.env.S3_ENDPOINT &&
      process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY
  );
}

function getExternalS3() {
  if (!hasExternalS3()) return null;
  return {
    bucket: process.env.S3_BUCKET!,
    client: new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || "auto",
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    }),
  };
}

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage is not configured. Set S3 variables on Railway or use the managed preview storage environment."
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const external = getExternalS3();

  if (external) {
    await external.client.send(
      new PutObjectCommand({
        Bucket: external.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      })
    );
    const url = await getSignedUrl(
      external.client,
      new GetObjectCommand({ Bucket: external.bucket, Key: key }),
      { expiresIn: 300 }
    );
    return { key, url };
  }

  const { forgeUrl, forgeKey } = getForgeConfig();
  const presignUrl = new URL("v1/storage/presign/put", `${forgeUrl}/`);
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });
  if (!presignResp.ok) {
    const message = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${message}`);
  }

  const { url: s3Url } = (await presignResp.json()) as { url: string };
  if (!s3Url) throw new Error("Storage provider returned an empty upload URL");
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: typeof data === "string" ? data : new Uint8Array(data),
  });
  if (!uploadResp.ok) throw new Error(`Storage upload failed (${uploadResp.status})`);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: await storageGetSignedUrl(key) };
}

export async function storageGetSignedUrl(relKey: string) {
  const key = normalizeKey(relKey);
  const external = getExternalS3();

  if (external) {
    return getSignedUrl(
      external.client,
      new GetObjectCommand({ Bucket: external.bucket, Key: key }),
      { expiresIn: 300 }
    );
  }

  const { forgeUrl, forgeKey } = getForgeConfig();
  const getUrl = new URL("v1/storage/presign/get", `${forgeUrl}/`);
  getUrl.searchParams.set("path", key);
  const response = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Storage access failed (${response.status}): ${message}`);
  }
  const { url } = (await response.json()) as { url: string };
  return url;
}
