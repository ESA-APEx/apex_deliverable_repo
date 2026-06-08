import { createServerFn } from "@tanstack/react-start";

import { getServerConfig } from "../config.server";
import {
  normalizeDeliverablesConfig,
  type DeliverablesConfig,
} from "../deliverables";

const EXTERNAL_CACHE_TTL_MS = 2 * 60 * 1000;

const externalCache = new Map<string, { fetchedAtMs: number; config: DeliverablesConfig }>();

function isDeliverablesConfig(value: unknown): value is DeliverablesConfig {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DeliverablesConfig>;
  return (
    Array.isArray(candidate.deliverableTypes) &&
    Array.isArray(candidate.projects) &&
    Array.isArray(candidate.deliverables)
  );
}

export const getDeliverablesConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { deliverablesJsonUrl } = getServerConfig();
  const sourceUrl = deliverablesJsonUrl?.trim();

  if (!sourceUrl) {
    throw new Error("DELIVERABLES_JSON_URL is not configured on the server");
  }

  const cached = externalCache.get(sourceUrl);
  if (cached && Date.now() - cached.fetchedAtMs < EXTERNAL_CACHE_TTL_MS) {
    return cached.config;
  }

  try {
    const response = await fetch(sourceUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load external deliverables JSON (${response.status})`);
    }

    const raw = (await response.json()) as unknown;
    if (!isDeliverablesConfig(raw)) {
      throw new Error("External deliverables JSON has invalid shape");
    }

    const normalized = normalizeDeliverablesConfig(raw);
    externalCache.set(sourceUrl, { fetchedAtMs: Date.now(), config: normalized });
    return normalized;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to load external deliverables JSON");
  }
});
