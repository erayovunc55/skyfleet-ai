import axios from "axios";
import { CapacitorHttp } from "@capacitor/core";

async function encodeFormData(form) {
  const entries = [];
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") {
      entries.push({ key, value, type: "string" });
    } else {
      const encoded = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(value);
      });
      entries.push({
        key,
        value: encoded,
        type: "base64File",
        contentType: value.type,
        fileName: value.name,
      });
    }
  }
  return entries;
}

export default async function nativeHttpAdapter(config) {
  config.cancelToken?.throwIfRequested();
  if (config.signal?.aborted) throw new axios.CanceledError(undefined, config);

  const url = axios.getUri(config);
  if (!/^https:\/\//i.test(url)) {
    throw new axios.AxiosError("Uygulama bağlantısı için geçerli bir HTTPS API adresi gereklidir.", "ERR_BAD_REQUEST", config);
  }
  const headers = config.headers.toJSON();
  let data = config.data;
  let dataType;
  if (data instanceof FormData) {
    data = await encodeFormData(data);
    dataType = "formData";
    headers["Content-Type"] = "multipart/form-data";
  } else if (typeof data === "string" && headers["Content-Type"]?.includes("application/json")) {
    data = JSON.parse(data);
  }

  let onAbort;
  const aborted = new Promise((_, reject) => {
    onAbort = () => reject(new axios.CanceledError(undefined, config));
    config.signal?.addEventListener("abort", onAbort, { once: true });
    config.cancelToken?.subscribe(onAbort);
  });
  try {
    if (config.signal?.aborted) throw new axios.CanceledError(undefined, config);
    const result = await Promise.race([
      CapacitorHttp.request({
        url,
        method: (config.method || "get").toUpperCase(),
        headers,
        data,
        dataType,
        connectTimeout: config.timeout,
        readTimeout: config.timeout,
        responseType: config.responseType || "json",
      }),
      aborted,
    ]);
    const response = {
      data: result.data,
      status: result.status,
      statusText: "",
      headers: axios.AxiosHeaders.from(result.headers),
      config,
      request: { url },
    };
    if (config.validateStatus && !config.validateStatus(response.status)) {
      throw new axios.AxiosError(
        `Request failed with status code ${response.status}`,
        response.status >= 500 ? "ERR_BAD_RESPONSE" : "ERR_BAD_REQUEST",
        config,
        response.request,
        response,
      );
    }
    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) throw error;
    throw new axios.AxiosError(
      `Sunucuya bağlanılamadı: ${error.message || String(error)}`,
      "ERR_NETWORK",
      config,
    );
  } finally {
    config.signal?.removeEventListener("abort", onAbort);
    config.cancelToken?.unsubscribe(onAbort);
  }
}
