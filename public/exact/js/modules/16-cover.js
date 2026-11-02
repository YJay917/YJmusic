/**
 * =============================================================================
 * 模块：播放条歌曲封面（16-cover.js）
 * -----------------------------------------------------------------------------
 * 作用：播放条展开时，在歌名下方显示当前歌曲的封面（96×96 圆角图）。
 *
 * 数据来源：/api/music?size=500 的 imagePath 字段（歌曲表里的封面路径），
 *          首次播放时才拉取一次并缓存在内存里；没有封面的歌曲显示音符占位。
 * 触发：监听播放条歌名（#playerSongTitle）变化，切歌自动换封面。
 * =============================================================================
 */
(function () {
    var coverBox = document.getElementById('playerCover');
    var coverImg = document.getElementById('playerCoverImg');
    var playerTitle = document.getElementById('playerSongTitle');

    if (!coverBox || !coverImg || !playerTitle) return;

    var coverMap = null;        // { 规范化歌名: 图片路径 }
    var mapPromise = null;
    var currentKey = null;      // 当前已应用的歌名，避免重复设置

    /** 规范化歌名：忽略大小写、空格与常见标点（与歌词索引规则一致） */
    function normTitle(s) {
        return (s || '').toLowerCase().replace(/[\s\-_（）()\[\]【】·、,，.。!！?？'’“”"]/g, '');
    }

    /** 懒加载「歌名 -> 封面」映射（只请求一次） */
    function ensureMap() {
        if (mapPromise) return mapPromise;
        mapPromise = fetch('/api/music?size=500', { cache: 'no-cache' })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (data) {
                coverMap = {};
                var list = (data && data.records) || [];
                list.forEach(function (item) {
                    if (item && item.imagePath) coverMap[normTitle(item.musicName)] = item.imagePath;
                });
                return coverMap;
            })
            .catch(function () { coverMap = {}; return coverMap; });
        return mapPromise;
    }

    function showPlaceholder() {
        coverBox.classList.add('is-empty');
        coverImg.removeAttribute('src');
    }

    /** 封面路径规范化：库里可能是「assets/images/...」或「/assets/images/...」 */
    function normalizeSrc(src) {
        if (!src) return '';
        src = src.trim();
        if (src.indexOf('/') === 0 || src.indexOf('./') === 0) return src;
        return '/' + src;
    }

    /** 按「歌名 - 歌手」设置封面 */
    function applyCover(full) {
        if (!full || full.indexOf('暂无歌曲') === 0) {
            currentKey = null;
            showPlaceholder();
            return;
        }
        if (full === currentKey) return;
        currentKey = full;

        var title = full.split(' - ')[0].trim();
        ensureMap().then(function (map) {
            if (currentKey !== full) return;      // 加载期间已切歌
            var src = normalizeSrc(map[normTitle(title)]);
            if (!src) { showPlaceholder(); return; }
            coverImg.onerror = showPlaceholder;   // 图片 404 时退回占位
            coverImg.src = src;
            coverBox.classList.remove('is-empty');
        });
    }

    function syncFromBar() {
        applyCover((playerTitle.textContent || '').trim());
    }

    /* ---------------- 播放中呼吸灯：随 <audio> 的播放/暂停切换 ---------------- */
    function syncPlaying() {
        var audio = window.audio;
        var playing = !!(audio && !audio.paused && !audio.ended);
        coverBox.classList.toggle('is-playing', playing);
    }

    function bindAudio() {
        var audio = window.audio;
        if (!audio) return false;
        if (!audio._coverBound) {
            audio._coverBound = true;
            ['play', 'playing', 'pause', 'ended', 'emptied', 'loadstart'].forEach(function (ev) {
                audio.addEventListener(ev, syncPlaying);
            });
        }
        syncPlaying();
        return true;
    }

    if (!bindAudio()) {
        // 13-player.js 已先执行；这里兜底等 window.audio 就绪
        var bindRetry = setInterval(function () {
            if (bindAudio()) clearInterval(bindRetry);
        }, 800);
        setTimeout(function () { clearInterval(bindRetry); }, 10000);
    }

    // 切歌监听（不管播放条展开与否，提前准备好封面）
    if (window.MutationObserver) {
        new MutationObserver(syncFromBar).observe(playerTitle, {
            childList: true, characterData: true, subtree: true
        });
    }

    // 页面刷新后恢复当前歌曲的封面（含首次渲染）
    syncFromBar();
})();
