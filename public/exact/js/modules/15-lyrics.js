/**
 * =============================================================================
 * 模块：歌词面板（15-lyrics.js）
 * -----------------------------------------------------------------------------
 * 交互：播放条上的「词」按钮 -> 底部播放条向上展开（70px -> 200px），
 *      歌词显示在播放器下方（窗口固定 3 行高，当前句永远在中间那一行）；再点一次收起。
 *
 * 功能：
 *   1. 歌词来源：优先数据库 music.lyrics（/music?keyword= 接口，LRC 格式），
 *      数据库没有时回退 /assets/歌词/*.lrc（先查 index.json 索引）；
 *   2. 随播放进度高亮当前句并自动滚动到中间，点击任意一句可跳转播放位置；
 *   3. 切歌时（监听播放条歌名变化）自动重新加载对应歌词；
 *   4. 没有歌词的歌曲显示「暂无歌词」；
 *   5. Esc 键 / 隐藏播放条 时自动收起歌词。
 *
 * 依赖：13-player.js 已把 <audio> 挂到 window.audio。
 * 注意：新增/修改 assets/歌词 下的 .lrc 文件后，需重新生成 index.json
 *      （脚本会按「歌名 - 歌手.lrc」规则重建索引）。
 * =============================================================================
 */
(function () {
    var lyricsBtn     = document.getElementById('playerLyricsBtn');
    var playerBar     = document.getElementById('playerBar') || document.querySelector('.player-bar');
    var lyricsScroll  = document.getElementById('lyricsScroll');
    var lyricsInner   = document.getElementById('lyricsInner') || lyricsScroll;
    var playerTitle   = document.getElementById('playerSongTitle');

    if (!lyricsBtn || !playerBar || !lyricsScroll) return;

    var manifest = null;        // { 规范化歌名: lrc文件名 }
    var manifestPromise = null;
    var currentKey = null;      // 当前已加载歌词的歌曲 key
    var lines = [];             // [{ t: 秒, text: 文本, el: DOM }]
    var activeIndex = -1;
    var userScrollTimer = null; // 用户手动滚动后暂停自动滚动的时间
    var userScrolling = false;

    /** 规范化歌名：忽略大小写、括号里的版本信息、空格和常见标点
     *  例：「等你下课 (with 杨瑞代)」->「等你下课」，「A.I.N.Y. 爱你」->「ainy爱你」 */
    function normTitle(s) {
        return (s || '')
            .replace(/[（(\[【][^）)\]】]*[）)\]】]/g, '')   // 去掉 (…)、（…）、[…]、【…】
            .toLowerCase()
            .replace(/[\s\-_·、,，.。!！?？'’“”"]/g, '');
    }

    /** 懒加载歌词索引（只请求一次） */
    function ensureManifest() {
        if (manifestPromise) return manifestPromise;
        manifestPromise = fetch('/assets/%E6%AD%8C%E8%AF%8D/index.json', { cache: 'no-cache' })
            .then(function (r) { return r.ok ? r.json() : {}; })
            .then(function (data) { manifest = data || {}; return manifest; })
            .catch(function () { manifest = {}; return manifest; });
        return manifestPromise;
    }

    /** 解析 LRC：一行可能有多个时间戳；忽略 [ti:]/[ar:] 等元数据标签 */
    function parseLrc(text) {
        var out = [];
        text.split(/\r?\n/).forEach(function (line) {
            var times = line.match(/\[\d{1,2}:\d{1,2}(?:[.:]\d{1,3})?\]/g);
            if (!times || !times.length) return;
            var content = line.replace(/\[[^\]]*\]/g, '').trim();
            times.forEach(function (tag) {
                var m = tag.match(/\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/);
                if (!m) return;
                var t = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
                if (m[3]) t += parseInt(m[3].padEnd(3, '0'), 10) / 1000;
                out.push({ t: t, text: content });
            });
        });
        out.sort(function (a, b) { return a.t - b.t; });
        return out;
    }

    function renderEmpty(msg) {
        lines = [];
        activeIndex = -1;
        lyricsScroll.classList.add('is-empty');   // 无歌词时整块居中显示提示
        lyricsInner.innerHTML = '<div class="lyrics-empty">' + (msg || '暂无歌词') + '</div>';
    }

    /** 渲染歌词行，并绑定点击跳转播放进度 */
    function render(parsed) {
        lyricsScroll.classList.remove('is-empty');
        lyricsInner.innerHTML = '';
        lines = parsed.map(function (p) {
            var div = document.createElement('div');
            div.className = 'lyrics-line';
            div.textContent = p.text || '···';
            div.addEventListener('click', function () {
                var audio = window.audio;
                if (audio && audio.src) {
                    audio.currentTime = p.t;
                    if (audio.paused) audio.play().catch(function () {});
                }
            });
            lyricsInner.appendChild(div);
            return { t: p.t, text: p.text, el: div };
        });
        activeIndex = -1;
        lyricsScroll.scrollTop = 0;
        syncLyrics(true);
    }

    /** 按歌名加载歌词：数据库 music.lyrics 优先，未命中回退本地 lrc 文件 */
    function loadLyrics(title) {
        var key = normTitle(title);
        if (!key) { renderEmpty('暂无歌曲，先去挑一首歌吧~'); return; }
        if (key === currentKey) return; // 同一首歌不重复加载
        currentKey = key;
        renderEmpty('歌词加载中...');

        // 1) 先查数据库：/music?keyword= 搜出候选，按规范化歌名精确匹配
        fetch('/api/music?keyword=' + encodeURIComponent(title) + '&size=8', { cache: 'no-cache' })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (data) {
                if (normTitle(title) !== currentKey) return;   // 加载期间已切歌
                var records = (data && data.records) || [];
                var hit = null;
                for (var i = 0; i < records.length; i++) {
                    if (normTitle(records[i].musicName) === key) { hit = records[i]; break; }
                }
                if (hit && hit.lyrics && hit.lyrics.trim()) {
                    var fromDb = parseLrc(hit.lyrics);
                    if (fromDb.length) { render(fromDb); return; }
                }
                // 2) 数据库没有（或格式不对）-> 回退本地 lrc 文件
                return loadFromLrcFile(title, key);
            })
            .catch(function () { loadFromLrcFile(title, key); });
    }

    /** 回退方案：从 /assets/歌词/*.lrc 加载（index.json 索引） */
    function loadFromLrcFile(title, key) {
        return ensureManifest().then(function (map) {
            if (normTitle(title) !== currentKey) return;
            var file = map[key] || null;
            if (!file) { renderEmpty('暂无歌词，等你来补充~'); return; }
            fetch('/assets/%E6%AD%8C%E8%AF%8D/' + encodeURIComponent(file), { cache: 'no-cache' })
                .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
                .then(function (txt) {
                    // 防止加载期间已经切到别的歌
                    if (normTitle(title) !== currentKey) return;
                    var parsed = parseLrc(txt);
                    if (!parsed.length) { renderEmpty('暂无歌词，等你来补充~'); return; }
                    render(parsed);
                })
                .catch(function () { renderEmpty('歌词加载失败，请稍后再试~'); });
        });
    }

    /** 从播放条歌名（"歌名 - 歌手"）读取当前歌曲并加载歌词 */
    function loadFromPlayerBar() {
        var full = (playerTitle && playerTitle.textContent || '').trim();
        if (!full || full === '暂无歌曲 请手动添加~') {
            currentKey = null;
            renderEmpty('点击播放歌曲后显示歌词~');
            return;
        }
        var parts = full.split(' - ');
        loadLyrics((parts[0] || '').trim());
    }

    /**
     * 播放进度同步：二分找当前句，高亮并平滑滚动到面板中间。
     * force = true 时无视 userScrolling 直接滚动（用于切歌/渲染后）。
     */
    function syncLyrics(force) {
        var audio = window.audio;
        if (!audio || !lines.length) return;
        var t = (audio.currentTime || 0) + 0.2; // 提前 0.2s，视觉上更跟手

        var lo = 0, hi = lines.length - 1, idx = -1;
        while (lo <= hi) {
            var mid = (lo + hi) >> 1;
            if (lines[mid].t <= t) { idx = mid; lo = mid + 1; }
            else { hi = mid - 1; }
        }
        // 纯音乐间奏等空行不高亮
        if (idx >= 0 && !lines[idx].text) idx = -1;

        if (idx === activeIndex) return;
        activeIndex = idx;
        lines.forEach(function (l, i) { l.el.classList.toggle('active', i === idx); });

        if (idx >= 0 && (force || !userScrolling)) {
            centerLine(lines[idx].el);
        }
    }

    /** 把某一行滚到窗口正中间（用 rect 计算，避免受父级定位影响） */
    function centerLine(el) {
        var viewRect = lyricsScroll.getBoundingClientRect();
        var elRect = el.getBoundingClientRect();
        var target = lyricsScroll.scrollTop
            + (elRect.top - viewRect.top)
            - (lyricsScroll.clientHeight - elRect.height) / 2;
        var max = lyricsScroll.scrollHeight - lyricsScroll.clientHeight;
        target = Math.max(0, Math.min(target, max));
        lyricsScroll.scrollTo({ top: target, behavior: 'smooth' });
    }

    /* ---------------- 展开 / 收起 ---------------- */
    function isOpen() {
        return playerBar.classList.contains('lyrics-open');
    }

    function openLyrics() {
        // 播放条若被收起，先让它出来
        playerBar.classList.remove('hidden');
        var showBtn = document.getElementById('playerShowBtn');
        if (showBtn) showBtn.classList.remove('active');

        playerBar.classList.add('lyrics-open');
        // 同步到 body：17-modal-fit.js 靠它判断「弹窗需要上滑避让播放条」
        document.body.classList.add('lyrics-open');
        lyricsBtn.classList.add('active');
        loadFromPlayerBar();                        // 打开时确保歌词与当前歌曲一致
        setTimeout(function () { syncLyrics(true); }, 520); // 展开动画结束后居中当前句
    }

    function closeLyrics() {
        playerBar.classList.remove('lyrics-open');
        document.body.classList.remove('lyrics-open');
        lyricsBtn.classList.remove('active');
    }

    lyricsBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (isOpen()) closeLyrics();
        else openLyrics();
    });

    // Esc 收起
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen()) closeLyrics();
    });

    // 隐藏播放条时顺带收起歌词（避免下次显示时是展开态）
    var hideBtn = document.getElementById('playerHideBtn');
    if (hideBtn) hideBtn.addEventListener('click', closeLyrics);

    /* ---------------- 用户手动滚动时暂停自动跟随，3 秒后恢复 ---------------- */
    function markUserScroll() {
        userScrolling = true;
        clearTimeout(userScrollTimer);
        userScrollTimer = setTimeout(function () { userScrolling = false; }, 3000);
    }
    lyricsScroll.addEventListener('wheel', markUserScroll, { passive: true });
    lyricsScroll.addEventListener('touchstart', markUserScroll, { passive: true });

    /* ---------------- 播放进度 & 切歌监听 ---------------- */
    function bindAudio() {
        var audio = window.audio;
        if (!audio || audio._lyricsBound) return;
        audio._lyricsBound = true;
        audio.addEventListener('timeupdate', function () { syncLyrics(false); });
        audio.addEventListener('seeked', function () { syncLyrics(true); });
        audio.addEventListener('ended', function () {
            activeIndex = -1;
            lines.forEach(function (l) { l.el.classList.remove('active'); });
        });
    }
    bindAudio();
    // 13-player.js 在本模块之前执行，window.audio 已存在；这里兜底再试几次
    var bindRetry = setInterval(function () {
        if (window.audio) { bindAudio(); clearInterval(bindRetry); }
    }, 1000);
    setTimeout(function () { clearInterval(bindRetry); }, 10000);

    // 切歌监听：播放条歌名一变就换歌词（不管展开与否，提前加载好）
    if (playerTitle && window.MutationObserver) {
        new MutationObserver(loadFromPlayerBar).observe(playerTitle, { childList: true, characterData: true, subtree: true });
    }

    // 页面刷新后恢复上次播放歌曲的歌词
    loadFromPlayerBar();
})();
