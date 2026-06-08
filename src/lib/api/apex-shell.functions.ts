import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  sourceUrl: z.string().url().default("https://apex.esa.int/"),
});

const HEADER_RE = /<header[\s\S]*?<\/header>/i;
const MOBILE_NAV_RE = /<aside[\s\S]*?<\/aside>/i;
const FOOTER_RE = /<footer[\s\S]*?<\/footer>/i;
const STYLESHEET_RE =
  /<link[^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
const SCRIPT_RE = /<script[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi;

const SHELL_CACHE_TTL_MS = 5 * 60 * 1000;

type ApexShellPayload = {
  sourceUrl: string;
  fetchedAt: string;
  headerHtml: string;
  mobileNavHtml: string;
  footerHtml: string;
  stylesheetUrls: string[];
  scriptUrls: string[];
};

const shellCache = new Map<string, { fetchedAtMs: number; payload: ApexShellPayload }>();

function decodeHtmlEntities(value: string): string {
  return value.replaceAll("&amp;", "&");
}

function toAbsoluteUrl(url: string, base: string): string {
  const decoded = decodeHtmlEntities(url.trim());
  return new URL(decoded, base).toString();
}

function extractAll(regex: RegExp, input: string): string[] {
  const values: string[] = [];
  let match = regex.exec(input);
  while (match) {
    const value = match[1]?.trim();
    if (value) values.push(value);
    match = regex.exec(input);
  }
  return values;
}

function shouldKeepScript(url: string): boolean {
  return !/matomo|cookie_compliance/i.test(url);
}

export const getApexShellPayload = createServerFn({ method: "POST" })
  .inputValidator(inputSchema)
  .handler(async ({ data }) => {
    const source = data.sourceUrl;
    const cached = shellCache.get(source);
    if (cached && Date.now() - cached.fetchedAtMs < SHELL_CACHE_TTL_MS) {
      return cached.payload;
    }

    const response = await fetch(source, {
      cache: "no-store",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch APEx shell (${response.status})`);
    }

    const html = await response.text();
    const headerHtml = html.match(HEADER_RE)?.[0] ?? "";
    const mobileNavHtml = html.match(MOBILE_NAV_RE)?.[0] ?? "";
    const footerHtml = html.match(FOOTER_RE)?.[0] ?? "";

    if (!headerHtml || !footerHtml) {
      throw new Error("Could not extract APEx header/footer from source HTML");
    }

    const stylesheetUrls = extractAll(STYLESHEET_RE, html).map((url) => toAbsoluteUrl(url, source));
    const scriptUrls = extractAll(SCRIPT_RE, html)
      .filter(shouldKeepScript)
      .map((url) => toAbsoluteUrl(url, source));

    const payload: ApexShellPayload = {
      sourceUrl: source,
      fetchedAt: new Date().toISOString(),
      headerHtml,
      mobileNavHtml,
      footerHtml,
      stylesheetUrls: Array.from(new Set(stylesheetUrls)),
      scriptUrls: Array.from(new Set(scriptUrls)),
    };

    shellCache.set(source, { fetchedAtMs: Date.now(), payload });
    return payload;
  });
