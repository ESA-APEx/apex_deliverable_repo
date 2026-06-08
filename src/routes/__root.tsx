import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { mountApexShell } from "../lib/apex-shell-loader";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "APEx Deliverables Hub | ESA" },
      {
        name: "description",
        content:
          "Discover APEx project deliverables from ESA Earth Observation activities, including ATBDs, reports and technical documentation.",
      },
      { name: "author", content: "ESA APEx" },
      { property: "og:title", content: "APEx Deliverables Hub" },
      {
        property: "og:description",
        content: "A searchable APEx library of ESA Earth Observation project deliverables.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@esa" },
    ],
    links: [
      { rel: "preconnect", href: "https://apex.esa.int" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="hero-radial">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [liveShellMounted, setLiveShellMounted] = useState(false);
  const [shellReady, setShellReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled) {
        setShellReady(true);
      }
    }, 8000);

    void mountApexShell({
      sourceUrl: "https://apex.esa.int/#",
      headerElementId: "apex-live-header",
      footerElementId: "apex-live-footer",
    })
      .then((result) => {
        if (!cancelled) {
          setLiveShellMounted(result.mounted);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLiveShellMounted(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setShellReady(true);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div id="apex-live-header" className={liveShellMounted ? "" : "hidden"} />
      {shellReady && !liveShellMounted && <HeaderSkeleton />}

      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      {shellReady && <Outlet />}

      <div id="apex-live-footer" className={liveShellMounted ? "" : "hidden"} />
      {shellReady && !liveShellMounted && <FooterSkeleton />}

      {!shellReady && <ShellBlockingScreen />}
    </QueryClientProvider>
  );
}

function ShellBlockingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-surface/60 p-6 text-center backdrop-blur-sm">
        <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">APEx</p>
        <h2 className="mt-2 text-lg font-semibold text-foreground">Loading Deliverables Library</h2>
        <div className="mx-auto mt-5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2/70">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-teal" />
        </div>
      </div>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <header className="border-b border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-3">
        <div className="h-3 w-44 animate-pulse rounded bg-surface-2/70" />
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
        <div className="h-8 w-56 animate-pulse rounded bg-surface-2/70" />
        <div className="hidden gap-4 md:flex">
          <div className="h-4 w-24 animate-pulse rounded bg-surface-2/70" />
          <div className="h-4 w-32 animate-pulse rounded bg-surface-2/70" />
          <div className="h-4 w-20 animate-pulse rounded bg-surface-2/70" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-full bg-surface-2/80" />
      </div>
    </header>
  );
}

function FooterSkeleton() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="h-5 w-52 animate-pulse rounded bg-surface-2/70" />
        <div className="h-4 w-72 animate-pulse rounded bg-surface-2/70" />
      </div>
    </footer>
  );
}
