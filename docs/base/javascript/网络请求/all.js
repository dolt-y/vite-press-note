"use strict";

/**
 * 网络请求统一笔记（单文件版）
 *
 * 包含：
 * 1) XHR 封装：适合需要上传/下载进度、老项目兼容
 * 2) fetch 封装：现代项目默认方案
 * 3) MiniAxios：手写拦截器 + 统一请求入口
 *
 * 建议：
 * - 新项目优先 fetch/MiniAxios
 * - 需要上传进度时优先 XHR
 */

// ==================== 公共工具 ====================
function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function serializeQuery(params = {}) {
  const sp = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value === undefined || value === null) return;
    sp.append(key, String(value));
  });
  const query = sp.toString();
  return query ? `?${query}` : "";
}

function joinURL(baseURL = "", url = "") {
  if (!baseURL) return url;
  if (/^https?:\/\//i.test(url)) return url;
  const left = baseURL.replace(/\/+$/, "");
  const right = url.replace(/^\/+/, "");
  return `${left}/${right}`;
}

function buildURL({ baseURL = "", url = "", params }) {
  return `${joinURL(baseURL, url)}${serializeQuery(params)}`;
}

function parseResponseHeaders(headerText) {
  const headers = {};
  headerText
    .trim()
    .split(/[\r\n]+/)
    .forEach((line) => {
      if (!line) return;
      const idx = line.indexOf(":");
      const key = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();
      headers[key] = value;
    });
  return headers;
}

function normalizeMethod(method = "GET") {
  return method.toUpperCase();
}

// ==================== 1) XHR 封装 ====================
/**
 * @param {Object} config
 * @param {string} config.url
 * @param {string} [config.baseURL]
 * @param {string} [config.method='GET']
 * @param {Object} [config.params]
 * @param {any} [config.data]
 * @param {Object} [config.headers]
 * @param {number} [config.timeout=10000]
 * @param {'json'|'text'|'blob'|'arraybuffer'} [config.responseType='json']
 * @param {boolean} [config.withCredentials=false]
 * @param {(evt: ProgressEvent) => void} [config.onUploadProgress]
 * @param {(evt: ProgressEvent) => void} [config.onDownloadProgress]
 */
function xhrRequest(config) {
  const {
    url,
    baseURL = "",
    method = "GET",
    params,
    data,
    headers = {},
    timeout = 10000,
    responseType = "json",
    withCredentials = false,
    onUploadProgress,
    onDownloadProgress,
  } = config || {};

  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error("xhrRequest: url 不能为空"));
      return;
    }

    const finalURL = buildURL({ baseURL, url, params });
    const upperMethod = normalizeMethod(method);
    const xhr = new XMLHttpRequest();

    xhr.open(upperMethod, finalURL, true);
    xhr.timeout = timeout;
    xhr.withCredentials = withCredentials;

    if (responseType === "blob" || responseType === "arraybuffer") {
      xhr.responseType = responseType;
    }

    Object.keys(headers).forEach((key) => {
      xhr.setRequestHeader(key, headers[key]);
    });

    if (typeof onUploadProgress === "function" && xhr.upload) {
      xhr.upload.onprogress = onUploadProgress;
    }
    if (typeof onDownloadProgress === "function") {
      xhr.onprogress = onDownloadProgress;
    }

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;

      let responseData = xhr.responseText;
      if (responseType === "json") {
        try {
          responseData = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        } catch (err) {
          reject(new Error("xhrRequest: JSON 解析失败"));
          return;
        }
      } else if (responseType === "blob" || responseType === "arraybuffer") {
        responseData = xhr.response;
      }

      const response = {
        data: responseData,
        status: xhr.status,
        statusText: xhr.statusText,
        headers: parseResponseHeaders(xhr.getAllResponseHeaders()),
        config,
        request: xhr,
      };

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(response);
      } else {
        const error = new Error(`xhrRequest: HTTP ${xhr.status}`);
        error.response = response;
        error.config = config;
        reject(error);
      }
    };

    xhr.onerror = () => reject(new Error("xhrRequest: 网络错误"));
    xhr.ontimeout = () => reject(new Error(`xhrRequest: 超时 ${timeout}ms`));
    xhr.onabort = () => reject(new Error("xhrRequest: 请求被取消"));

    const hasBody = !["GET", "HEAD"].includes(upperMethod);
    if (!hasBody) {
      xhr.send();
      return;
    }

    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    if (isFormData) {
      xhr.send(data);
      return;
    }

    const contentTypeKey = Object.keys(headers).find(
      (key) => key.toLowerCase() === "content-type"
    );
    const contentType = contentTypeKey ? headers[contentTypeKey] : "";

    if (isPlainObject(data) && !contentType) {
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(data));
      return;
    }

    if (isPlainObject(data) && /application\/json/i.test(contentType)) {
      xhr.send(JSON.stringify(data));
      return;
    }

    xhr.send(data);
  });
}

// ==================== 2) fetch 封装 ====================
function bindAbortSignal(signal, controller) {
  if (!signal) return;
  if (signal.aborted) {
    controller.abort();
    return;
  }
  signal.addEventListener("abort", () => controller.abort(), { once: true });
}

function parseFetchBody(response, responseType) {
  switch (responseType) {
    case "json":
      return response.json();
    case "text":
      return response.text();
    case "blob":
      return response.blob();
    case "arrayBuffer":
      return response.arrayBuffer();
    case "formData":
      return response.formData();
    default:
      return Promise.resolve(response);
  }
}

/**
 * @param {Object} config
 * @param {string} config.url
 * @param {string} [config.baseURL]
 * @param {string} [config.method='GET']
 * @param {Object} [config.params]
 * @param {any} [config.data]
 * @param {Object} [config.headers]
 * @param {number} [config.timeout=10000]
 * @param {'json'|'text'|'blob'|'arrayBuffer'|'formData'} [config.responseType='json']
 * @param {'omit'|'same-origin'|'include'} [config.credentials='same-origin']
 * @param {AbortSignal} [config.signal]
 */
async function fetchRequest(config) {
  const {
    url,
    baseURL = "",
    method = "GET",
    params,
    data,
    headers = {},
    timeout = 10000,
    responseType = "json",
    credentials = "same-origin",
    signal,
  } = config || {};

  if (!url) {
    throw new Error("fetchRequest: url 不能为空");
  }

  const upperMethod = normalizeMethod(method);
  const finalURL = buildURL({ baseURL, url, params });
  const controller = new AbortController();
  bindAbortSignal(signal, controller);

  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const requestHeaders = { ...headers };
  const fetchOptions = {
    method: upperMethod,
    headers: requestHeaders,
    credentials,
    signal: controller.signal,
  };

  const hasBody = !["GET", "HEAD"].includes(upperMethod);
  if (hasBody && data !== undefined) {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    const contentTypeKey = Object.keys(requestHeaders).find(
      (key) => key.toLowerCase() === "content-type"
    );
    const contentType = contentTypeKey ? requestHeaders[contentTypeKey] : "";

    if (isFormData) {
      fetchOptions.body = data;
    } else if (isPlainObject(data) && !contentType) {
      fetchOptions.body = JSON.stringify(data);
      fetchOptions.headers["Content-Type"] = "application/json";
    } else if (isPlainObject(data) && /application\/json/i.test(contentType)) {
      fetchOptions.body = JSON.stringify(data);
    } else {
      fetchOptions.body = data;
    }
  }

  try {
    const response = await fetch(finalURL, fetchOptions);
    const body = await parseFetchBody(response, responseType);

    const result = {
      data: body,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config,
      request: response,
    };

    // fetch 只有网络错误才 reject，4xx/5xx 需要手动抛错
    if (!response.ok) {
      const error = new Error(`fetchRequest: HTTP ${response.status}`);
      error.response = result;
      error.config = config;
      throw error;
    }
    return result;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`fetchRequest: 请求被取消或超时(${timeout}ms)`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ==================== 3) 手写 MiniAxios（基于 fetch） ====================
class MiniAxios {
  constructor(defaultConfig = {}) {
    this.defaults = {
      baseURL: "",
      timeout: 10000,
      headers: {},
      responseType: "json",
      validateStatus: (status) => status >= 200 && status < 300,
      ...defaultConfig,
    };
    this.interceptors = {
      request: [],
      response: [],
    };
  }

  useRequestInterceptor(onFulfilled, onRejected) {
    this.interceptors.request.push({ onFulfilled, onRejected });
    return this.interceptors.request.length - 1;
  }

  useResponseInterceptor(onFulfilled, onRejected) {
    this.interceptors.response.push({ onFulfilled, onRejected });
    return this.interceptors.response.length - 1;
  }

  ejectRequestInterceptor(id) {
    if (this.interceptors.request[id]) this.interceptors.request[id] = null;
  }

  ejectResponseInterceptor(id) {
    if (this.interceptors.response[id]) this.interceptors.response[id] = null;
  }

  mergeConfig(base, extra) {
    return {
      ...base,
      ...extra,
      headers: {
        ...(base.headers || {}),
        ...(extra.headers || {}),
      },
    };
  }

  dispatchRequest(config) {
    const validateStatus = config.validateStatus || this.defaults.validateStatus;
    return fetchRequest(config).then((res) => {
      if (!validateStatus(res.status)) {
        const error = new Error(`MiniAxios: HTTP ${res.status}`);
        error.response = res;
        error.config = config;
        throw error;
      }
      return res;
    });
  }

  request(config = {}) {
    const merged = this.mergeConfig(this.defaults, config);
    const chain = [this.dispatchRequest.bind(this), undefined];

    // 请求拦截器后加先执行（LIFO）
    this.interceptors.request.forEach((it) => {
      if (!it) return;
      chain.unshift(it.onFulfilled, it.onRejected);
    });

    // 响应拦截器先加先执行（FIFO）
    this.interceptors.response.forEach((it) => {
      if (!it) return;
      chain.push(it.onFulfilled, it.onRejected);
    });

    let promise = Promise.resolve(merged);
    while (chain.length) {
      const onFulfilled = chain.shift();
      const onRejected = chain.shift();
      promise = promise.then(onFulfilled, onRejected);
    }
    return promise;
  }

  get(url, config = {}) {
    return this.request({ ...config, url, method: "GET" });
  }

  delete(url, config = {}) {
    return this.request({ ...config, url, method: "DELETE" });
  }

  post(url, data, config = {}) {
    return this.request({ ...config, url, data, method: "POST" });
  }

  put(url, data, config = {}) {
    return this.request({ ...config, url, data, method: "PUT" });
  }

  patch(url, data, config = {}) {
    return this.request({ ...config, url, data, method: "PATCH" });
  }
}

// ==================== 4) 实战模板（默认注释） ====================
// const api = new MiniAxios({
//   baseURL: "https://jsonplaceholder.typicode.com",
//   timeout: 8000,
//   headers: { "X-App-Name": "note-demo" },
// });
//
// api.useRequestInterceptor((config) => {
//   const token = localStorage.getItem("token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });
//
// api.useResponseInterceptor(
//   (response) => response,
//   (error) => {
//     // 401 可在此做刷新 token 或跳登录
//     return Promise.reject(error);
//   }
// );
//
// api.get("/posts", { params: { _limit: 3 } }).then((res) => {
//   console.log("列表数据:", res.data);
// });

// 挂到 window 方便在浏览器控制台调试
if (typeof window !== "undefined") {
  window.NetworkNote = {
    xhrRequest,
    fetchRequest,
    MiniAxios,
  };
}

/**
 * 高频面试点速记：
 * 1) fetch 对 4xx/5xx 不会自动 reject，需要手动判断 response.ok。
 * 2) XHR 支持上传进度（xhr.upload.onprogress），fetch 目前不适合处理上传进度。
 * 3) 超时：fetch 需 AbortController；XHR 直接 xhr.timeout。
 * 4) 拦截器价值：统一鉴权、统一错误处理、统一日志埋点。
 */

/**
 * ==================== 三个请求方案知识点详解（学习版） ====================
 *
 * 一、XHR：浏览器原生“底层请求接口”
 * 1) 模型：事件驱动（onreadystatechange / onerror / ontimeout / onabort）。
 * 2) 优势：
 *    - 可拿到上传进度（xhr.upload.onprogress）和下载进度（xhr.onprogress）。
 *    - 兼容老项目、老浏览器生态较成熟。
 *    - timeout 是原生能力（xhr.timeout）。
 * 3) 成本：
 *    - 代码偏繁琐，需要自己处理 readyState、headers 解析、JSON 解析。
 *    - Promise 不是原生，需要手动封装。
 * 4) 适用：大文件上传、进度条、需要精细控制请求生命周期的场景。
 *
 * 二、fetch：现代 Web 默认请求 API
 * 1) 模型：Promise + Request/Response 对象，更接近“流式资源读取”语义。
 * 2) 优势：
 *    - 写法简洁、语义清晰，适合中后台和前后端分离项目。
 *    - 与 AbortController、Service Worker、流式读取等现代能力更容易配合。
 * 3) 关键认知：
 *    - fetch 只有“网络失败”才 reject；HTTP 4xx/5xx 仍然会 resolve。
 *      所以需要手动判断 response.ok / status。
 *    - fetch 无原生 timeout，通常用 AbortController + setTimeout 实现。
 * 4) 适用：绝大多数现代业务请求（列表、详情、提交表单、CRUD）。
 *
 * 三、MiniAxios：工程化封装层（基于 fetch）
 * 1) 目标：不是替代 fetch，而是“统一团队请求规范”。
 * 2) 核心价值：
 *    - 统一 baseURL / timeout / headers / responseType。
 *    - 请求拦截器：统一注入 token、traceId、多租户头。
 *    - 响应拦截器：统一错误处理、登录过期处理、埋点上报。
 *    - validateStatus：可自定义“成功状态”判断规则。
 * 3) 执行顺序（高频面试点）：
 *    - 请求拦截器：后添加先执行（LIFO）。
 *    - 响应拦截器：先添加先执行（FIFO）。
 * 4) 适用：中大型项目、多人协作、需要长期维护的一致化工程。
 *
 * 四、三者怎么选（决策建议）
 * 1) 需要上传进度/下载进度：优先 XHR。
 * 2) 新项目默认：优先 fetch。
 * 3) 团队项目：在 fetch 之上做 MiniAxios 统一治理。
 *
 * 五、常见坑（必须掌握）
 * 1) 跨域 CORS 是服务端策略，不是前端单改 headers 就能解决。
 * 2) GET/HEAD 不应发送 body；参数应放 query。
 * 3) FormData 上传时不要手动写 multipart boundary，让浏览器自动带。
 * 4) 超时和取消要区分：
 *    - 超时：策略性终止。
 *    - 用户取消：业务主动中断。
 * 5) 错误对象建议统一结构（message/code/status/response/config），方便全局处理。
 *
 * 六、面试回答模板（30 秒）
 * “我一般分三层：XHR 负责底层能力（尤其进度），fetch 负责现代请求基础，
 * 再在 fetch 上做 Axios 风格封装（拦截器 + 统一错误 + 统一鉴权）。
 * 这样既保留原生能力，又保证团队项目的一致性和可维护性。”
 */
