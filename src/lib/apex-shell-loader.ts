import { getApexShellPayload } from "@/lib/api/apex-shell.functions";

type MountApexShellOptions = {
  sourceUrl?: string;
  headerElementId: string;
  footerElementId: string;
};

type MountResult = {
  mounted: boolean;
  error?: string;
};

type ApexShellPayload = {
  sourceUrl: string;
  fetchedAt: string;
  headerHtml: string;
  mobileNavHtml?: string;
  footerHtml: string;
  stylesheetUrls: string[];
  scriptUrls: string[];
};

const ASSET_TAG = "data-apex-shell-asset";
const LOCAL_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

function cacheKey(sourceUrl: string): string {
  return `apex-shell-cache:${sourceUrl}`;
}

function isValidPayload(value: unknown): value is ApexShellPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<ApexShellPayload>;
  return Boolean(
    payload.sourceUrl &&
    payload.headerHtml &&
    payload.footerHtml &&
    Array.isArray(payload.stylesheetUrls) &&
    Array.isArray(payload.scriptUrls),
  );
}

function readCachedPayload(sourceUrl: string): ApexShellPayload | null {
  try {
    const raw = localStorage.getItem(cacheKey(sourceUrl));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { cachedAt?: number; payload?: unknown };
    if (!parsed.cachedAt || Date.now() - parsed.cachedAt > LOCAL_CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(sourceUrl));
      return null;
    }
    if (!isValidPayload(parsed.payload)) return null;
    return parsed.payload;
  } catch {
    return null;
  }
}

function writeCachedPayload(payload: ApexShellPayload): void {
  try {
    localStorage.setItem(
      cacheKey(payload.sourceUrl),
      JSON.stringify({ cachedAt: Date.now(), payload }),
    );
  } catch {
    // Ignore quota/privacy mode failures.
  }
}

function isExternalOrHashUrl(url: string): boolean {
  return /^(https?:|mailto:|tel:|#|javascript:|data:)/i.test(url);
}

function absolutizeAttributes(fragment: DocumentFragment, baseUrl: string): void {
  const attrs = ["href", "src", "action", "poster"] as const;
  const nodes = fragment.querySelectorAll<HTMLElement>("*");

  for (const node of nodes) {
    for (const attr of attrs) {
      const value = node.getAttribute(attr);
      if (!value || isExternalOrHashUrl(value)) continue;
      node.setAttribute(attr, new URL(value, baseUrl).toString());
    }

    const srcSet = node.getAttribute("srcset");
    if (srcSet) {
      const absoluteSrcSet = srcSet
        .split(",")
        .map((entry) => {
          const [url, descriptor] = entry.trim().split(/\s+/, 2);
          if (!url || isExternalOrHashUrl(url)) return entry.trim();
          return `${new URL(url, baseUrl).toString()}${descriptor ? ` ${descriptor}` : ""}`;
        })
        .join(", ");
      node.setAttribute("srcset", absoluteSrcSet);
    }
  }
}

function htmlToFragment(html: string, baseUrl: string): DocumentFragment {
  const template = document.createElement("template");
  template.innerHTML = html;
  const fragment = template.content.cloneNode(true) as DocumentFragment;
  absolutizeAttributes(fragment, baseUrl);

  fragment.querySelectorAll("script").forEach((scriptEl) => scriptEl.remove());
  return fragment;
}

function ensureStyles(stylesheetUrls: string[]): void {
  for (const href of stylesheetUrls) {
    if (document.head.querySelector(`link[${ASSET_TAG}="style"][href="${href}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    // Keep APEx shell CSS in a dedicated low-priority layer so Tailwind utilities win.
    link.setAttribute("layer", "apex-shell");
    link.setAttribute(ASSET_TAG, "style");
    document.head.appendChild(link);
  }
}

function ensureScripts(scriptUrls: string[]): void {
  for (const src of scriptUrls) {
    if (document.body.querySelector(`script[${ASSET_TAG}="script"][src="${src}"]`)) continue;
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.setAttribute(ASSET_TAG, "script");
    document.body.appendChild(script);
  }
}

function mountFragment(target: HTMLElement, fragment: DocumentFragment): void {
  target.replaceChildren(fragment);
}

function mountFromPayload(
  payload: ApexShellPayload,
  headerHost: HTMLElement,
  footerHost: HTMLElement,
): void {
  ensureStyles(payload.stylesheetUrls);
  ensureScripts(payload.scriptUrls);

  const headerFragment = htmlToFragment(payload.headerHtml, payload.sourceUrl);
  if (payload.mobileNavHtml) {
    headerFragment.appendChild(htmlToFragment(payload.mobileNavHtml, payload.sourceUrl));
  }
  mountFragment(headerHost, headerFragment);
  mountFragment(footerHost, htmlToFragment(payload.footerHtml, payload.sourceUrl));

  headerHost.setAttribute("data-apex-shell-mounted", "true");
  footerHost.setAttribute("data-apex-shell-mounted", "true");
}

export async function mountApexShell(options: MountApexShellOptions): Promise<MountResult> {
  const sourceUrl = options.sourceUrl ?? "https://apex.esa.int/";
  const headerHost = document.getElementById(options.headerElementId);
  const footerHost = document.getElementById(options.footerElementId);

  if (!headerHost || !footerHost) {
    return { mounted: false, error: "Header/footer mount elements not found" };
  }

  try {
    const cachedPayload = readCachedPayload(sourceUrl);
    if (cachedPayload) {
      mountFromPayload(cachedPayload, headerHost, footerHost);

      // Keep cache fresh without blocking initial route rendering.
      void getApexShellPayload({
        data: { sourceUrl },
      })
        .then((payload) => {
          const typedPayload = payload as ApexShellPayload;
          mountFromPayload(typedPayload, headerHost, footerHost);
          writeCachedPayload(typedPayload);
        })
        .catch(() => {
          // Ignore refresh failures when cached shell is already mounted.
        });

      return { mounted: true };
    }

    const payload = (await getApexShellPayload({
      data: { sourceUrl },
    })) as ApexShellPayload;

    mountFromPayload(payload, headerHost, footerHost);
    writeCachedPayload(payload);
    return { mounted: true };
  } catch (error) {
    if (
      headerHost.hasAttribute("data-apex-shell-mounted") &&
      footerHost.hasAttribute("data-apex-shell-mounted")
    ) {
      return { mounted: true };
    }
    return {
      mounted: false,
      error: error instanceof Error ? error.message : "Unknown APEx shell load error",
    };
  }
}
