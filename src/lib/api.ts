export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

function getApiBaseUrl() {
  // Configure at deploy time with Vite env var (safe to expose).
  // Example: VITE_API_BASE_URL="https://your-api.example.com"
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL?.toString?.() || "";
  // Runtime override for Lovable preview / non-env setups.
  const runtimeBase = typeof window !== "undefined" ? window.localStorage.getItem("externalApiBaseUrl") || "" : "";
  // When deployed to Netlify, use the functions API
  if (typeof window !== "undefined" && !runtimeBase && !envBase) {
    const hostname = window.location.hostname;
    if (hostname.includes("netlify.app") || hostname.includes("netlify.live")) {
      return "/.netlify/functions";
    }
  }
  return runtimeBase || envBase;
}

function getApiKeyConfig() {
  if (typeof window === "undefined") return { headerName: "X-API-Key", value: "" };
  return {
    headerName: window.localStorage.getItem("externalApiKeyHeader") || "X-API-Key",
    value: window.localStorage.getItem("externalApiKey") || "",
  };
}

function shouldUseMockApi() {
  if (typeof window === "undefined") return false;
  // Auto-fallback: if no base URL is set, use mock.
  const base = getApiBaseUrl();
  const explicit = window.localStorage.getItem("useMockApi") === "1";
  return explicit || !base;
}

async function readErrorPayload(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return undefined;
    }
  }
  try {
    return await res.text();
  } catch {
    return undefined;
  }
}

export async function apiFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  if (shouldUseMockApi()) {
    const mod = await import("@/lib/mockApi");
    return mod.mockApiFetchJson<T>(path, init);
  }

  const base = getApiBaseUrl();
  const url = `${base}${path}`;
  const apiKey = getApiKeyConfig();

  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(apiKey.value ? { [apiKey.headerName]: apiKey.value } : {}),
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const payload = await readErrorPayload(res);
    const err: ApiError = {
      status: res.status,
      message: typeof payload === "string" ? payload : (payload as any)?.message || res.statusText,
      details: payload,
    };
    throw err;
  }

  // 204
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    // This commonly happens when the base URL is empty/misconfigured and the app shell HTML is returned.
    const text = await readErrorPayload(res);
    const err: ApiError = {
      status: 502,
      message:
        "API misconfigured: expected JSON but received a non-JSON response. Set External API Base URL (including any /api prefix) in the app header.",
      details: text,
    };
    throw err;
  }

  try {
    return (await res.json()) as T;
  } catch (e) {
    const text = await readErrorPayload(res);
    const err: ApiError = {
      status: 502,
      message:
        "API misconfigured: response was not valid JSON (often means you hit the app origin instead of your API). Set External API Base URL (including any /api prefix) in the app header.",
      details: text,
    };
    throw err;
  }
}
