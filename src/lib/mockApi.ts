import type { AISubscriptionItem, ProjectItem } from "@/lib/types";

type ListResponse<T> = { items: T[] };

type Db = {
  projects: ProjectItem[];
  aiSubscriptions: AISubscriptionItem[];
};

const STORAGE_KEY = "mockApiDb:v1";

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

function readDb(): Db {
  if (typeof window === "undefined") {
    return { projects: [], aiSubscriptions: [] };
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { projects: [], aiSubscriptions: [] };
  try {
    const parsed = JSON.parse(raw) as any;
    return {
      projects: parsed.projects || [],
      aiSubscriptions: parsed.aiSubscriptions || [],
    };
  } catch {
    return { projects: [], aiSubscriptions: [] };
  }
}

function writeDb(db: Db) {
  if (typeof window === "undefined") return;
  const existing = window.localStorage.getItem(STORAGE_KEY);
  let merged: any = {};
  if (existing) {
    try {
      merged = JSON.parse(existing);
    } catch {}
  }
  merged.projects = db.projects;
  merged.aiSubscriptions = db.aiSubscriptions;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

function jsonBody(init?: RequestInit) {
  if (!init?.body) return undefined;
  if (typeof init.body === "string") {
    try {
      return JSON.parse(init.body);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function methodOf(init?: RequestInit) {
  return (init?.method || "GET").toUpperCase();
}

function pathParts(path: string) {
  const clean = path.split("?")[0];
  return clean.split("/").filter(Boolean);
}

export async function mockApiFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const method = methodOf(init);
  const parts = pathParts(path);
  const body = jsonBody(init) as any;

  const db = readDb();

  // PROJECTS
  if (parts[0] === "projects") {
    if (parts.length === 1 && method === "GET") {
      return { items: db.projects } as ListResponse<ProjectItem> as T;
    }
    if (parts.length === 1 && method === "POST") {
      const created: ProjectItem = {
        id: newId("pr"),
        clientName: String(body?.clientName || "").trim(),
        projectName: String(body?.projectName || "").trim(),
        domainName: String(body?.domainName || "").trim(),
        domainProvider: body?.domainProvider,
        domainProviderOther: body?.domainProviderOther ?? null,
        domainEmailId: body?.domainEmailId,
        domainUsername: body?.domainUsername ?? null,
        hostingPlatform: body?.hostingPlatform ?? "Netlify",
        deploymentEmailId: body?.deploymentEmailId,
        deploymentUsername: body?.deploymentUsername ?? null,
        domainPurchaseDate: body?.domainPurchaseDate ?? null,
        domainRenewalDate: body?.domainRenewalDate ?? null,
        hostingStartDate: body?.hostingStartDate ?? null,
        hostingRenewalDate: body?.hostingRenewalDate ?? null,
        status: body?.status,
        notes: body?.notes ?? null,
        projectAmount: body?.projectAmount ?? null,
        paymentStatus: body?.paymentStatus ?? null,
        completedDate: body?.completedDate ?? null,
        pendingAmount: body?.pendingAmount ?? null,
        attentionState: body?.attentionState ?? null,
      };
      db.projects.unshift(created);
      writeDb(db);
      return created as T;
    }
    if (parts.length === 2 && method === "PUT") {
      const id = parts[1];
      const idx = db.projects.findIndex((x) => x.id === id);
      if (idx < 0) throw new Error("Not found");
      const updated: ProjectItem = { ...db.projects[idx], ...body, id };
      db.projects[idx] = updated;
      writeDb(db);
      return updated as T;
    }
    if (parts.length === 2 && method === "DELETE") {
      const id = parts[1];
      db.projects = db.projects.filter((x) => x.id !== id);
      writeDb(db);
      return undefined as T;
    }
  }

  // AI SUBSCRIPTIONS
  if (parts[0] === "ai-subscriptions") {
    if (parts.length === 1 && method === "GET") {
      return { items: db.aiSubscriptions } as ListResponse<AISubscriptionItem> as T;
    }
    if (parts.length === 1 && method === "POST") {
      const created: AISubscriptionItem = {
        id: newId("ai"),
        toolName: String(body?.toolName || "").trim(),
        platform: body?.platform,
        platformOther: body?.platformOther ?? null,
        emailId: body?.emailId,
        password: body?.password ?? null,
        subscriptionType: body?.subscriptionType,
        startDate: body?.startDate ?? null,
        endDate: body?.endDate ?? null,
        cancelByDate: body?.cancelByDate ?? null,
        manualStatus: body?.manualStatus ?? null,
        notes: body?.notes ?? null,
        attentionState: body?.attentionState ?? null,
      };
      db.aiSubscriptions.unshift(created);
      writeDb(db);
      return created as T;
    }
    if (parts.length === 2 && method === "PUT") {
      const id = parts[1];
      const idx = db.aiSubscriptions.findIndex((x) => x.id === id);
      if (idx < 0) throw new Error("Not found");
      const updated: AISubscriptionItem = { ...db.aiSubscriptions[idx], ...body, id };
      db.aiSubscriptions[idx] = updated;
      writeDb(db);
      return updated as T;
    }
    if (parts.length === 2 && method === "DELETE") {
      const id = parts[1];
      db.aiSubscriptions = db.aiSubscriptions.filter((x) => x.id !== id);
      writeDb(db);
      return undefined as T;
    }
  }

  throw new Error(`Mock API: unhandled route ${method} ${path}`);
}
