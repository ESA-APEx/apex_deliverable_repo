
export type DeliverableType = string;

export interface DeliverableTypeMeta {
  code: string;
  name: string;
  description: string;
}

export interface Project {
  id: string;
  acronym: string;
  name: string;
  domain: string;
  lead: string;
}

export interface Deliverable {
  id: string;
  code: string;
  title: string;
  type: string;
  projectId: string;
  version: string;
  issuedOn: string; // ISO date
  downloadUrl: string;
  abstract: string;
}

export interface DeliverablesConfig {
  deliverableTypes: DeliverableTypeMeta[];
  projects: Project[];
  deliverables: Deliverable[];
}

interface RawDeliverablesConfig {
  deliverableTypes: DeliverableTypeMeta[];
  projects: Project[];
  deliverables: Array<Omit<Deliverable, "issuedOn"> & { issuedOn: string | Date }>;
}

function toIsoDate(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

export function normalizeDeliverablesConfig(config: RawDeliverablesConfig): DeliverablesConfig {
  return {
    deliverableTypes: config.deliverableTypes,
    projects: config.projects,
    deliverables: config.deliverables.map((d) => ({
      ...d,
      version: String(d.version),
      issuedOn: toIsoDate(d.issuedOn),
    })),
  };
}
