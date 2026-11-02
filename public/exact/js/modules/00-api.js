/**
 * =============================================================================
 * 模块：统一 API 层（GET 缓存 + 在途去重 + 写后自动失效）
 *
 * 设计约定：全站接口一律写成同源相对路径 /api/xxx。
 *   - 8080 由 Spring Boot 托管时，/api 前缀由后端 ApiPrefixFilter 剥掉；
 *   - 5173 由 Vite 开发服务器托管时，/api 由 vite.config.js 的 proxy 转发并改写。
 * 两条路都不需要在浏览器里做地址回退，因此这里只保留缓存与失效逻辑。
 * =============================================================================
 */
(function () {
    var TTL = 5000;                 // GET 缓存有效期（毫秒）
    var cache = new Map();          // url -> { t, data }
    var pending = new Map();        // url -> Promise（在途请求去重）

    /** 带缓存的 GET JSON 请求；!ok 时抛错 */
    function cachedGet(url) {
        var hit = cache.get(url);
        if (hit && Date.now() - hit.t < TTL) return Promise.resolve(hit.data);
        if (pending.has(url)) return pending.get(url);
        var p = fetch(url).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        }).then(function (data) {
            cache.set(url, { t: Date.now(), data: data });
            pending.delete(url);
            return data;
        }).catch(function (err) {
            pending.delete(url);
            throw err;
        });
        pending.set(url);
        return p;
    }

    /** 手动失效：prefix 为空则清空全部 */
    function invalidate(prefix) {
        [cache, pending].forEach(function (m) {
            Array.from(m.keys()).forEach(function (k) {
                if (!prefix || k.indexOf(prefix) !== -1) m.delete(k);
            });
        });
    }

    /* 包装原生 fetch：任何非 GET 写操作成功后自动清空缓存，无需逐个接口改 */
    var nativeFetch = window.fetch.bind(window);
    window.fetch = function (url, opts) {
        var method = opts && opts.method ? String(opts.method).toUpperCase() : 'GET';
        return nativeFetch(url, opts).then(function (r) {
            if (method !== 'GET' && r.ok) invalidate();
            return r;
        });
    };

    window.cachedGet = cachedGet;
    // 兼容旧调用点：apiGet(url, plainUrl) 的第二参数已废弃，保留形参避免改动 6 处调用
    window.apiGet = function (url) { return cachedGet(url); };
    window.apiCacheInvalidate = invalidate;
})();
