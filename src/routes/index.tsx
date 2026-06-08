import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight, Download, FileText, Filter, Search, X } from "lucide-react";
import { DELIVERABLES, DELIVERABLE_TYPES, PROJECTS, getProject, getType } from "@/lib/deliverables";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "APEx Deliverables Library — Earth Observation Project Documents" },
      {
        name: "description",
        content:
          "Browse, filter and download the document deliverables produced by ESA APEx Earth Observation projects — ATBDs, validation reports, design documents and more.",
      },
      { property: "og:title", content: "APEx Deliverables Library" },
      {
        property: "og:description",
        content:
          "Project management plans, ATBDs, validation reports and final reports from ESA APEx Earth Observation activities.",
      },
    ],
  }),
  component: DeliverablesPage,
});

function DeliverablesPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | "all">("all");
  const [projectId, setProjectId] = useState<string | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DELIVERABLES.filter((d) => {
      if (type !== "all" && d.type !== type) return false;
      if (projectId !== "all" && d.projectId !== projectId) return false;
      if (!q) return true;
      const proj = getProject(d.projectId);
      const haystack = [
        d.title,
        d.code,
        d.abstract,
        d.authors.join(" "),
        proj?.acronym ?? "",
        proj?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    }).sort((a, b) => b.issuedOn.localeCompare(a.issuedOn));
  }, [query, type, projectId]);

  const activeFilters = (type !== "all" ? 1 : 0) + (projectId !== "all" ? 1 : 0);

  const clearAll = () => {
    setQuery("");
    setType("all");
    setProjectId("all");
  };

  return (
    <div className="min-h-screen">
      <Hero total={DELIVERABLES.length} />

      {/* Type quick chips */}
      <section className="mx-auto max-w-7xl px-6 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setType("all")} className={chipClass(type === "all")}>
            All types
            <span className="ml-2 text-xs opacity-70">{DELIVERABLES.length}</span>
          </button>
          {DELIVERABLE_TYPES.map((t) => {
            const count = DELIVERABLES.filter((d) => d.type === t.code).length;
            return (
              <button
                key={t.code}
                onClick={() => setType(t.code)}
                title={t.name}
                className={chipClass(type === t.code)}
              >
                <span className="font-mono">{t.code}</span>
                <span className="ml-1 hidden sm:inline opacity-80">· {t.name}</span>
                <span className="ml-2 text-xs opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Filters bar */}
      <section className="mx-auto max-w-7xl px-6 pt-8">
        <div className="rounded-2xl border border-border bg-foreground/90 backdrop-blur-sm p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto]">
            <label className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-background" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, code, author, abstract…"
                className="w-full rounded-full border border-border bg-foreground text-background py-2.5 pl-10 pr-4 text-sm outline-none ring-teal/0 focus:border-teal/60 focus:ring-2 focus:ring-teal/30"
              />
            </label>

            <Select
              value={projectId}
              onChange={(v) => setProjectId(v as string)}
              options={[
                { value: "all", label: "All projects" },
                ...PROJECTS.map((p) => ({ value: p.id, label: p.acronym })),
              ]}
            />

            <button
              onClick={clearAll}
              disabled={!query && activeFilters === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground/90 transition hover:border-teal/50 hover:text-teal disabled:opacity-40"
            >
              <X className="h-4 w-4" /> Clear
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-background">
            <div className="inline-flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" />
              {filtered.length} of {DELIVERABLES.length} deliverables
              {activeFilters > 0 && (
                <span>
                  · {activeFilters} active filter{activeFilters > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section id="results" className="mx-auto max-w-7xl px-6 py-10">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-foreground/95 p-12 text-center">
            <p className="text-background">No deliverables match your filters.</p>
            <button
              onClick={clearAll}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2 text-sm font-medium text-foreground hover:opacity-90"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((d) => {
              const proj = getProject(d.projectId)!;
              const tMeta = getType(d.type)!;
              return (
                <li
                  key={d.id}
                  className="group relative flex flex-col rounded-2xl border border-border bg-foreground/95 p-5 transition hover:border-teal/50 hover:bg-foreground"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal/15 text-teal">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-[11px] font-mono uppercase tracking-wider text-teal">
                          {d.type} · {tMeta.name}
                        </div>
                        <div className="font-mono text-[11px] text-background/70">{d.code}</div>
                      </div>
                    </div>
                  </div>

                  <h3 className="mt-4 text-lg font-bold! leading-snug text-background!">
                    {d.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm text-background/70">{d.abstract}</p>

                  <dl className="mt-4 grid grid-cols-2 gap-y-2 text-xs">
                    <dt className="text-background/70">Project</dt>
                    <dd className="text-right font-medium text-background">{proj.acronym}</dd>

                    <dt className="text-background/70">Issued</dt>
                    <dd className="text-right text-background/90">
                      {new Date(d.issuedOn).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </dd>

                    <dt className="text-background/70">Version</dt>
                    <dd className="text-right text-background/90">v{d.version}</dd>

                    <dt className="text-background/70">Authors</dt>
                    <dd
                      className="truncate text-right text-background/90"
                      title={d.authors.join(", ")}
                    >
                      {d.authors.join(", ")}
                    </dd>
                  </dl>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <button
                      type="button"
                      onClick={() => window.open(d.downloadUrl, "_blank", "noopener,noreferrer")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-teal px-3.5 py-1.5 text-xs font-medium text-foreground transition hover:opacity-90"
                    >
                      <Download className="h-3.5 w-3.5" />{" "}
                      <span className="text-sm text-foreground">
                        {getDownloadLabel(d.downloadUrl)}
                      </span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function getDownloadLabel(url: string) {
  const clean = url.split(/[?#]/)[0] ?? "";
  const fileName = clean.split("/").pop() ?? "";
  const extension = fileName.includes(".") ? (fileName.split(".").pop() ?? "") : "";
  const upper = extension.toUpperCase();
  return upper ? `Download ${upper}` : "Download file";
}

function chipClass(active: boolean) {
  return [
    "inline-flex items-center rounded-full border px-3 py-1.5 text-xs transition",
    active
      ? "border-teal bg-teal text-primary-foreground"
      : "border-border bg-surface/60 text-foreground/85 hover:border-teal/50 hover:text-teal",
  ].join(" ");
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-full border border-border bg-foreground text-background py-2.5 pl-4 pr-9 text-sm outline-none focus:border-teal/60 focus:ring-2 focus:ring-teal/30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-background bg-foreground">
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-background"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Hero({ total }: { total: number }) {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid-faint absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-6 pt-10 md:pt-18">
        <div className="max-w-3xl">
          <h1 className="mt-6 text-4xl font-bold! leading-tight tracking-tight md:text-6xl">
            APEx Document Repository
          </h1>
          <p className="my-5 max-w-2xl text-base text-foreground/80">
            Browse {total} document deliverables produced by ESA Earth Observation projects,
            filterable by type, project and status.
          </p>
        </div>
      </div>
    </section>
  );
}