import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import axios from "axios";

async function loadClient(native, apiUrl = "https://example.test/api") {
  const values = new Map([["skyfleet_token", "test-token"]]);
  const events = [];
  const requests = [];
  let respond = async () => ({ data: { ok: true }, status: 200, headers: {} });
  const context = vm.createContext({
    FormData,
    FileReader: class {
      readAsDataURL(blob) {
        blob.arrayBuffer().then((bytes) => {
          this.result = `data:${blob.type};base64,${Buffer.from(bytes).toString("base64")}`;
          this.onload();
        }, (error) => { this.error = error; this.onerror(); });
      }
    },
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      removeItem: (key) => values.delete(key),
    },
    window: { dispatchEvent: (event) => events.push(event.type) },
    CustomEvent: class { constructor(type) { this.type = type; } },
  });
  const source = await readFile(new URL("../src/services/apiClient.js", import.meta.url), "utf8");
  const module = new vm.SourceTextModule(source, {
    context,
    initializeImportMeta: (meta) => {
      meta.env = { VITE_API_URL: apiUrl };
    },
  });
  const link = async (name) => {
    if (name === "./nativeHttpAdapter") {
      const source = await readFile(new URL("../src/services/nativeHttpAdapter.js", import.meta.url), "utf8");
      const adapter = new vm.SourceTextModule(source, { context });
      await adapter.link(link);
      return adapter;
    }
    if (name === "axios") {
      return new vm.SyntheticModule(["default"], function () {
        this.setExport("default", axios);
      }, { context });
    }
    assert.equal(name, "@capacitor/core");
    return new vm.SyntheticModule(["Capacitor", "CapacitorHttp"], function () {
      this.setExport("Capacitor", { isNativePlatform: () => native });
      this.setExport("CapacitorHttp", { request: async (request) => {
        requests.push(request);
        return respond(request);
      } });
    }, { context });
  };
  await module.link(link);
  await module.evaluate();
  const client = module.namespace.default;
  return { client, requests, values, events, setResponse: (fn) => { respond = fn; } };
}

test("native login uses direct Capacitor HTTP, JSON and authorization", async () => {
  const { client, requests } = await loadClient(true);
  assert.equal(typeof client.defaults.adapter, "function");
  const result = await client.post("/login", { login: "test-driver", password: "test-password" });
  assert.equal(result.data.ok, true);
  assert.equal(requests[0].url, "https://example.test/api/login");
  assert.equal(requests[0].headers.Authorization, "Bearer test-token");
  assert.deepEqual(JSON.parse(JSON.stringify(requests[0].data)), { login: "test-driver", password: "test-password" });
  assert.equal(requests[0].connectTimeout, 30000);
});

test("native supplier application preserves multipart fields and uploaded files", async () => {
  const { client, requests } = await loadClient(true);
  const form = new FormData();
  form.set("application_type", "individual");
  form.set("insurance_file", new Blob(["document"], { type: "application/pdf" }), "insurance.pdf");
  await client.post("/public/supplier-applications", form);
  assert.equal(requests[0].headers["Content-Type"], "multipart/form-data");
  assert.equal(requests[0].dataType, "formData");
  const submitted = requests[0].data;
  assert.equal(submitted[0].value, "individual");
  assert.equal(submitted[1].fileName, "insurance.pdf");
  assert.equal(submitted[1].type, "base64File");
  assert.equal(Buffer.from(submitted[1].value, "base64").toString(), "document");
});

test("native transfer GET and location POST share direct HTTP transport", async () => {
  const { client, requests } = await loadClient(true);
  await client.get("/transfers", { params: { date: "2026-10-10" } });
  await client.post("/transfers/1/location", { latitude: 41, longitude: 29 });
  assert.equal(requests[0].method, "GET");
  assert.equal(new URL(requests[0].url).searchParams.get("date"), "2026-10-10");
  assert.deepEqual(JSON.parse(JSON.stringify(requests[1].data)), { latitude: 41, longitude: 29 });
});

test("native 401 preserves Axios rejection and clears the stored session", async () => {
  const { client, values, events, setResponse } = await loadClient(true);
  values.set("skyfleet_user", "{}");
  setResponse(async () => ({ data: { message: "Unauthenticated." }, status: 401, headers: {} }));
  await assert.rejects(client.get("/transfers"), (error) => {
    assert.equal(error.response.status, 401);
    assert.equal(error.response.data.message, "Unauthenticated.");
    return true;
  });
  assert.equal(values.has("skyfleet_token"), false);
  assert.equal(values.has("skyfleet_user"), false);
  assert.deepEqual(events, ["skyfleet-driver:unauthenticated"]);
});

test("browser keeps the default Axios adapter", async () => {
  const { client } = await loadClient(false);
  assert.deepEqual(client.defaults.adapter, axios.defaults.adapter);
});

test("native connection errors expose the plugin's reason instead of generic Network Error", async () => {
  const { client, setResponse } = await loadClient(true);
  setResponse(async () => { throw new Error("Unable to resolve host"); });
  await assert.rejects(client.post("/login", {}), (error) => {
    assert.equal(error.code, "ERR_NETWORK");
    assert.match(error.message, /Unable to resolve host/);
    return true;
  });
});

test("aborted requests never reach the native plugin", async () => {
  const { client, requests } = await loadClient(true);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(client.get("/transfers", { signal: controller.signal }), axios.isCancel);
  assert.equal(requests.length, 0);
});

test("native validation errors retain server details", async () => {
  const { client, setResponse } = await loadClient(true);
  setResponse(async () => ({ status: 422, data: { message: "Invalid input", errors: { login: ["Required"] } }, headers: {} }));
  await assert.rejects(client.post("/login", {}), (error) => {
    assert.equal(error.response.status, 422);
    assert.deepEqual(error.response.data.errors.login, ["Required"]);
    return true;
  });

  test("native relative API configuration fails explicitly without sending a request", async () => {
    const { client, requests } = await loadClient(true, undefined);
    client.defaults.baseURL = "/api";
    await assert.rejects(client.post("/login", {}), (error) => {
      assert.equal(error.code, "ERR_BAD_REQUEST");
      assert.match(error.message, /HTTPS/);
      return true;
    });
    assert.equal(requests.length, 0);
  });
});
