const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";
let cookie: string | undefined;
let loginPromise: Promise<string> | undefined;

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  try { return JSON.parse(text); } catch { throw new Error(`Respuesta no válida de la API (HTTP ${response.status})`); }
}
function apiError(body: unknown, status: number): Error {
  const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string" ? body.error : `HTTP ${status}`;
  return new Error(message);
}
async function login(): Promise<string> {
  if (!loginPromise) {
    loginPromise = (async () => {
      const email = process.env.MCP_EMAIL;
      const password = process.env.MCP_PASSWORD;
      if (!email || !password) throw new Error("Configura MCP_EMAIL y MCP_PASSWORD para autenticar el servidor MCP");
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), signal: AbortSignal.timeout(15000), redirect: "error",
      });
      const body = await readBody(response);
      if (!response.ok) throw apiError(body, response.status);
      const session = response.headers.getSetCookie().find(value => value.startsWith("dentai-session="))?.split(";")[0];
      if (!session) throw new Error("La API no devolvió una sesión");
      cookie = session;
      return session;
    })().finally(() => { loginPromise = undefined; });
  }
  return loginPromise;
}
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = cookie ?? await login();
  const send = (sessionCookie: string) => fetch(BASE_URL + path, {
    ...options, headers: { ...options.headers, Cookie: sessionCookie },
    signal: AbortSignal.timeout(15000), redirect: "error",
  });
  let response = await send(session);
  if (response.status === 401) {
    await response.arrayBuffer();
    // Another concurrent request may already have replaced the expired cookie.
    if (cookie === session) cookie = undefined;
    response = await send(cookie ?? await login());
  }
  const body = await readBody(response);
  if (!response.ok) throw apiError(body, response.status);
  return body as T;
}
export function apiGet<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
  const query = params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : "";
  return request<T>(path + query);
}
export function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
export function apiPatch<T = unknown>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
