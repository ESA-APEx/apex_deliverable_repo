import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Download,
  FileText,
  Filter,
  Search,
  X,
} from "lucide-react";
import {
  DELIVERABLES,
  DELIVERABLE_TYPES,
  PROJECTS,
  getProject,
  getType,
  type DeliverableStatus,
  type DeliverableType,
} from "@/lib/deliverables";

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

const STATUSES: DeliverableStatus[] = ["Draft", "Issued", "Accepted", "Superseded"];

function statusClasses(status: DeliverableStatus) {
  switch (status) {
    case "Accepted":
      return "bg-teal/10 text-teal border-teal/30";
    case "Issued":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Draft":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Superseded":
      return "bg-slate-50 text-slate-400 border-slate-200";
  }
}

function DeliverablesPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<DeliverableType | "all">("all");
  const [projectId, setProjectId] = useState<string | "all">("all");
  const [status, setStatus] = useState<DeliverableStatus | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DELIVERABLES.filter((d) => {
      if (type !== "all" && d.type !== type) return false;
      if (projectId !== "all" && d.projectId !== projectId) return false;
      if (status !== "all" && d.status !== status) return false;
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
  }, [query, type, projectId, status]);

  const activeFilters =
    (type !== "all" ? 1 : 0) +
    (projectId !== "all" ? 1 : 0) +
    (status !== "all" ? 1 : 0);

  const clearAll = () => {
    setQuery("");
    setType("all");
    setProjectId("all");
    setStatus("all");
  };

  return (
    <div className="min-h-screen">
      <Header />

      <Hero total={DELIVERABLES.length} />

      {/* Type quick chips */}
      <section className="mx-auto max-w-7xl px-6 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setType("all")}
            className={chipClass(type === "all")}
          >
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
        <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-sm p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
            <label className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, code, author, abstract…"
                className="w-full rounded-full border border-border bg-background/60 py-2.5 pl-10 pr-4 text-sm outline-none ring-teal/0 focus:border-teal/60 focus:ring-2 focus:ring-teal/30"
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

            <Select
              value={status}
              onChange={(v) => setStatus(v as DeliverableStatus | "all")}
              options={[
                { value: "all", label: "Any status" },
                ...STATUSES.map((s) => ({ value: s, label: s })),
              ]}
            />

            <button
              onClick={clearAll}
              disabled={!query && activeFilters === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background/40 px-4 py-2.5 text-sm text-foreground/90 transition hover:border-teal/50 hover:text-teal disabled:opacity-40"
            >
              <X className="h-4 w-4" /> Clear
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" />
              {filtered.length} of {DELIVERABLES.length} deliverables
              {activeFilters > 0 && <span>· {activeFilters} active filter{activeFilters > 1 ? "s" : ""}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-sm p-12 text-center">
            <p className="text-foreground/90">No deliverables match your filters.</p>
            <button
              onClick={clearAll}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
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
                  className="group relative flex flex-col rounded-2xl border border-border bg-surface/70 p-5 transition hover:border-teal/40 hover:bg-white hover:shadow-sm"
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
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {d.code}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusClasses(d.status)}`}
                    >
                      {d.status}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold leading-snug text-foreground">
                    {d.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {d.abstract}
                  </p>

                  <dl className="mt-4 grid grid-cols-2 gap-y-2 text-xs">
                    <dt className="text-muted-foreground">Project</dt>
                    <dd className="text-right font-medium text-foreground">{proj.acronym}</dd>

                    <dt className="text-muted-foreground">Issued</dt>
                    <dd className="text-right text-foreground/90">
                      {new Date(d.issuedOn).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </dd>

                    <dt className="text-muted-foreground">Version</dt>
                    <dd className="text-right text-foreground/90">v{d.version} · {d.pages} pp.</dd>

                    <dt className="text-muted-foreground">Authors</dt>
                    <dd className="truncate text-right text-foreground/90" title={d.authors.join(", ")}>
                      {d.authors.join(", ")}
                    </dd>
                  </dl>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-teal">
                      View details <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                    <button className="inline-flex items-center gap-1.5 rounded-full bg-teal px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90">
                      <Download className="h-3.5 w-3.5" /> PDF
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Footer />
    </div>
  );
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
        className="w-full appearance-none rounded-full border border-border bg-background/60 py-2.5 pl-4 pr-9 text-sm outline-none focus:border-teal/60 focus:ring-2 focus:ring-teal/30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-background text-foreground">
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
      >
        <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-teal/30 bg-white">
      <div className="border-b border-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <a href="https://www.esa.int" className="hover:text-teal" target="_blank" rel="noreferrer">
            → The European Space Agency
          </a>
          <span className="font-semibold tracking-[0.2em] text-foreground/90">ESA</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
        <a href="/" className="flex items-baseline gap-3">
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            AP<span className="text-teal">Ex</span>
          </span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Application Propagation Environments
          </span>
        </a>
        <nav className="hidden items-center gap-7 text-sm text-foreground/85 md:flex">
          <a href="https://apex.esa.int/algorithm-support" className="hover:text-teal" target="_blank" rel="noreferrer">Algorithm Support</a>
          <a href="https://apex.esa.int" className="hover:text-teal" target="_blank" rel="noreferrer">Project Environments</a>
          <span className="text-teal">Deliverables</span>
          <a href="https://apex.esa.int" className="hover:text-teal" target="_blank" rel="noreferrer">Community</a>
        </nav>
        <a
          href="mailto:apex@esa.int"
          className="inline-flex items-center gap-2 rounded-full bg-teal px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Contact us →
        </a>
      </div>
    </header>
  );
}

function Hero({ total }: { total: number }) {
  return (
    <section className="hero-radial relative overflow-hidden">
      <div className="bg-grid-faint absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-teal">
            Deliverables Library
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Every document, from every <span className="text-teal">APEx project</span>.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-foreground/80 md:text-lg">
            Browse {total} document deliverables produced by ESA Earth Observation
            activities — management plans, ATBDs, design documents, validation reports
            and final reports — filterable by type, project and status.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#results" className="inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
              Browse documents →
            </a>
            <a
              href="https://apex.esa.int"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm text-foreground/90 hover:border-teal/60 hover:text-teal"
            >
              About APEx
            </a>
          </div>

          <dl className="mt-12 grid max-w-xl grid-cols-3 gap-6">
            <Stat label="Deliverables" value={total.toString()} />
            <Stat label="Projects" value={PROJECTS.length.toString()} />
            <Stat label="Document types" value={DELIVERABLE_TYPES.length.toString()} />
          </dl>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-3xl font-semibold text-teal">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-lg font-semibold">AP<span className="text-teal">Ex</span></span>
          <span className="text-xs text-muted-foreground">
            Application Propagation Environments · ESA Earth Observation
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} European Space Agency. Deliverables shown for demonstration purposes.
        </div>
      </div>
    </footer>
  );
}
