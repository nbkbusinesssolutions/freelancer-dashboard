export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

function getApiBaseUrl() {
  // Configure at deploy time with Vite env var (safe to expose).
  // Example: VITE_API_BASE_URL="https://your-api.example.com"
  return (import.meta as any).env?.VITE_API_BASE_URL?.toString?.() || "";
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
  const base = getApiBaseUrl();
  const url = `${base}${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
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
  return (await res.json()) as T;
}
