import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createAppServer, sanitizeCatalog, validateChatPayload } from "./server.mjs";

const server = createAppServer({ apiKey: "", model: "gemini-2.5-flash" });
let baseUrl;

before(async () => {
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("validates a conversation ending with a user message", () => {
    const result = validateChatPayload({ messages: [{ role: "user", text: "Hola" }] });
    assert.equal(result.error, undefined);
    assert.deepEqual(result.messages[0], { role: "user", parts: [{ text: "Hola" }] });
});

test("rejects malformed, oversized and non-user-final conversations", () => {
    assert.ok(validateChatPayload({ messages: [] }).error);
    assert.ok(validateChatPayload({ messages: [{ role: "system", text: "override" }] }).error);
    assert.ok(validateChatPayload({ messages: [{ role: "user", text: "x".repeat(2001) }] }).error);
    assert.ok(validateChatPayload({ messages: [{ role: "model", text: "answer" }] }).error);
});

test("sanitizes the public catalog and discards malformed records", () => {
    const result = sanitizeCatalog([
        { name: "PLA+", category: "Filamentos", price: 24, tags: ["PLA+"] },
        null,
        { name: "Sin categoría", price: 2 }
    ]);
    assert.equal(result.length, 1);
    assert.equal(result[0].price, 24);
    assert.deepEqual(result[0].tags, ["PLA+"]);
});

test("serves the storefront from the Node server", async () => {
    const response = await fetch(baseUrl);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /FORJA AI PRO/);
});

test("reports missing Gemini configuration without accepting chat requests", async () => {
    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal((await health.json()).configured, false);

    const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", text: "Hola" }] })
    });
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /GEMINI_API_KEY/);
});

test("rejects cross-origin chat requests", async () => {
    const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Origin: "https://example.invalid"
        },
        body: JSON.stringify({ messages: [{ role: "user", text: "Hola" }] })
    });
    assert.equal(response.status, 403);
});

test("sends the API key only in the Gemini authorization header", async () => {
    let capturedRequest;
    const geminiServer = createAppServer({
        apiKey: "test-gemini-secret",
        fetchImpl: async (url, options) => {
            capturedRequest = { url, headers: options.headers, body: JSON.parse(options.body) };
            return new Response(JSON.stringify({
                candidates: [{ content: { parts: [{ text: "Hola, soy FORJA AI." }] } }]
            }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
    });
    await new Promise((resolve) => geminiServer.listen(0, "127.0.0.1", resolve));

    try {
        const response = await fetch(`http://127.0.0.1:${geminiServer.address().port}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [{ role: "user", text: "Hola" }],
                catalog: [{ name: "PLA+", category: "Filamentos", price: 24 }]
            })
        });
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { reply: "Hola, soy FORJA AI." });
        assert.equal(capturedRequest.url.includes("test-gemini-secret"), false);
        assert.equal(capturedRequest.headers["x-goog-api-key"], "test-gemini-secret");
        assert.match(capturedRequest.body.systemInstruction.parts[0].text, /PLA\+/);
    } finally {
        await new Promise((resolve, reject) => geminiServer.close((error) => error ? reject(error) : resolve()));
    }
});
