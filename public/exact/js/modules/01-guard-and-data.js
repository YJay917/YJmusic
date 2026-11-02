/**
 * =============================================================================
 * 模块：全局交互拦截与限制
 * 功能：未登录用户点击特定交互元素时拦截并提示登录
 * =============================================================================
 */
document.addEventListener('click', (e) => {
    if (localStorage.getItem('currentUser')) {
        return;
    }

    const target = e.target;
    
    const isPotentiallyInteractive = ['BUTTON', 'A', 'IMG', 'DIV', 'SPAN', 'I'].includes(target.tagName);
    if (!isPotentiallyInteractive) return;

    const interactiveElement = target.closest('button, a, img, .card-img, .clickable, [onclick], .chart-card, .recommendation-card, .quality-card, .album-card, .singer-item, .nav-item, .player-btn, .control-btn, .play-btn-circle, .side-btn, .player-progress-bar, .player-volume-slider, .heart-icon-btn');

    if (!interactiveElement) return;

    const cl = interactiveElement.classList;
    const isLoginTrigger = cl.contains('login-btn') ||
                          interactiveElement.id === 'recommendHeaderTitle' ||
                          interactiveElement.id === 'playerShowBtn' ||
                          interactiveElement.closest('.nav-list') ||
                          interactiveElement.closest('.nav-admin-entry') ||
                          interactiveElement.closest('.login-area') ||
                          cl.contains('recommendation-arrow') ||
                          cl.contains('carousel-3d-control') ||
                          cl.contains('quality-scroll-btn') ||
                          cl.contains('scroll-btn') ||
                          interactiveElement.closest('#loginModal') ||
                          interactiveElement.closest('#registerModal') ||
                          interactiveElement.closest('#settingsModal') ||
                          interactiveElement.closest('#passwordModal') ||
                          interactiveElement.closest('.agreement-item');

    if (!isLoginTrigger) {
        e.preventDefault();
        e.stopPropagation();
        
        const message = '请先点击右上角登录~';
        
        if (typeof window.showPlayerToast === 'function') {
            window.showPlayerToast(message);
        } else {
            alert(message);
        }
    }
}, true);

/**
 * =============================================================================
 * 模块：全局常量
 * =============================================================================
 */
/**
 * 歌曲时长兜底表（歌名 -> mm:ss）
 * 正式数据在数据库 music.duration，页面启动时会自动覆盖本表（见下方 loadMusicPaths）；
 * 这里只保留少量条目，用于接口未返回 / 离线时避免显示 00:00。
 */
const SONG_DURATION_MAP = {
    '七里香': '04:59', '偏爱': '03:32', '多远都要在一起': '04:36', '海阔天空': '05:25', '天外来物': '04:17',
    '富士山下': '04:18', '明日坐标': '03:45', 'What a Day': '03:12', '麦恩莉': '03:55', '关键词': '04:41',
    '一路向北': '04:55', '等你下课': '03:30', '说好不哭': '03:42', '说好的幸福呢': '04:16', '可惜没如果': '04:58',
    '我们的明天': '03:48', '光年之外': '03:55'
};

// 从后端加载全部歌曲的真实文件路径（歌名 -> /assets/music/xxx.mp3），
// 顺带用数据库里的 duration 覆盖上面那张硬编码映射表（DB 为准，映射表只做兜底）
window._songPathMap = {};
(function loadMusicPaths() {
    cachedGet('/api/music?size=200').then(function(data) {
        var records = (data && data.records) || [];
        records.forEach(function(m) {
            if (m.musicName && m.musicPath) window._songPathMap[m.musicName] = m.musicPath;
            if (m.musicName && m.duration) SONG_DURATION_MAP[m.musicName] = m.duration;
        });
    }).catch(function() {});
})();

// 根据歌名解析真实音频地址：优先用数据库里的路径，否则回退到 assets/music/<歌名>.mp3
function resolveMusicPath(title) {
    if (window._songPathMap && window._songPathMap[title]) return window._songPathMap[title];
    return '/assets/music/' + title + '.mp3';
}

/**
 * =============================================================================
 * 模块：从数据库加载热门歌曲
 * =============================================================================
 */
window._chartSongData = [];

// 从后端 /api/hot-songs 加载（数据库驱动）
document.addEventListener('DOMContentLoaded', function() {
    cachedGet('/api/hot-songs').then(function(data) {
        if (!data || !data.length) return;
        window._chartSongData = data.map(function(d) {
            return {
                title: d.music_name || '',
                singer: d.singer_name || '',
                path: d.music_path || '',
                img: d.image_path || ''
            };
        });
        // 填充排行榜（前15首）
        var lis = document.querySelectorAll('#hot-tab .chart-list li');
        for (var j = 0; j < lis.length && j < window._chartSongData.length; j++) {
            var s = window._chartSongData[j];
            lis[j].textContent = ((j % 3) + 1) + ' ' + s.title + '-' + s.singer;
        }
    }).catch(function() {});
});

// ======================== 从数据库加载热门歌曲（remen） ========================
window._remenSongData = [];

document.addEventListener('DOMContentLoaded', function() {
    cachedGet('/api/remen-songs').then(function(data) {
        if (!data || !data.length) return;
        window._remenSongData = data.map(function(d) {
            return {
                title: d.music_name || '',
                singer: d.singer_name || '',
                path: d.music_path || '',
                img: d.image_path || ''
            };
        });
        // 填充热门音乐卡片（12首，每行4个）
        var grid = document.getElementById('hotMusicGrid');
        if (grid) {
            var tags = ['tag-zhen','tag-quan','hq-tag','tag-zhen','tag-quan','hq-tag','tag-zhen','tag-quan','hq-tag','tag-zhen','hq-tag','tag-zhen'];
            var tagNames = ['臻品母带','全景声','HQ','臻品母带','全景声','HQ','臻品母带','全景声','HQ','臻品母带','HQ','臻品母带'];
            var delays = [100,200,300,400,100,200,300,400,100,200,300,400];
            var html = '';
            for (var k = 0; k < window._remenSongData.length; k++) {
                var m = window._remenSongData[k];
                var imgSrc = m.img || './歌曲/特别的人.png';
                if (imgSrc && imgSrc.indexOf('/') !== 0 && imgSrc.indexOf('./') !== 0) imgSrc = './' + imgSrc;
                html += '<div class="music-item reveal delay-' + delays[k] + ' active" data-duration="04:00">';
                html += '<div class="cover-wrap"><img class="music-cover" src="' + imgSrc + '" alt="' + escHtml(m.title) + '封面" loading="lazy" decoding="async"><div class="play-btn">▶</div></div>';
                html += '<div class="carousel-music-info"><div class="music-title">' + escHtml(m.title) + ' <span class="tag ' + tags[k] + '">' + tagNames[k] + '</span></div>';
                html += '<div class="music-singer">' + escHtml(m.singer) + '</div></div></div>';
            }
            grid.innerHTML = html;
        }
    }).catch(function() {});
});
