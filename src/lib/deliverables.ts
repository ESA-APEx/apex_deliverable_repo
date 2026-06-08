import yaml from "js-yaml";
import deliverablesYaml from "@/data/deliverables.yaml?raw";

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
  authors: string[];
  abstract: string;
}

interface DeliverablesConfig {
  deliverableTypes: DeliverableTypeMeta[];
  projects: Project[];
  deliverables: Array<Omit<Deliverable, "issuedOn"> & { issuedOn: string | Date }>;
}

const parsed = yaml.load(deliverablesYaml) as DeliverablesConfig;

function toIsoDate(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

export const DELIVERABLE_TYPES: DeliverableTypeMeta[] = parsed.deliverableTypes;
export const PROJECTS: Project[] = parsed.projects;
export const DELIVERABLES: Deliverable[] = parsed.deliverables.map((d) => ({
  ...d,
  version: String(d.version),
  issuedOn: toIsoDate(d.issuedOn),
}));

export function getProject(id: string) {
  return PROJECTS.find((p) => p.id === id);
}

export function getType(code: string) {
  return DELIVERABLE_TYPES.find((t) => t.code === code);
}
