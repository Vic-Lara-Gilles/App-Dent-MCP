import { test } from "node:test";
import assert from "node:assert/strict";

// A fake API verifies the client's session protocol without accessing clinic data.
test("MCP authenticates once, renews concurrent expired requests once, and never retries forbidden writes", async t => {
  process.env.MCP_EMAIL = "test@example.com";
  process.env.MCP_PASSWORD = "local-test-password";
  const originalFetch = globalThis.fetch;
  let logins = 0;
  let expired = false;
  let forbidden = false;
  let writes = 0;
  let invalidLogin = false;
  let alwaysUnauthorized = false;
  globalThis.fetch = async (input, options) => {
    if (String(input).endsWith("/api/auth/login")) {
      logins++;
      if (invalidLogin) return new Response(JSON.stringify({ error: "Credenciales inválidas" }), { status: 401 });
      await new Promise(resolve => setTimeout(resolve, 5));
      return new Response(JSON.stringify({ user: {} }), { headers: { "set-cookie": `dentai-session=session-${logins}; HttpOnly; Path=/` } });
    }
    const cookie = new Headers(options?.headers).get("cookie");
    assert.ok(cookie?.startsWith("dentai-session="));
    if (options?.method === "POST") writes++;
    if (alwaysUnauthorized) return new Response(JSON.stringify({ error: "Sesion expirada" }), { status: 401 });
    if (forbidden) return new Response(JSON.stringify({ error: "Sin permisos" }), { status: 403 });
    if (expired && cookie === "dentai-session=session-1") return new Response(JSON.stringify({ error: "Sesion expirada" }), { status: 401 });
    return new Response(JSON.stringify({ ok: true }));
  };
  t.after(() => { globalThis.fetch = originalFetch; delete process.env.MCP_EMAIL; delete process.env.MCP_PASSWORD; });
  const { apiGet, apiPost } = await import("../mcp-server/src/client");
  await Promise.all([apiGet("/api/patients"), apiGet("/api/appointments")]);
  assert.equal(logins, 1);
  expired = true;
  await Promise.all([apiGet("/api/patients"), apiGet("/api/appointments")]);
  assert.equal(logins, 2);
  forbidden = true;
  await assert.rejects(apiPost("/api/payments", { amount: 1 }), /Sin permisos/);
  assert.equal(writes, 1);
  assert.equal(logins, 2);
  forbidden = false;
  alwaysUnauthorized = true;
  invalidLogin = true;
  await assert.rejects(apiGet("/api/patients"), /Credenciales inválidas/);
  assert.equal(logins, 3);
  invalidLogin = false;
  delete process.env.MCP_PASSWORD;
  await assert.rejects(apiGet("/api/patients"), /MCP_EMAIL y MCP_PASSWORD/);
  process.env.MCP_PASSWORD = "local-test-password";
  await assert.rejects(apiGet("/api/patients"), /Sesion expirada/);
  assert.equal(logins, 5); // Initial login + one renewal, then stop.

});
