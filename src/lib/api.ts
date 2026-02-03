const API_BASE = "/.netlify/functions";

async function request(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}/${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }
  
  return res.json();
}

export const api = {
  clients: {
    list: () => request("clients"),
    upsert: (data: any) => request("clients", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request(`clients?id=${id}`, { method: "DELETE" }),
  },
  projects: {
    list: () => request("projects"),
    upsert: (data: any) => request("projects", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request(`projects?id=${id}`, { method: "DELETE" }),
  },
  invoices: {
    list: () => request("invoices"),
    upsert: (data: any) => request("invoices", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request(`invoices?id=${id}`, { method: "DELETE" }),
  },
  emailAccounts: {
    list: () => request("email-accounts"),
    upsert: (data: any) => request("email-accounts", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request(`email-accounts?id=${id}`, { method: "DELETE" }),
  },
  aiSubscriptions: {
    list: () => request("ai-subscriptions"),
    upsert: (data: any) => request("ai-subscriptions", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request(`ai-subscriptions?id=${id}`, { method: "DELETE" }),
  },
  actionItems: {
    list: (contextType?: string, contextId?: string) => {
      const params = new URLSearchParams();
      if (contextType) params.set("contextType", contextType);
      if (contextId) params.set("contextId", contextId);
      return request(`action-items?${params}`);
    },
    listIncomplete: () => request("action-items?incomplete=true"),
    add: (data: any) => request("action-items", { method: "POST", body: JSON.stringify(data) }),
    toggle: (id: string) => request("action-items", { method: "POST", body: JSON.stringify({ id, toggle: true }) }),
    delete: (id: string) => request(`action-items?id=${id}`, { method: "DELETE" }),
  },
  projectLogs: {
    list: (projectId: string) => request(`project-logs?projectId=${projectId}`),
    add: (projectId: string, text: string) => request("project-logs", { method: "POST", body: JSON.stringify({ projectId, text }) }),
  },
  effortLogs: {
    list: (projectId?: string) => {
      const params = projectId ? `?projectId=${projectId}` : "";
      return request(`effort-logs${params}`);
    },
    add: (data: any) => request("effort-logs", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request(`effort-logs?id=${id}`, { method: "DELETE" }),
  },
  branding: {
    get: () => request("branding"),
    update: (data: any) => request("branding", { method: "POST", body: JSON.stringify(data) }),
  },
};
