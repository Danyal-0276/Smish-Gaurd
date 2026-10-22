import test from "node:test";
import assert from "node:assert/strict";
import {
  ApiError,
  createApiClient,
  validateAssessment,
  credentialEnvelope,
  credentialForOrigin,
  type CredentialStore,
} from "../src/services/api-client";

const token = "sg1.12345678-1234-1234-1234-123456789abc." + "x".repeat(43);
function memory(
  initial: string | null = null,
): CredentialStore & { current: () => string | null } {
  let value = initial;
  return {
    get: async () => value,
    set: async (next) => {
      value = next;
    },
    clear: async () => {
      value = null;
    },
    current: () => value,
  };
}
const assessment = {
  request_id: "synthetic-request",
  status: "completed",
  mode: "backend_model",
  risk: "low",
  model_version: "tested-model",
  policy_version: "policy-v1",
  coverage: "English-oriented",
  indicators: [],
  domains: [],
  advice: "Verify independently.",
};
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("no consent means no registration, credential lookup, or message request", async () => {
  let calls = 0;
  const storage = memory();
  storage.get = async () => {
    throw new Error("Storage should not be read");
  };
  const client = createApiClient(
    "https://service.invalid",
    storage,
    async () => {
      calls++;
      return json({});
    },
  );
  await assert.rejects(
    client.analyze("private text", false),
    (e: unknown) => e instanceof ApiError && e.code === "consent_required",
  );
  assert.equal(calls, 0);
});

test("registers separately, stores credential and authenticates only deliberate analysis", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const storage = memory();
  const client = createApiClient(
    "https://service.invalid",
    storage,
    async (url, init) => {
      calls.push({ url: String(url), init });
      return calls.length === 1
        ? json({ credential: token }, 201)
        : json(assessment);
    },
  );
  const result = await client.analyze("synthetic canary text", true);
  assert.equal(result.mode, "backend_model");
  assert.equal(storage.current(), token);
  assert.ok(!String(calls[0].init?.body).includes("synthetic canary text"));
  assert.equal(
    (calls[1].init?.headers as Record<string, string>).Authorization,
    "Bearer " + token,
  );
  assert.equal(
    JSON.parse(String(calls[1].init?.body)).cloud_analysis_consent,
    true,
  );
});

test("expired credentials are cleared with no automatic SMS replay", async () => {
  const storage = memory(token);
  let calls = 0;
  const client = createApiClient(
    "https://service.invalid",
    storage,
    async () => {
      calls++;
      return json({}, 401);
    },
  );
  await assert.rejects(
    client.analyze("synthetic text", true),
    (e: unknown) => e instanceof ApiError && e.code === "expired",
  );
  assert.equal(calls, 1);
  assert.equal(storage.current(), null);
});

test("an abstention or malformed verdict never becomes low risk", () => {
  assert.throws(
    () => validateAssessment({ status: "unsupported", risk: null }),
    (e: unknown) => e instanceof ApiError && e.code === "unsupported",
  );
  assert.throws(
    () => validateAssessment({ ...assessment, risk: "safe" }),
    ApiError,
  );
  assert.throws(
    () => validateAssessment({ ...assessment, domains: [42] }),
    ApiError,
  );
});

test("network and service errors produce no demo fallback or body echo", async () => {
  for (const status of [429, 503]) {
    const client = createApiClient(
      "https://service.invalid",
      memory(token),
      async () => json({ text: "SENSITIVE_CANARY" }, status),
    );
    await assert.rejects(
      client.analyze("SENSITIVE_CANARY", true),
      (e: unknown) =>
        e instanceof ApiError && !e.message.includes("SENSITIVE_CANARY"),
    );
  }
  const client = createApiClient(
    "https://service.invalid",
    memory(token),
    async () => {
      throw new Error("RAW_TOKEN_PRIVATE_EXCEPTION");
    },
  );
  await assert.rejects(
    client.analyze("SENSITIVE_CANARY", true),
    (e: unknown) => e instanceof ApiError && !e.message.includes("RAW_TOKEN"),
  );
});

test("secure-storage failure revokes the new credential before any analysis", async () => {
  const calls: string[] = [];
  const storage = memory();
  storage.set = async () => {
    throw new Error("unavailable");
  };
  const client = createApiClient(
    "https://service.invalid",
    storage,
    async (url) => {
      calls.push(String(url));
      return calls.length === 1
        ? json({ credential: token }, 201)
        : new Response(null, { status: 204 });
    },
  );
  await assert.rejects(
    client.analyze("synthetic text", true),
    (e: unknown) => e instanceof ApiError && e.code === "secure_storage",
  );
  assert.ok(calls[1].endsWith("installations/me"));
  assert.ok(!calls.some((url) => url.endsWith("analyses")));
});

test("reset revokes installation then clears local credential", async () => {
  const storage = memory(token);
  let method = "";
  const client = createApiClient(
    "https://service.invalid",
    storage,
    async (_url, init) => {
      method = init?.method ?? "";
      return new Response(null, { status: 204 });
    },
  );
  await client.reset();
  assert.equal(method, "DELETE");
  assert.equal(storage.current(), null);
});

test("a stored credential is never reused for another backend origin", () => {
  const saved = credentialEnvelope("https://original.invalid", token);
  assert.equal(credentialForOrigin("https://original.invalid", saved), token);
  assert.equal(credentialForOrigin("https://different.invalid", saved), null);
  assert.equal(
    credentialForOrigin("https://original.invalid", "corrupt"),
    null,
  );
});

test("metadata feedback requires consent and never sends message text", async () => {
  let payload = "";
  let calls = 0;
  const client = createApiClient(
    "https://service.invalid",
    memory(token),
    async (_url, init) => {
      calls++;
      payload = String(init?.body);
      return json({ id: "synthetic-feedback" }, 201);
    },
  );
  const metadata = {
    client_event_id: "synthetic-event",
    model_version: "model-v1",
    risk: "high",
    reason: "false_positive" as const,
  };
  await assert.rejects(client.feedback(metadata, false), ApiError);
  assert.equal(calls, 0);
  await client.feedback(metadata, true);
  assert.deepEqual(Object.keys(JSON.parse(payload)).sort(), [
    "client_event_id",
    "feedback_consent",
    "model_version",
    "reason",
    "risk",
  ]);
});
