import type { AccountVaultItem, AISubscriptionItem, ProjectItem } from "@/lib/types";

type ListResponse<T> = { items: T[] };

type Db = {
  accountVault: AccountVaultItem[];
  projects: ProjectItem[];
  aiSubscriptions: AISubscriptionItem[];
};

const STORAGE_KEY = "mockApiDb:v1";

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

function readDb(): Db {
  if (typeof window === "undefined") {
    return { accountVault: [], projects: [], aiSubscriptions: [] };
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { accountVault: [], projects: [], aiSubscriptions: [] };
  try {
    return JSON.parse(raw) as Db;
  } catch {
    return { accountVault: [], projects: [], aiSubscriptions: [] };
  }
}

function writeDb(db: Db) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
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
  // We only support JSON string bodies for this mock.
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

  // ACCOUNT VAULT
  if (parts[0] === "account-vault") {
    if (parts.length === 1 && method === "GET") {
      return { items: db.accountVault } as ListResponse<AccountVaultItem> as T;
    }
    if (parts.length === 1 && method === "POST") {
      const created: AccountVaultItem = {
        id: newId("av"),
        email: String(body?.email || "").trim(),
        platform: body?.platform,
        platformOther: body?.platformOther ?? null,
        username: body?.username ?? null,
        notes: body?.notes ?? null,
        isActive: Boolean(body?.isActive ?? true),
      };
      db.accountVault.unshift(created);
      writeDb(db);
      return created as T;
    }
    if (parts.length === 2 && method === "PUT") {
      const id = parts[1];
      const idx = db.accountVault.findIndex((x) => x.id === id);
      if (idx < 0) throw new Error("Not found");
      const updated: AccountVaultItem = { ...db.accountVault[idx], ...body, id };
      db.accountVault[idx] = updated;
      writeDb(db);
      return updated as T;
    }
    if (parts.length === 2 && method === "DELETE") {
      const id = parts[1];
      // prevent deleting when referenced (matches UI toast expectation)
      const usedByProjects = db.projects.some((p) => p.domainEmailId === id || p.deploymentEmailId === id);
      const usedBySubs = db.aiSubscriptions.some((s) => s.emailId === id);
      if (usedByProjects || usedBySubs) {
        throw new Error("Cannot delete: this email is referenced elsewhere.");
      }
      db.accountVault = db.accountVault.filter((x) => x.id !== id);
      writeDb(db);
      return undefined as T;
    }
  }

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
        domainUsernameOverride: body?.domainUsernameOverride ?? null,
        hostingPlatform: body?.hostingPlatform ?? "Netlify",
        deploymentEmailId: body?.deploymentEmailId,
        deploymentUsernameOverride: body?.deploymentUsernameOverride ?? null,
        domainPurchaseDate: body?.domainPurchaseDate ?? null,
        hostingStartDate: body?.hostingStartDate ?? null,
        status: body?.status,
        notes: body?.notes ?? null,
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
