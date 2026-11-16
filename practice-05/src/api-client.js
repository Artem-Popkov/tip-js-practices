export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}


function checkedBase(baseUrl) {
  let url;
  try { url = new URL(baseUrl); } catch { throw new TypeError("Нужен абсолютный адрес API."); }
  if (!["http:", "https:"].includes(url.protocol) || url.search || url.hash) {
    throw new TypeError("Нужен HTTP(S)-адрес API без query и hash.");
  }
  return url.href.replace(/\/+$/, "");
}

export function buildUrl(baseUrl, path, query = {}) {
  const base = checkedBase(baseUrl);
  if (typeof path !== "string" || !path.trim() || /^[a-z][a-z0-9+.-]*:/i.test(path)
    || path.startsWith("//") || !query || Object.getPrototypeOf(query) !== Object.prototype) {
    throw new TypeError("Нужны относительный путь и объект query.");
  }
  const url = new URL(base + "/" + path.replace(/^\/+/, ""));
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url.href;
}

export function createApiClient({ baseUrl, fetchFn = globalThis.fetch, timeoutMs = 2000 } = {}) {
  const base = checkedBase(baseUrl);
  const checkTimeout = (value) => {
    if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError("Нужно целое положительное время ожидания.");
  };
  if (typeof fetchFn !== "function") throw new TypeError("fetchFn должен быть функцией.");
  checkTimeout(timeoutMs);
  return {
    async requestJson(path, { query = {}, signal, timeoutMs: requestTimeout = timeoutMs } = {}) {
      checkTimeout(requestTimeout);
      
      const url = buildUrl(base, path, query);
      const controller = new AbortController();
      let timedOut = false;
      const forwardAbort = () => controller.abort(signal.reason);
      if (signal?.aborted) forwardAbort();
      else signal?.addEventListener("abort", forwardAbort, { once: true });
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort(new DOMException("Время ожидания истекло", "TimeoutError"));
      }, requestTimeout);
      try {
        const headers = { Accept: "application/json" };
        
        const response = await fetchFn(url, { method: "GET", headers, signal: controller.signal });
        if (!(response instanceof Response)) throw new ApiError("Сервер вернул не Response.", { kind: "invalid-response", url });
        const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
        const isJson = contentType === "application/json" || contentType?.endsWith("+json");
        if (!response.ok) {
          let payload = null;
          // HTTP-статус важнее формата тела ошибки.
          if (isJson) { try { payload = await response.json(); } catch {} }
          throw new ApiError(payload?.error?.message || `Ошибка HTTP ${response.status}.`, {
            kind: "http", status: response.status, code: payload?.error?.code ?? null,
            details: payload?.error?.details ?? null, url,
          });
        }
        if (response.status === 204) return null;
        if (!isJson) throw new ApiError("Ожидался JSON-ответ.", { kind: "invalid-response", url });
        try { return await response.json(); }
        catch (cause) {
          if (controller.signal.aborted) throw cause;
          throw new ApiError("Сервер вернул повреждённый JSON.", { kind: "invalid-response", url, cause });
        }
      } catch (cause) {
        if (controller.signal.aborted) {
          throw new ApiError(timedOut ? "Превышено время ожидания ответа." : "Запрос отменён.", {
            kind: timedOut ? "timeout" : "aborted", url, cause,
          });
        }
        if (cause instanceof ApiError) throw cause;
        throw new ApiError("Нет соединения с API.", { kind: "network", url, cause });
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", forwardAbort);
      }
    },
  };
}
