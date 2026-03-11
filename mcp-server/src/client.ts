const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE_URL + path, options);
  const body = (await res.json()) as T;
  if (!res.ok) {
    const errBody = body as { error?: string };
    throw new Error(errBody.error ?? `HTTP ${res.status}: ${path}`);
  }
  return body;
}

export async function apiGet<T = unknown>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  let url = BASE_URL + path;
  if (params && Object.keys(params).length > 0) {
    url += `?${new URLSearchParams(params).toString()}`;
  }
  const res = await fetch(url);
  const body = (await res.json()) as T;
  if (!res.ok) {
    const errBody = body as { error?: string };
    throw new Error(errBody.error ?? `HTTP ${res.status}: ${path}`);
  }
  return body;
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiPatch<T = unknown>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
