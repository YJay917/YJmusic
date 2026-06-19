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
                          interactiveElement.closest('.login-area') ||
                          cl.contains('recommendation-arrow') ||
                          cl.contains('carousel-3d-control') ||
                          cl.contains('quality-scroll-btn') ||
                          cl.contains('scroll-btn') ||
                          interactiveElement.closest('#loginModal') ||
                          interactiveElement.closest('#registerModal') ||
                          interactiveElement.closest('#alertModal') ||
                          interactiveElement.closest('#confirmModal') ||
                          interactiveElement.closest('#logoutModal') ||
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
const SONG_DURATION_MAP = {
    '七里香': '04:59', '偏爱': '03:32', '多远都要在一起': '04:36', '海阔天空': '05:25', '天外来物': '04:17',
    '富士山下': '04:18', '明日坐标': '03:45', 'What a Day': '03:12', '麦恩莉': '03:55', '关键词': '04:41',
    '一路向北': '04:55', '等你下课': '03:30', '说好不哭': '03:42', '说好的幸福呢': '04:16', '可惜没如果': '04:58',
    '我们的明天': '03:48', '光年之外': '03:55'
};

/**
 * =============================================================================
 * 模块：从数据库加载热门歌曲
 * =============================================================================
 */
window._chartSongData = [];

// 从后端 /api/hot-songs 加载（数据库驱动）
document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/hot-songs').then(function(r) { return r.json(); }).then(function(data) {
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
        // 填充热门音乐卡片（前12首）
        var grid = document.getElementById('hotMusicGrid');
        if (grid) {
            var tags = ['tag-zhen','tag-quan','hq-tag','tag-zhen','tag-quan','hq-tag','tag-zhen','tag-quan','hq-tag','tag-zhen','hq-tag','tag-zhen'];
            var tagNames = ['臻品母带','全景声','HQ','臻品母带','全景声','HQ','臻品母带','全景声','HQ','臻品母带','HQ','臻品母带'];
            var delays = [100,200,300,400,100,200,300,400,100,200,300,400];
            var html = '';
            for (var k = 0; k < 12 && k < window._chartSongData.length; k++) {
                var m = window._chartSongData[k];
                var imgSrc = m.img || '歌曲/特别的人.png';
                if (imgSrc && imgSrc.indexOf('/') !== 0) imgSrc = '/' + imgSrc;
                html += '<div class="music-item reveal delay-' + delays[k] + ' active" data-duration="04:00">';
                html += '<div class="cover-wrap"><img class="music-cover" src="' + imgSrc + '" alt="' + m.title + '封面" loading="lazy"><div class="play-btn">▶</div></div>';
                html += '<div class="carousel-music-info"><div class="music-title">' + m.title + ' <span class="tag ' + tags[k] + '">' + tagNames[k] + '</span></div>';
                html += '<div class="music-singer">' + m.singer + '</div></div></div>';
            }
            grid.innerHTML = html;
        }
    }).catch(function() {});
});

// ======================== 从数据库加载热门歌曲（remen） ========================
window._remenSongData = [];

document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/remen-songs').then(function(r) { return r.json(); }).then(function(data) {
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
                var imgSrc = m.img || '歌曲/特别的人.png';
                if (imgSrc && imgSrc.indexOf('/') !== 0) imgSrc = '/' + imgSrc;
                html += '<div class="music-item reveal delay-' + delays[k] + ' active" data-duration="04:00">';
                html += '<div class="cover-wrap"><img class="music-cover" src="' + imgSrc + '" alt="' + m.title + '封面" loading="lazy"><div class="play-btn">▶</div></div>';
                html += '<div class="carousel-music-info"><div class="music-title">' + m.title + ' <span class="tag ' + tags[k] + '">' + tagNames[k] + '</span></div>';
                html += '<div class="music-singer">' + m.singer + '</div></div></div>';
            }
            grid.innerHTML = html;
        }
    }).catch(function() {});
});

// ======================== 热门歌曲编辑弹窗（排行） ========================
var _hotAllMusic = [];

var _hotCurChart = 0;

async function openHotEditor() {
    var modal = document.getElementById('hotEditModal'); if (!modal) return;
    if (!_hotAllMusic.length) {
        try { var r = await fetch('/api/music?size=100'); var d = await r.json(); _hotAllMusic = Array.isArray(d) ? d : (d.records||[]); } catch(e) { _hotAllMusic = []; }
    }
    _hotCurChart = 0;
    renderHotEditorRows(0);
    // 标签页切换 + 滑动指示器
    var indicator = document.querySelector('.hot-tab-indicator');
    function updateIndicator(targetBtn) {
        if (indicator && targetBtn) {
            indicator.style.left = targetBtn.offsetLeft + 'px';
            indicator.style.width = targetBtn.offsetWidth + 'px';
        }
    }
    document.querySelectorAll('#hotEditTabs .hot-tab-btn').forEach(function(btn) {
        btn.onmouseenter = function() {
            updateIndicator(this);
        };
        btn.onclick = function() {
            var ci = parseInt(this.getAttribute('data-ci'));
            document.querySelectorAll('#hotEditTabs .hot-tab-btn').forEach(function(b){b.classList.remove('active');});
            this.classList.add('active');
            updateIndicator(this);
            _hotCurChart = ci;
            renderHotEditorRows(ci);
            initHotTableIndicator('hotEditTableWrap', 'hotEditTableIndicator');
        };
    });
    // 鼠标离开标签栏时，指示器回到当前激活的按钮
    document.getElementById('hotEditTabs').onmouseleave = function() {
        var activeBtn = document.querySelector('#hotEditTabs .hot-tab-btn.active');
        updateIndicator(activeBtn);
    };
    // 弹窗显示后再定位指示器
    setTimeout(function() {
        updateIndicator(document.querySelector('#hotEditTabs .hot-tab-btn.active'));
    }, 50);
    modal.style.display = 'flex'; setTimeout(function(){modal.classList.add('show')},10); toggleBodyScroll(true);

    // 底部按钮滑动指示器
    var footerIndicator = document.querySelector('.hot-footer-indicator');
    function updateFooterIndicator(target) {
        if (footerIndicator && target) {
            footerIndicator.style.left = target.offsetLeft + 'px';
            footerIndicator.style.width = target.offsetWidth + 'px';
        }
    }
    var footerBtns = document.querySelectorAll('#hotEditFooterBtns .hot-footer-btn');
    footerBtns.forEach(function(fb) {
        fb.onmouseenter = function() { updateFooterIndicator(this); };
    });
    document.getElementById('hotEditFooterBtns').onmouseleave = function() {
        // 默认回到保存按钮
        var saveBtn = document.getElementById('saveHotEditBtn');
        updateFooterIndicator(saveBtn);
    };
    // 指示器初始定位到保存按钮（无过渡动画）
    if (footerIndicator) {
        footerIndicator.style.transition = 'none';
        updateFooterIndicator(document.getElementById('saveHotEditBtn'));
        footerIndicator.offsetHeight;
        footerIndicator.style.transition = '';
    }

    // 初始化表格行滑动指示器
    initHotTableIndicator('hotEditTableWrap', 'hotEditTableIndicator');
}

function renderHotEditorRows(ci) {
    // 数据库无数据时显示暂无数据
    if (!_hotAllMusic.length) {
        document.getElementById('hotEditBody').innerHTML = '<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.4);padding:60px 20px;font-size:15px;">暂无数据</td></tr>';
        return;
    }
    var rows = '';
    for (var si = 0; si < 3; si++) {
        var idx = ci * 3 + si;
        var sg = (window._chartSongData && window._chartSongData[idx]) ? window._chartSongData[idx] : { title:'?', singer:'', img:'' };
        var imgSrc = sg.img || '';
        if (imgSrc && imgSrc.indexOf('/') !== 0) imgSrc = '/' + imgSrc;
        var imgTag = imgSrc ? '<img src="' + imgSrc + '" style="width:28px;height:28px;border-radius:4px;object-fit:cover;vertical-align:middle;margin-right:6px;">' : '<span style="display:inline-block;width:28px;height:28px;border-radius:4px;background:rgba(255,255,255,0.08);vertical-align:middle;margin-right:6px;text-align:center;line-height:28px;font-size:10px;">?</span>';
        rows += '<tr class="song-row">';
        rows += '<td style="text-align:center;color:rgba(255,255,255,0.45);font-size:15px;padding:18px 12px;">' + (si+1) + '</td>';
        rows += '<td style="padding:18px 0;"></td>';
        rows += '<td style="font-size:16px;padding:18px 12px;">' + imgTag + '<span class="song-name">' + escHtml(sg.title) + '</span> <span style="color:rgba(255,255,255,0.4);font-size:13px;">- ' + escHtml(sg.singer) + '</span></td>';
        rows += '<td style="padding:18px 0;"></td>';
        rows += '<td style="padding:18px 12px;"><div class="hot-custom-select" data-idx="'+idx+'" style="position:relative;width:260px;">';
        rows += '<div class="hot-select-trigger" style="padding:9px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);backdrop-filter:blur(10px);color:#fff;font-size:14px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 12px rgba(0,0,0,0.15);">';
        rows += '<span class="hot-select-text" style="font-size:14px;">保持当前</span><span style="color:rgba(255,255,255,0.4);font-size:11px;">▼</span></div>';
        rows += '<div class="hot-select-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:10;max-height:170px;overflow-y:auto;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:rgba(30,30,30,0.92);backdrop-filter:blur(16px);margin-top:4px;box-shadow:0 8px 32px rgba(0,0,0,0.4);scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;">';
        rows += '<div class="hot-select-option" data-val="" style="padding:9px 14px;color:rgba(255,255,255,0.4);cursor:pointer;font-size:13px;">保持当前</div>';
        for (var i = 0; i < _hotAllMusic.length; i++) {
            var m = _hotAllMusic[i];
            rows += '<div class="hot-select-option" data-val="'+m.id+'" style="padding:9px 14px;color:#fff;cursor:pointer;font-size:13px;">' + escHtml(m.musicName) + ' - ' + escHtml(m.singerName) + '</div>';
        }
        rows += '</div></div></td></tr>';
    }
    document.getElementById('hotEditBody').innerHTML = rows;

    // 绑定自定义下拉事件
    document.querySelectorAll('.hot-custom-select').forEach(function(cs) {
        var trigger = cs.querySelector('.hot-select-trigger');
        var dropdown = cs.querySelector('.hot-select-dropdown');
        var textSpan = cs.querySelector('.hot-select-text');
        trigger.onclick = function(e) {
            e.stopPropagation();
            // 关闭其他下拉
            document.querySelectorAll('.hot-select-dropdown').forEach(function(d) { if (d !== dropdown) d.style.display = 'none'; });
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        };
        dropdown.querySelectorAll('.hot-select-option').forEach(function(opt) {
            opt.onclick = function(e) {
                e.stopPropagation();
                textSpan.textContent = this.textContent;
                textSpan.style.color = this.getAttribute('data-val') ? '#fff' : 'rgba(255,255,255,0.4)';
                dropdown.style.display = 'none';
            };
            opt.onmouseenter = function() { this.style.background = 'rgba(255,255,255,0.1)'; };
            opt.onmouseleave = function() { this.style.background = 'transparent'; };
        });
    });

    // 点击外部关闭
    document.addEventListener('click', function() {
        document.querySelectorAll('.hot-select-dropdown').forEach(function(d) { d.style.display = 'none'; });
    });
}

function closeHotEditor() {
    var m = document.getElementById('hotEditModal'); if(!m)return;
    m.classList.remove('show'); setTimeout(function(){m.style.display='none'},300); toggleBodyScroll(false);
}

async function saveHotEditor() {
    var sels = document.querySelectorAll('#hotEditBody .hot-custom-select');
    // 检查是否有修改
    var hasChange = false;
    for (var c = 0; c < sels.length; c++) {
        var txt = sels[c].querySelector('.hot-select-text');
        if (txt && txt.textContent !== '保持当前') { hasChange = true; break; }
    }
    if (hasChange && !(await showConfirm('确定要保存当前榜单的修改吗？'))) return;

    var songs = [];
    for (var i = 0; i < sels.length; i++) {
        var txt = sels[i].querySelector('.hot-select-text');
        var idx = parseInt(sels[i].getAttribute('data-idx'));
        var musicId;
        if (txt && txt.textContent !== '保持当前') {
            // 从显示文本反查 musicId
            for (var j = 0; j < _hotAllMusic.length; j++) {
                if (escHtml(_hotAllMusic[j].musicName) + ' - ' + escHtml(_hotAllMusic[j].singerName) === txt.textContent) {
                    musicId = _hotAllMusic[j].id; break;
                }
            }
            if (!musicId) continue;
        } else {
            var sg = (window._chartSongData && window._chartSongData[idx]) ? window._chartSongData[idx] : null;
            if (!sg || !sg.title) continue;
            var found = null;
            for (var k = 0; k < _hotAllMusic.length; k++) {
                if (_hotAllMusic[k].musicName === sg.title && _hotAllMusic[k].singerName === sg.singer) {
                    found = _hotAllMusic[k]; break;
                }
            }
            if (!found) continue;
            musicId = found.id;
        }
        songs.push({ musicId: musicId, chartIndex: Math.floor(idx / 3), position: idx % 3 });
    }
    if (songs.length > 0) {
        // 立即更新本地数据
        for (var k = 0; k < songs.length; k++) {
            var s = songs[k];
            var idx2 = s.chartIndex * 3 + s.position;
            var fm = null;
            for (var l = 0; l < _hotAllMusic.length; l++) {
                if (_hotAllMusic[l].id === s.musicId) { fm = _hotAllMusic[l]; break; }
            }
            if (fm) {
                window._chartSongData[idx2] = {
                    title: fm.musicName || '', singer: fm.singerName || '',
                    path: fm.musicPath || '', img: fm.imagePath || ''
                };
            }
        }
        // 更新页面排行
        var lis = document.querySelectorAll('#hot-tab .chart-list li');
        for (var m = 0; m < lis.length && m < window._chartSongData.length; m++) {
            var sg2 = window._chartSongData[m];
            lis[m].textContent = ((m % 3) + 1) + ' ' + sg2.title + '-' + sg2.singer;
        }
        // 更新热门音乐卡片
        var grid = document.getElementById('hotMusicGrid');
        if (grid && window._chartSongData.length >= 12) {
            var tags = ['tag-zhen','tag-quan','hq-tag','tag-zhen','tag-quan','hq-tag','tag-zhen','tag-quan','hq-tag','tag-zhen','hq-tag','tag-zhen'];
            var tns = ['臻品母带','全景声','HQ','臻品母带','全景声','HQ','臻品母带','全景声','HQ','臻品母带','HQ','臻品母带'];
            var dls = [100,200,300,400,100,200,300,400,100,200,300,400];
            var html = '';
            for (var n = 0; n < 12; n++) {
                var sm = window._chartSongData[n];
                var is = sm.img || ''; if (is && is.indexOf('/') !== 0) is = '/' + is;
                html += '<div class="music-item reveal delay-' + dls[n] + ' active" data-duration="04:00">';
                html += '<div class="cover-wrap"><img class="music-cover" src="' + is + '" alt="" loading="lazy"><div class="play-btn">▶</div></div>';
                html += '<div class="carousel-music-info"><div class="music-title">' + sm.title + ' <span class="tag ' + tags[n] + '">' + tns[n] + '</span></div>';
                html += '<div class="music-singer">' + sm.singer + '</div></div></div>';
            }
            grid.innerHTML = html;
        }
        // 保存到后端
        fetch('/api/hot-songs', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(songs) })
        .then(function() { showPlayerToast('已保存'); }).catch(function() { showPlayerToast('后端保存失败'); });
    }
    closeHotEditor();
}

// ======================== 热门歌曲编辑弹窗（remen 12首） ========================
var _remenAllMusic = [];

async function openRemenEditor() {
    var modal = document.getElementById('remenEditModal'); if (!modal) return;
    // 每次打开都重新从数据库拉取最新数据
    try {
        var musicRes = await fetch('/api/music?size=100');
        var musicData = await musicRes.json();
        _remenAllMusic = Array.isArray(musicData) ? musicData : (musicData.records||[]);
    } catch(e) { _remenAllMusic = []; }
    try {
        var remenRes = await fetch('/api/remen-songs');
        var remenData = await remenRes.json();
        if (remenData && remenData.length) {
            window._remenSongData = remenData.map(function(d) {
                return { title: d.music_name || '', singer: d.singer_name || '', path: d.music_path || '', img: d.image_path || '' };
            });
        }
    } catch(e) {}
    renderRemenEditorRows();
    modal.style.display = 'flex'; setTimeout(function(){modal.classList.add('show')},10); toggleBodyScroll(true);

    // 底部按钮滑动指示器
    var footerIndicator = document.querySelector('#remenEditFooterBtns .hot-footer-indicator');
    function updateFooterIndicator(target) {
        if (footerIndicator && target) {
            footerIndicator.style.left = target.offsetLeft + 'px';
            footerIndicator.style.width = target.offsetWidth + 'px';
        }
    }
    var footerBtns = document.querySelectorAll('#remenEditFooterBtns .hot-footer-btn');
    footerBtns.forEach(function(fb) {
        fb.onmouseenter = function() { updateFooterIndicator(this); };
    });
    document.getElementById('remenEditFooterBtns').onmouseleave = function() {
        var saveBtn = document.getElementById('saveRemenEditBtn');
        updateFooterIndicator(saveBtn);
    };
    // 指示器初始定位到保存按钮（无过渡动画）
    if (footerIndicator) {
        footerIndicator.style.transition = 'none';
        updateFooterIndicator(document.getElementById('saveRemenEditBtn'));
        footerIndicator.offsetHeight;
        footerIndicator.style.transition = '';
    }

    // 初始化表格行滑动指示器
    initHotTableIndicator('remenEditTableWrap', 'remenEditTableIndicator');
}

function renderRemenEditorRows() {
    if (!_remenAllMusic.length) {
        document.getElementById('remenEditBody').innerHTML = '<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.4);padding:60px 20px;font-size:15px;">暂无数据</td></tr>';
        return;
    }
    var rows = '';
    for (var si = 0; si < 12; si++) {
        var sg = (window._remenSongData && window._remenSongData[si]) ? window._remenSongData[si] : { title:'?', singer:'', img:'' };
        var imgSrc = sg.img || '';
        if (imgSrc && imgSrc.indexOf('/') !== 0) imgSrc = '/' + imgSrc;
        var imgTag = imgSrc ? '<img src="' + imgSrc + '" style="width:28px;height:28px;border-radius:4px;object-fit:cover;vertical-align:middle;margin-right:6px;">' : '<span style="display:inline-block;width:28px;height:28px;border-radius:4px;background:rgba(255,255,255,0.08);vertical-align:middle;margin-right:6px;text-align:center;line-height:28px;font-size:10px;">?</span>';
        rows += '<tr class="song-row">';
        rows += '<td style="text-align:center;color:rgba(255,255,255,0.45);font-size:15px;padding:18px 12px;">' + (si+1) + '</td>';
        rows += '<td style="padding:18px 0;"></td>';
        rows += '<td style="font-size:16px;padding:18px 12px;">' + imgTag + '<span class="song-name">' + escHtml(sg.title) + '</span> <span style="color:rgba(255,255,255,0.4);font-size:13px;">- ' + escHtml(sg.singer) + '</span></td>';
        rows += '<td style="padding:18px 0;"></td>';
        rows += '<td style="padding:18px 12px;"><div class="hot-custom-select" data-idx="'+si+'" style="position:relative;width:260px;">';
        rows += '<div class="hot-select-trigger" style="padding:9px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);backdrop-filter:blur(10px);color:#fff;font-size:14px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 12px rgba(0,0,0,0.15);">';
        rows += '<span class="hot-select-text" style="font-size:14px;">保持当前</span><span style="color:rgba(255,255,255,0.4);font-size:11px;">▼</span></div>';
        rows += '<div class="hot-select-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:10;max-height:170px;overflow-y:auto;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:rgba(30,30,30,0.92);backdrop-filter:blur(16px);margin-top:4px;box-shadow:0 8px 32px rgba(0,0,0,0.4);scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;">';
        rows += '<div class="hot-select-option" data-val="" style="padding:9px 14px;color:rgba(255,255,255,0.4);cursor:pointer;font-size:13px;">保持当前</div>';
        for (var i = 0; i < _remenAllMusic.length; i++) {
            var m = _remenAllMusic[i];
            rows += '<div class="hot-select-option" data-val="'+m.id+'" style="padding:9px 14px;color:#fff;cursor:pointer;font-size:13px;">' + escHtml(m.musicName) + ' - ' + escHtml(m.singerName) + '</div>';
        }
        rows += '</div></div></td></tr>';
    }
    document.getElementById('remenEditBody').innerHTML = rows;

    // 绑定自定义下拉事件
    document.querySelectorAll('#remenEditBody .hot-custom-select').forEach(function(cs) {
        var trigger = cs.querySelector('.hot-select-trigger');
        var dropdown = cs.querySelector('.hot-select-dropdown');
        var textSpan = cs.querySelector('.hot-select-text');
        trigger.onclick = function(e) {
            e.stopPropagation();
            document.querySelectorAll('#remenEditBody .hot-select-dropdown').forEach(function(d) { if (d !== dropdown) d.style.display = 'none'; });
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        };
        dropdown.querySelectorAll('.hot-select-option').forEach(function(opt) {
            opt.onclick = function(e) {
                e.stopPropagation();
                textSpan.textContent = this.textContent;
                textSpan.style.color = this.getAttribute('data-val') ? '#fff' : 'rgba(255,255,255,0.4)';
                dropdown.style.display = 'none';
            };
            opt.onmouseenter = function() { this.style.background = 'rgba(255,255,255,0.1)'; };
            opt.onmouseleave = function() { this.style.background = 'transparent'; };
        });
    });

    // 点击外部关闭
    document.addEventListener('click', function() {
        document.querySelectorAll('#remenEditBody .hot-select-dropdown').forEach(function(d) { d.style.display = 'none'; });
    });
}

function closeRemenEditor() {
    var m = document.getElementById('remenEditModal'); if(!m)return;
    m.classList.remove('show'); setTimeout(function(){m.style.display='none'},300); toggleBodyScroll(false);
}

async function saveRemenEditor() {
    var sels = document.querySelectorAll('#remenEditBody .hot-custom-select');
    // 检查是否有修改
    var hasChange = false;
    for (var c = 0; c < sels.length; c++) {
        var txt = sels[c].querySelector('.hot-select-text');
        if (txt && txt.textContent !== '保持当前') { hasChange = true; break; }
    }
    if (hasChange && !(await showConfirm('确定要保存热门歌曲的修改吗？'))) return;

    var songs = [];
    for (var i = 0; i < sels.length; i++) {
        var txt = sels[i].querySelector('.hot-select-text');
        var idx = parseInt(sels[i].getAttribute('data-idx'));
        var musicId;
        if (txt && txt.textContent !== '保持当前') {
            for (var j = 0; j < _remenAllMusic.length; j++) {
                if (escHtml(_remenAllMusic[j].musicName) + ' - ' + escHtml(_remenAllMusic[j].singerName) === txt.textContent) {
                    musicId = _remenAllMusic[j].id; break;
                }
            }
            if (!musicId) continue;
        } else {
            var sg = (window._remenSongData && window._remenSongData[idx]) ? window._remenSongData[idx] : null;
            if (!sg || !sg.title) continue;
            var found = null;
            for (var k = 0; k < _remenAllMusic.length; k++) {
                if (_remenAllMusic[k].musicName === sg.title && _remenAllMusic[k].singerName === sg.singer) {
                    found = _remenAllMusic[k]; break;
                }
            }
            if (!found) continue;
            musicId = found.id;
        }
        songs.push({ musicId: musicId, position: idx });
    }
    if (songs.length > 0) {
        // 立即更新本地数据
        for (var k = 0; k < songs.length; k++) {
            var s = songs[k];
            var fm = null;
            for (var l = 0; l < _remenAllMusic.length; l++) {
                if (_remenAllMusic[l].id === s.musicId) { fm = _remenAllMusic[l]; break; }
            }
            if (fm) {
                window._remenSongData[s.position] = {
                    title: fm.musicName || '', singer: fm.singerName || '',
                    path: fm.musicPath || '', img: fm.imagePath || ''
                };
            }
        }
        // 更新热门音乐卡片
        var grid = document.getElementById('hotMusicGrid');
        if (grid && window._remenSongData.length >= 12) {
            var tags = ['tag-zhen','tag-quan','hq-tag','tag-zhen','tag-quan','hq-tag','tag-zhen','tag-quan','hq-tag','tag-zhen','hq-tag','tag-zhen'];
            var tns = ['臻品母带','全景声','HQ','臻品母带','全景声','HQ','臻品母带','全景声','HQ','臻品母带','HQ','臻品母带'];
            var dls = [100,200,300,400,100,200,300,400,100,200,300,400];
            var html = '';
            for (var n = 0; n < 12; n++) {
                var sm = window._remenSongData[n];
                var is = sm.img || ''; if (is && is.indexOf('/') !== 0) is = '/' + is;
                html += '<div class="music-item reveal delay-' + dls[n] + ' active" data-duration="04:00">';
                html += '<div class="cover-wrap"><img class="music-cover" src="' + is + '" alt="" loading="lazy"><div class="play-btn">▶</div></div>';
                html += '<div class="carousel-music-info"><div class="music-title">' + sm.title + ' <span class="tag ' + tags[n] + '">' + tns[n] + '</span></div>';
                html += '<div class="music-singer">' + sm.singer + '</div></div></div>';
            }
            grid.innerHTML = html;
        }
        // 保存到后端
        fetch('/api/remen-songs', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(songs) })
        .then(function() { showPlayerToast('已保存'); }).catch(function() { showPlayerToast('后端保存失败'); });
    }
    closeRemenEditor();
}

// ======================== 歌手编辑弹窗 ========================
function openSingerEditor() {
    var modal = document.getElementById('singerEditModal');
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(function() { modal.classList.add('show'); }, 10);
    toggleBodyScroll(true);
    loadSingerEditList();
}

function closeSingerEditor() {
    var modal = document.getElementById('singerEditModal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(function() { modal.style.display = 'none'; }, 300);
    toggleBodyScroll(false);
}

// 歌手编辑分页
var singerEditAll = [];
var singerEditPage = 1;
var singerEditPageSize = 5;

function loadSingerEditList() {
    var tbody = document.getElementById('singerEditBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.4);padding:40px;">加载中...</td></tr>';

    fetch('/api/singers')
        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .catch(function() { return fetch('/singers').then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); })
        .then(function(singers) {
            if (!Array.isArray(singers) || singers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.4);padding:40px;">暂无歌手</td></tr>';
                document.getElementById('singerPag').style.display = 'none';
                return;
            }
            singerEditAll = singers;
            singerEditPage = 1;
            renderSingerEditPage();
            bindSingerPagEvents();
        })
        .catch(function(err) {
            console.error('加载歌手列表失败:', err);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.4);padding:40px;">加载失败</td></tr>';
        });
}

function renderSingerEditPage() {
    var tbody = document.getElementById('singerEditBody');
    var total = Math.ceil(singerEditAll.length / singerEditPageSize);
    var start = (singerEditPage - 1) * singerEditPageSize;
    var pageData = singerEditAll.slice(start, start + singerEditPageSize);

    var html = '';
    pageData.forEach(function(s, i) {
        var imgPath = s.image_path || s.imagePath || '';
        if (imgPath && imgPath.indexOf('../') === 0) imgPath = '.' + imgPath.substring(2);
        if (!imgPath) imgPath = './歌手/周杰伦.png';
        var fansText = s.fans != null ? s.fans + 'w' : '—';
        html += '<tr class="song-row singer-edit-row" data-sid="' + s.id + '">';
        html += '<td style="text-align:center;padding:0;"><img src="' + imgPath + '" style="width:38px;height:38px;border-radius:50%;object-fit:cover;" onerror="this.src=\'./歌手/周杰伦.png\'"></td>';
        html += '<td data-field="name" style="padding-left:30px;color:#fff;"><span class="song-name">' + escHtml(s.name || '') + '</span></td>';
        html += '<td data-field="fans" style="text-align:right;padding-right:20px;font-size:13px;color:#fff;">' + fansText + '</td>';
        html += '<td data-field="country" style="text-align:right;padding-right:30px;color:#fff;">' + escHtml(s.country || '—') + '</td>';
        html += '<td style="text-align:center;">';
        html += '<button style="color:#fff;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.08);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:7px 16px;font-size:14px;border-radius:20px;cursor:pointer;font-weight:500;margin-right:6px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" onclick="editSingerInline(' + s.id + ')">修改</button>';
        html += '<button style="color:#e4393c;border:1px solid rgba(228,57,60,0.3);background:rgba(228,57,60,0.1);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:7px 16px;font-size:14px;border-radius:20px;cursor:pointer;font-weight:500;box-shadow:0 2px 8px rgba(228,57,60,0.1);" onclick="deleteSingerConfirm(' + s.id + ', \'' + escHtml(s.name || '') + '\')">删除</button>';
        html += '</td>';
        html += '</tr>';
    });
    tbody.innerHTML = html;

    // 分页控件
    var pagDiv = document.getElementById('singerPag');
    var prevBtn = document.getElementById('singerPrevPage');
    var nextBtn = document.getElementById('singerNextPage');
    var info = document.getElementById('singerEditPageInfo');
    if (pagDiv) {
        pagDiv.style.display = total > 1 ? 'flex' : 'none';
        if (prevBtn) prevBtn.disabled = singerEditPage <= 1;
        if (nextBtn) nextBtn.disabled = singerEditPage >= total;
        if (info) info.textContent = '第 ' + singerEditPage + ' 页 / 共 ' + total + ' 页';
        // 分页指示器：首次渲染瞬间定位，翻页保留过渡
        var pagIndicator = document.getElementById('singerPagIndicator');
        var pagFirstOpen = !pagIndicator._initDone;
        if (!pagIndicator._initDone) {
            pagIndicator._initDone = true;
        }
        setTimeout(function() {
            var target = _singerPagActiveBtn && !_singerPagActiveBtn.disabled ? _singerPagActiveBtn : (prevBtn && !prevBtn.disabled ? prevBtn : (nextBtn && !nextBtn.disabled ? nextBtn : null));
            if (target) {
                if (pagFirstOpen) {
                    pagIndicator.style.transition = 'none';
                    pagIndicator.style.left = target.offsetLeft + 'px';
                    pagIndicator.style.width = target.offsetWidth + 'px';
                    requestAnimationFrame(function() {
                        requestAnimationFrame(function() { pagIndicator.style.transition = ''; });
                    });
                } else {
                    pagIndicator.style.left = target.offsetLeft + 'px';
                    pagIndicator.style.width = target.offsetWidth + 'px';
                }
                _singerPagActiveBtn = target;
            }
        }, 80);
    }

    initSingerTableIndicator();
}

var _singerPagActiveBtn = null;
function bindSingerPagEvents() {
    var prevBtn = document.getElementById('singerPrevPage');
    var nextBtn = document.getElementById('singerNextPage');
    var pagIndicator = document.getElementById('singerPagIndicator');

    function updatePagIndicator(target) {
        if (pagIndicator && target && !target.disabled) {
            pagIndicator.style.left = target.offsetLeft + 'px';
            pagIndicator.style.width = target.offsetWidth + 'px';
        }
    }

    if (prevBtn) {
        prevBtn.onclick = function() {
            if (singerEditPage > 1) { singerEditPage--; _singerPagActiveBtn = this; renderSingerEditPage(); }
        };
        prevBtn.addEventListener('mouseenter', function() {
            if (!this.disabled) updatePagIndicator(this);
        });
    }
    if (nextBtn) {
        nextBtn.onclick = function() {
            var total = Math.ceil(singerEditAll.length / singerEditPageSize);
            if (singerEditPage < total) { singerEditPage++; _singerPagActiveBtn = this; renderSingerEditPage(); }
        };
        nextBtn.addEventListener('mouseenter', function() {
            if (!this.disabled) updatePagIndicator(this);
        });
    }
    // 离开分页区 → 回到上次点击的按钮
    var pagDiv = document.getElementById('singerPag');
    if (pagDiv) {
        pagDiv.addEventListener('mouseleave', function() {
            var target = _singerPagActiveBtn && !_singerPagActiveBtn.disabled ? _singerPagActiveBtn : (prevBtn && !prevBtn.disabled ? prevBtn : (nextBtn && !nextBtn.disabled ? nextBtn : null));
            updatePagIndicator(target);
        });
    }
}

// 表格行滑动指示器（复刻 artistpage 逻辑）
function initSingerTableIndicator() {
    var indicator = document.getElementById('singerTableIndicator');
    var tableWrap = document.getElementById('singerTableWrap');
    var thead = tableWrap ? tableWrap.querySelector('thead') : null;
    if (!indicator || !tableWrap || !thead) return;

    // 行 hover
    tableWrap.querySelectorAll('tbody .song-row').forEach(function(row) {
        row.addEventListener('mouseenter', function() {
            var wrapRect = tableWrap.getBoundingClientRect();
            var rowRect = this.getBoundingClientRect();
            indicator.style.opacity = '1';
            indicator.style.top = (rowRect.top - wrapRect.top) + 'px';
            indicator.style.height = rowRect.height + 'px';
        });
    });

    // 离开 → 回到表头
    tableWrap.addEventListener('mouseleave', function() {
        var wrapRect = tableWrap.getBoundingClientRect();
        var headRect = thead.getBoundingClientRect();
        indicator.style.top = (headRect.top - wrapRect.top) + 'px';
        indicator.style.height = headRect.height + 'px';
    });

    // 默认停在表头
    function positionAtThead() {
        var wrapRect = tableWrap.getBoundingClientRect();
        var headRect = thead.getBoundingClientRect();
        if (headRect.height > 0) {
            indicator.style.transition = 'none';
            indicator.style.top = (headRect.top - wrapRect.top) + 'px';
            indicator.style.height = headRect.height + 'px';
            indicator.style.opacity = '1';
            requestAnimationFrame(function() {
                requestAnimationFrame(function() { indicator.style.transition = ''; });
            });
        } else {
            setTimeout(positionAtThead, 100);
        }
    }
    setTimeout(positionAtThead, 150);
}

// 热门/排行编辑表格行滑动指示器
function initHotTableIndicator(wrapId, indicatorId) {
    var indicator = document.getElementById(indicatorId);
    var tableWrap = document.getElementById(wrapId);
    var thead = tableWrap ? tableWrap.querySelector('thead') : null;
    if (!indicator || !tableWrap || !thead) return;

    tableWrap.querySelectorAll('tbody .song-row').forEach(function(row) {
        row.addEventListener('mouseenter', function() {
            var wrapRect = tableWrap.getBoundingClientRect();
            var rowRect = this.getBoundingClientRect();
            indicator.style.opacity = '1';
            indicator.style.top = (rowRect.top - wrapRect.top) + 'px';
            indicator.style.height = rowRect.height + 'px';
        });
    });

    tableWrap.addEventListener('mouseleave', function() {
        var wrapRect = tableWrap.getBoundingClientRect();
        var headRect = thead.getBoundingClientRect();
        indicator.style.top = (headRect.top - wrapRect.top) + 'px';
        indicator.style.height = headRect.height + 'px';
    });

    function positionAtThead() {
        var wrapRect = tableWrap.getBoundingClientRect();
        var headRect = thead.getBoundingClientRect();
        if (headRect.height > 0) {
            indicator.style.transition = 'none';
            indicator.style.top = (headRect.top - wrapRect.top) + 'px';
            indicator.style.height = headRect.height + 'px';
            indicator.style.opacity = '1';
            requestAnimationFrame(function() {
                requestAnimationFrame(function() { indicator.style.transition = ''; });
            });
        } else {
            setTimeout(positionAtThead, 100);
        }
    }
    setTimeout(positionAtThead, 150);
}

// 删除二次确认
async function deleteSingerConfirm(id, name) {
    if (await showConfirm('确定删除歌手「' + name + '」吗？此操作不可撤销。')) {
        deleteSinger(id);
    }
}

// 行内修改
function editSingerInline(id) {
    var row = document.querySelector('.singer-edit-row[data-sid="' + id + '"]');
    if (!row) return;
    var cells = row.querySelectorAll('td[data-field]');
    cells.forEach(function(td) {
        var field = td.getAttribute('data-field');
        var current = td.textContent.trim();
        td.innerHTML = '<input type="text" value="' + escHtml(current) + '" data-field="' + field + '" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid rgba(228,57,60,0.4);background:rgba(0,0,0,0.4);color:#fff;font-size:13px;outline:none;">';
    });
    // 修改按钮变保存
    var btnCell = row.querySelector('td:last-child');
    btnCell.innerHTML = '<button class="action-btn-small" style="color:#fff;border-color:rgba(228,57,60,0.5);background:rgba(228,57,60,0.2);padding:4px 10px;" onclick="saveSingerInline(' + id + ')">保存</button>';
}

// 保存行内修改
function saveSingerInline(id) {
    var row = document.querySelector('.singer-edit-row[data-sid="' + id + '"]');
    if (!row) return;
    var inputs = row.querySelectorAll('input[data-field]');
    var payload = { id: id };
    inputs.forEach(function(inp) {
        payload[inp.getAttribute('data-field')] = inp.value.trim();
    });

    fetch('/api/singers', {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
    })
    .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .catch(function() {
        return fetch('/singers', {
            method: 'PUT',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(payload)
        }).then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    })
    .then(function() {
        showPlayerToast('歌手信息已更新');
        loadSingerEditList();
        refreshSingersOnPage();
    })
    .catch(function(err) {
        console.error('更新失败:', err);
        showPlayerToast('更新失败');
        loadSingerEditList();
    });
}

function addSingerFromForm() {
    var name = document.getElementById('newSingerName').value.trim();
    if (!name) { showPlayerToast('请输入歌手名'); return; }
    var country = document.getElementById('newSingerCountry').value.trim() || '中国';
    var fans = parseFloat(document.getElementById('newSingerFans').value) || 0;
    var gender = document.getElementById('newSingerGenderVal').value;
    var imageFile = document.getElementById('newSingerImage').files[0];
    var imagePath = imageFile ? '../歌手/' + imageFile.name : '../歌手/周杰伦.png';

    var payload = { name: name, country: country, fans: fans, gender: gender, imagePath: imagePath };

    fetch('/api/singers', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
    })
    .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .catch(function() {
        return fetch('/singers', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(payload)
        }).then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    })
    .then(function() {
        showPlayerToast('歌手已添加');
        document.getElementById('newSingerName').value = '';
        document.getElementById('newSingerCountry').value = '';
        document.getElementById('newSingerFans').value = '';
        document.getElementById('newSingerImage').value = '';
        loadSingerEditList();
        refreshSingersOnPage();
    })
    .catch(function(err) {
        console.error('添加歌手失败:', err);
        showPlayerToast('添加失败');
    });
}

async function deleteSinger(id) {
    fetch('/api/singers/' + id, { method: 'DELETE' })
        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); })
        .catch(function() { return fetch('/singers/' + id, { method: 'DELETE' }).then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); }); })
        .then(function() {
            showPlayerToast('歌手已删除');
            loadSingerEditList();
            refreshSingersOnPage();
        })
        .catch(function(err) {
            console.error('删除歌手失败:', err);
            showPlayerToast('删除失败');
        });
}

// 刷新主页歌手列表
function refreshSingersOnPage() {
    var container = document.getElementById('extended-singer-list');
    if (!container) return;
    fetch('/api/singers')
        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .catch(function() { return fetch('/singers').then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); })
        .then(function(singers) {
            if (!Array.isArray(singers) || singers.length === 0) return;
            singerPageAll = singers;
            singerPageCurrent = 1;
            renderSingerPage();
            bindSingerPageEvents();
        })
        .catch(function() {});
}

// 事件绑定
document.getElementById('closeSingerEditBtn')?.addEventListener('click', closeSingerEditor);
document.getElementById('singerEditModal')?.addEventListener('click', function(e) { if (e.target.id === 'singerEditModal') closeSingerEditor(); });
document.getElementById('addSingerBtn')?.addEventListener('click', addSingerFromForm);
// 头像文件选择预览
document.getElementById('newSingerImage')?.addEventListener('change', function() {
    var preview = document.getElementById('singerImagePreview');
    if (preview) {
        preview.textContent = this.files[0] ? this.files[0].name : '未选择文件';
        preview.style.color = this.files[0] ? '#fff' : 'rgba(255,255,255,0.7)';
    }
});

/**
 * =============================================================================
 * 模块：初始化设置
 * 功能：重置滚动条位置，确保页面加载时回到顶部
 * =============================================================================
 */
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

window.addEventListener('load', () => {
    window.scrollTo(0, 0);
});

/**
 * =============================================================================
 * 模块：弹窗滚动锁定与全局状态
 * 功能：控制弹窗打开时背景页面的滚动状态和导航栏交互
 * =============================================================================
 */
window.isModalOpen = false;

function toggleBodyScroll(isLocked) {
    window.isModalOpen = isLocked;
    const navItems = document.querySelectorAll('.nav-item');
    const searchInput = document.getElementById('navSearchInput');
    const searchBtn = document.getElementById('navSearchBtn');
    const logoEl = document.querySelector('.logo');

    if (isLocked) {
        document.body.classList.add('modal-open');
        navItems.forEach(item => {
            item.classList.add('disabled');
            item.setAttribute('aria-disabled', 'true');
        });
        // 禁用搜索栏
        if (searchInput) { searchInput.disabled = true; searchInput.style.pointerEvents = 'none'; }
        if (searchBtn) { searchBtn.disabled = true; searchBtn.style.pointerEvents = 'none'; }
        // 禁用 Music logo
        if (logoEl) { logoEl.classList.add('disabled'); logoEl.style.pointerEvents = 'none'; }

        if (typeof stopHero3DAutoPlay === 'function') stopHero3DAutoPlay();
        if (typeof stopQualityAutoPlay === 'function') stopQualityAutoPlay();
    } else {
        setTimeout(() => {
            const visibleModals = Array.from(document.querySelectorAll('.modal-mask')).filter(m =>
                m.style.display === 'flex' || m.classList.contains('show')
            );
            if (visibleModals.length === 0) {
                document.body.classList.remove('modal-open');
                window.isModalOpen = false;
                navItems.forEach(item => {
                    item.classList.remove('disabled');
                    item.removeAttribute('aria-disabled');
                });
                // 恢复搜索栏
                if (searchInput) { searchInput.disabled = false; searchInput.style.pointerEvents = ''; }
                if (searchBtn) { searchBtn.disabled = false; searchBtn.style.pointerEvents = ''; }
                // 恢复 Music logo
                if (logoEl) { logoEl.classList.remove('disabled'); logoEl.style.pointerEvents = ''; }

                if (typeof startHero3DAutoPlay === 'function') startHero3DAutoPlay();
                if (typeof startQualityAutoPlay === 'function') startQualityAutoPlay();
            }
        }, 350);
    }
}

/**
 * =============================================================================
 * 模块：排行榜播放与交互逻辑
 * 功能：处理排行榜封面的随机播放、单曲播放以及批量收藏功能
 * =============================================================================
 */
const lastPlayedIndices = {};

function togglePlay(element) {
    const chartCard = element.closest('.chart-card');
    if (!chartCard) return;

    const chartTitle = chartCard.querySelector('.chart-title').textContent.trim();
    const chartSongs = Array.from(chartCard.querySelectorAll('.chart-list li')).map(li => {
        const text = li.textContent.trim();
        const songInfo = text.replace(/^\d+\s+/, '');
        const [title, singer] = songInfo.split('-').map(s => s.trim());
        const duration = SONG_DURATION_MAP[title] || '04:00';
        return { title, singer, duration };
    });

    if (chartSongs.length === 0) return;

    let randomIndex;
    const lastIndex = lastPlayedIndices[chartTitle];
    if (chartSongs.length > 1) {
        do {
            randomIndex = Math.floor(Math.random() * chartSongs.length);
        } while (randomIndex === lastIndex);
    } else {
        randomIndex = 0;
    }
    
    lastPlayedIndices[chartTitle] = randomIndex;
    const selectedSong = chartSongs[randomIndex];
    const tagStyles = ['臻品母带', '全景声', 'HQ'];
    const randomTag = tagStyles[Math.floor(Math.random() * tagStyles.length)];

    if (typeof window.playSingleSong === 'function') {
        window.playSingleSong(selectedSong.title, selectedSong.singer, selectedSong.duration, randomTag, true, true);
        if (typeof window.showPlayerToast === 'function') {
            window.showPlayerToast(`正在播放榜单: ${chartTitle}`);
        }
    }
}

function playChartAll(element) {
    if (typeof togglePlay === 'function') togglePlay(element);
}

function favChartAll(element) {
    const chartCard = element.closest('.chart-card');
    if (!chartCard) return;

    const chartTitle = chartCard.querySelector('.chart-title').textContent.trim();
    const chartSongs = Array.from(chartCard.querySelectorAll('.chart-list li')).map(li => {
        const text = li.textContent.trim();
        const songInfo = text.replace(/^\d+\s+/, '');
        const [title, singer] = songInfo.split('-').map(s => s.trim());
        return { title, singer };
    });

    if (chartSongs.length === 0) return;

    const currentUser = getCurrentUserRecord();
    const userId = currentUser?.id;

    chartSongs.forEach(song => {
        // 同步 localStorage 缓存
        const favorites = JSON.parse(localStorage.getItem('yjay_favorites') || '[]');
        const exists = favorites.some(f => f.title === song.title && f.singer === song.singer);
        if (!exists) {
            favorites.unshift({
                title: song.title,
                singer: song.singer,
                duration: SONG_DURATION_MAP[song.title] || '04:00'
            });
            localStorage.setItem('yjay_favorites', JSON.stringify(favorites));
        }
        // 写后端
        if (userId) {
            apiRequest('/favorites', {
                method: 'POST',
                body: JSON.stringify({ userId, title: song.title, singer: song.singer, duration: SONG_DURATION_MAP[song.title] || '04:00' })
            }).catch(() => {});
        }
    });

    showPlayerToast(`已成功收藏 ${chartTitle} 的所有歌曲`);

    const favoritesIframe = document.querySelector('#favoritesModal iframe');
    if (favoritesIframe && favoritesIframe.contentWindow && typeof favoritesIframe.contentWindow.loadFromLocalStorage === 'function') {
        favoritesIframe.contentWindow.loadFromLocalStorage(true);
    }
}

function playChartSong(element) {
    const text = element.textContent.trim();
    const songInfo = text.replace(/^\d+\s+/, '');
    const [title, singer] = songInfo.split('-').map(s => s.trim());
    const duration = SONG_DURATION_MAP[title] || '04:00';

    if (typeof window.playSingleSong === 'function') {
        window.playSingleSong(title, singer, duration, 'HQ', true, true);
        if (typeof window.showPlayerToast === 'function') {
            window.showPlayerToast(`正在播放: ${title} - ${singer}`);
        }
    }
}

/**
 * =============================================================================
 * 模块：播放历史同步
 * 功能：播放歌曲时，将歌曲添加到 historylist 弹窗中
 * =============================================================================
 */
window.syncToHistory = function(title, singer, duration) {
    // 先更新 localStorage 以确保持久化，即使 iframe 没加载也能保存
    const saved = localStorage.getItem('yjay_played');
    let history = saved ? JSON.parse(saved) : [];
    
    // 检查是否已存在
    const existingIndex = history.findIndex(s => s.title === title && s.singer === singer);
    if (existingIndex !== -1) {
        history.splice(existingIndex, 1);
    }
    
    // 插入到最前面
    history.unshift({
        title: title,
        singer: singer,
        duration: duration
    });
    
    // 限制历史记录数量，比如最多 50 条
    if (history.length > 50) {
        history = history.slice(0, 50);
    }
    
    localStorage.setItem('yjay_played', JSON.stringify(history));

    const historyModal = document.getElementById('historyModal');
    if (!historyModal) return;
    
    const historyIframe = historyModal.querySelector('iframe');
    if (historyIframe && historyIframe.contentWindow && typeof historyIframe.contentWindow.addHistoryFromExternal === 'function') {
        historyIframe.contentWindow.addHistoryFromExternal({
            title: title,
            singer: singer,
            duration: duration
        });
    }
};

/**
 * =============================================================================
 * 模块：添加到歌单
 * 功能：点击添加按钮，将歌曲添加到 musicnav 弹窗中
 * =============================================================================
 */
window.addSongToList = function(title, singer, duration) {
    const musiclistIframe = document.querySelector('#playlistModal iframe');
    const songData = {
        title: title,
        singer: singer,
        duration: duration
    };

    // 无论 iframe 是否就绪，都先更新 localStorage 以确保持久化
    const saved = localStorage.getItem('yjay_playlist');
    let playlist = saved ? JSON.parse(saved) : [];
    
    // 检查是否已存在
    const existingIndex = playlist.findIndex(s => s.title === title && s.singer === singer);
    const isAlreadyInList = existingIndex !== -1;
    if (isAlreadyInList) {
        // 如果已存在，先移除旧的
        playlist.splice(existingIndex, 1);
    }
    
    // 始终插入到第二位（索引为 1），即正在播放歌曲的下面
    // 如果列表为空，则直接插入到第一位
    if (playlist.length === 0) {
        playlist.push(songData);
    } else {
        playlist.splice(1, 0, songData);
    }
    
    localStorage.setItem('yjay_playlist', JSON.stringify(playlist));
    
    if (typeof showPlayerToast === 'function') {
        if (isAlreadyInList) {
            showPlayerToast('歌单中已存在该歌曲');
        } else {
            showPlayerToast(`已将 ${title} 添加到播放列表`);
        }
    }

    // 如果 iframe 已就绪，通知它更新 UI (使用无动画模式防止闪烁)
    if (musiclistIframe && musiclistIframe.contentWindow && typeof musiclistIframe.contentWindow.loadFromLocalStorage === 'function') {
        musiclistIframe.contentWindow.loadFromLocalStorage(true);
    }
};

/**
 * =============================================================================
 * 模块：音乐详情弹窗
 * =============================================================================
 */
const detailPopup = document.createElement('div');
detailPopup.className = 'music-detail-popup';
document.body.appendChild(detailPopup);

function updatePopupPosition(musicItem) {
    const itemRect = musicItem.getBoundingClientRect();
    let leftPos = itemRect.right + 10;
    let topPos = itemRect.top + (itemRect.height / 2) - (detailPopup.offsetHeight / 2);
    
    leftPos += window.scrollX;
    topPos += window.scrollY;
    
    const popupWidth = detailPopup.offsetWidth || 100;
    if (leftPos + popupWidth > window.innerWidth + window.scrollX) {
        leftPos = itemRect.left - popupWidth - 10;
    }
    
    const popupHeight = detailPopup.offsetHeight || 30;
    if (topPos < window.scrollY) {
        topPos = window.scrollY;
    } else if (topPos + popupHeight > window.scrollY + window.innerHeight) {
        topPos = window.scrollY + window.innerHeight - popupHeight;
    }
    
    detailPopup.style.left = `${leftPos}px`;
    detailPopup.style.top = `${topPos}px`;
}

document.querySelectorAll('.music-title').forEach(titleEl => {
    titleEl.addEventListener('mouseenter', (e) => {
        const musicItem = e.target.closest('.music-item');
        if (!musicItem) return;
        const duration = musicItem.dataset.duration;
        const size = musicItem.dataset.size;
        detailPopup.innerHTML = `时长: ${duration} / 大小: ${size}`;
        detailPopup.style.display = 'block';
        updatePopupPosition(musicItem);
        musicItem.setAttribute('data-active-popup', 'true');
    });

    titleEl.addEventListener('mouseleave', (e) => {
        detailPopup.style.display = 'none';
        const musicItem = e.target.closest('.music-item');
        if (musicItem) {
            musicItem.removeAttribute('data-active-popup');
        }
    });
});

/**
 * =============================================================================
 * 模块：节流函数
 * =============================================================================
 */
function throttle(func, limit) {
    let inThrottle;
    let pendingCall = null;
    return function() {
        const context = this;
        const args = arguments;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            pendingCall = null;
            setTimeout(function() {
                inThrottle = false;
                // 尾随执行：节流窗口内最后一次调用的参数
                if (pendingCall) {
                    func.apply(pendingCall.context, pendingCall.args);
                    pendingCall = null;
                }
            }, limit);
        } else {
            // 记录最后一次调用
            pendingCall = { context: context, args: args };
        }
    }
}

/** 尾随 debounce：滚动停止后确保最后一次位置被捕获 */
function debounce(func, delay) {
    let timer;
    return function() {
        const context = this;
        const args = arguments;
        if (timer) clearTimeout(timer);
        timer = setTimeout(function() {
            timer = null;
            func.apply(context, args);
        }, delay);
    }
}

const throttledUpdatePopup = throttle(() => {
    const activeMusicItem = document.querySelector('[data-active-popup="true"]');
    if (activeMusicItem && detailPopup.style.display === 'block') {
        updatePopupPosition(activeMusicItem);
    }
}, 16);

window.addEventListener('scroll', throttledUpdatePopup, { passive: true });
window.addEventListener('resize', throttledUpdatePopup, { passive: true });

/**
 * =============================================================================
 * 模块：收藏交互
 * =============================================================================
 */
window.toggleFavorite = function(isAdding, data, skipRefresh = false) {
    const currentUser = getCurrentUserRecord();
    if (!currentUser || !currentUser.id) return;

    const apiCall = isAdding
        ? apiRequest('/favorites', {
            method: 'POST',
            body: JSON.stringify({ userId: currentUser.id, title: data.title, singer: data.singer, duration: data.duration || '00:00' })
          })
        : apiRequest('/favorites', {
            method: 'DELETE',
            body: JSON.stringify({ userId: currentUser.id, title: data.title, singer: data.singer })
          });

    apiCall.then(() => {
        // 同步 localStorage 缓存
        const saved = localStorage.getItem('yjay_favorites');
        let favorites = saved ? JSON.parse(saved) : [];
        if (isAdding) {
            const exists = favorites.some(f => f.title === data.title && f.singer === data.singer);
            if (!exists) {
                favorites.unshift({ title: data.title, singer: data.singer, duration: data.duration || '00:00' });
            }
        } else {
            favorites = favorites.filter(f => !(f.title === data.title && f.singer === data.singer));
        }
        localStorage.setItem('yjay_favorites', JSON.stringify(favorites));

        if (!skipRefresh) {
            const likelistIframe = document.querySelector('#favoritesModal iframe');
            if (likelistIframe && likelistIframe.contentWindow && typeof likelistIframe.contentWindow.loadFromLocalStorage === 'function') {
                likelistIframe.contentWindow.loadFromLocalStorage(true);
            }
        }
        const musiclistIframe = document.querySelector('#playlistModal iframe');
        if (musiclistIframe && musiclistIframe.contentWindow && typeof musiclistIframe.contentWindow.initHeartStatus === 'function') {
            musiclistIframe.contentWindow.initHeartStatus();
        }
        const playerSongTitle = document.getElementById('playerSongTitle');
        if (playerSongTitle) {
            const fullTitle = playerSongTitle.textContent.trim();
            const parts = fullTitle.split(' - ');
            const currentTitle = parts[0] || '';
            const currentSinger = parts[1] || '';
            if (currentTitle === data.title && currentSinger === data.singer) {
                const heartIconBtn = document.getElementById('playerHeartIcon');
                if (heartIconBtn) {
                    if (isAdding) heartIconBtn.classList.add('active');
                    else heartIconBtn.classList.remove('active');
                }
            }
        }
        const singerIframe = document.querySelector('#singerModal iframe');
        if (singerIframe && singerIframe.contentWindow && typeof singerIframe.contentWindow.initHeartStatus === 'function') {
            singerIframe.contentWindow.initHeartStatus();
        }
    }).catch(() => {
        // 后端不可用时降级到 localStorage
        const saved = localStorage.getItem('yjay_favorites');
        let favorites = saved ? JSON.parse(saved) : [];
        if (isAdding) {
            const exists = favorites.some(f => f.title === data.title && f.singer === data.singer);
            if (!exists) favorites.unshift({ title: data.title, singer: data.singer, duration: data.duration || '00:00' });
        } else {
            favorites = favorites.filter(f => !(f.title === data.title && f.singer === data.singer));
        }
        localStorage.setItem('yjay_favorites', JSON.stringify(favorites));
    });
};

/**
 * =============================================================================
 * 模块：推荐区域轮播交互
 * =============================================================================
 */
const carouselList = document.getElementById('carouselList');
const leftArrow = document.getElementById('leftArrow');
const rightArrow = document.getElementById('rightArrow');

if (carouselList && rightArrow) {
    const cards = carouselList.querySelectorAll('.recommendation-card');
    const firstCardWidth = 300;
    const otherCardWidth = 172;
    const gap = 12;
    
    let currentIndex = 0;
    const maxIndex = 2;

    function updateCarousel() {
        let offset = 0;
        if (currentIndex === 0) {
            offset = 0;
        } else {
            offset = firstCardWidth + gap + (currentIndex - 1) * (otherCardWidth + gap);
        }
        
        const containerWidth = carouselList.parentElement.offsetWidth;
        const totalWidth = firstCardWidth + (cards.length - 1) * (otherCardWidth + gap);
        const maxOffset = Math.max(0, totalWidth - containerWidth);
        
        carouselList.style.transform = `translateX(-${Math.min(offset, maxOffset)}px)`;
        
        if (leftArrow) leftArrow.style.display = 'flex';
        rightArrow.style.display = 'flex';
    }

    rightArrow.addEventListener('click', () => {
        if (window.isModalOpen || document.body.classList.contains('modal-open')) return;
        if (currentIndex < maxIndex) currentIndex++;
        else currentIndex = 0;
        updateCarousel();
    });

    if (leftArrow) {
        leftArrow.addEventListener('click', () => {
            if (window.isModalOpen || document.body.classList.contains('modal-open')) return;
            if (currentIndex > 0) currentIndex--;
            else currentIndex = maxIndex;
            updateCarousel();
        });
    }

    updateCarousel();
}

/**
 * =============================================================================
 * 模块：无缝自动滚动与交互
 * =============================================================================
 */
const scrollContainer = document.getElementById('relaxScroll');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

if (scrollContainer) {
    const originalContent = scrollContainer.innerHTML;
    scrollContainer.innerHTML += originalContent;

    let autoScrollId;
    let isHovered = false;
    let isDragging = false;
    let startX, scrollLeft;
    const scrollSpeed = 0.85; 
    let currentScrollPos = scrollContainer.scrollLeft;
    let lastTime = performance.now();
    let isVisible = true; 
    let speedMultiplier = 1; 
    let targetSpeedMultiplier = 1; 
    let halfWidth = scrollContainer.scrollWidth / 2;

    window.addEventListener('resize', throttle(() => {
        halfWidth = scrollContainer.scrollWidth / 2;
    }, 100));

    window.addEventListener('load', () => {
        halfWidth = scrollContainer.scrollWidth / 2;
    });

    const observer = new IntersectionObserver((entries) => {
        const wasVisible = isVisible;
        isVisible = entries[0].isIntersecting && document.visibilityState === 'visible';
        
        if (!wasVisible && isVisible && !autoScrollId) {
            lastTime = performance.now();
            autoScrollId = requestAnimationFrame(step);
        }
    }, { threshold: 0.1 });
    observer.observe(scrollContainer);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            isVisible = false;
        } else {
            isVisible = true;
            if (!autoScrollId) {
                lastTime = performance.now();
                autoScrollId = requestAnimationFrame(step);
            }
        }
    });

    const step = (currentTime) => {
        if (!isVisible || document.visibilityState === 'hidden') {
            autoScrollId = null;
            return;
        }

        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        if (!isHovered && !isDragging && !window.isModalOpen && !document.body.classList.contains('modal-open')) {
            if (speedMultiplier < targetSpeedMultiplier) {
                speedMultiplier += 0.1;
                if (speedMultiplier > targetSpeedMultiplier) speedMultiplier = targetSpeedMultiplier;
            } else if (speedMultiplier > targetSpeedMultiplier) {
                speedMultiplier -= 0.05;
                if (speedMultiplier < targetSpeedMultiplier) speedMultiplier = targetSpeedMultiplier;
            }
            
            const adjustedSpeed = Math.min(scrollSpeed * (deltaTime / 16.67) * speedMultiplier, scrollSpeed * 20);
            currentScrollPos += adjustedSpeed;
            
            if (currentScrollPos >= halfWidth) {
                currentScrollPos -= halfWidth;
            } else if (currentScrollPos <= 0) {
                currentScrollPos += halfWidth;
            }
            
            scrollContainer.scrollLeft = currentScrollPos;
        } else {
            currentScrollPos = scrollContainer.scrollLeft;
            if (!isDragging) speedMultiplier = 0; 
        }
        autoScrollId = requestAnimationFrame(step);
    };

    const startAutoScroll = () => { isHovered = false; };
    const stopAutoScroll = () => { isHovered = true; };

    autoScrollId = requestAnimationFrame(step);

    scrollContainer.addEventListener('mouseenter', stopAutoScroll);
    scrollContainer.addEventListener('mouseleave', startAutoScroll);

    scrollContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        scrollContainer.style.cursor = 'grabbing';
        scrollContainer.style.userSelect = 'none';
        startX = e.pageX - scrollContainer.offsetLeft;
        scrollLeft = scrollContainer.scrollLeft;
        cancelAnimationFrame(autoScrollId);
    });

    window.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        scrollContainer.style.cursor = 'default';
        scrollContainer.style.userSelect = 'auto';
        autoScrollId = requestAnimationFrame(step);
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollContainer.offsetLeft;
        const walk = (x - startX) * 1.5;
        scrollContainer.scrollLeft = scrollLeft - walk;

        const halfWidth = scrollContainer.scrollWidth / 2;
        if (scrollContainer.scrollLeft >= halfWidth) {
            scrollContainer.scrollLeft -= halfWidth;
            startX = x;
            scrollLeft = scrollContainer.scrollLeft;
        } else if (scrollContainer.scrollLeft <= 0) {
            scrollContainer.scrollLeft += halfWidth;
            startX = x;
            scrollLeft = scrollContainer.scrollLeft;
        }
    });

    let accelTimer;
    const handleAcceleration = (direction) => {
        targetSpeedMultiplier = direction === 'right' ? 15 : -15;
        isHovered = false; 

        clearTimeout(accelTimer);
        accelTimer = setTimeout(() => {
            targetSpeedMultiplier = 1;
        }, 1000);
    };

    if (leftBtn) leftBtn.addEventListener('click', () => handleAcceleration('left'));
    if (rightBtn) rightBtn.addEventListener('click', () => handleAcceleration('right'));
}

/**
 * =============================================================================
 * 模块：歌手列表筛选与交互
 * =============================================================================
 */
const singerListContainer = document.getElementById('extended-singer-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const filterIndicator = document.querySelector('.filter-indicator');
const filterBar = document.querySelector('.filter-bar');

// 获取当前歌手列表元素
function getSingerItems() {
    return document.querySelectorAll('#extended-singer-list .singer-item');
}

// 应用筛选
function applySingerFilter(type) {
    var singerItems = getSingerItems();
    var emptyTip = singerListContainer ? singerListContainer.querySelector('.empty-tip') : null;

    singerItems.forEach(function(item) {
        var gender = item.getAttribute('data-gender');
        var shouldShow = (type === 'all') || (gender === type);

        if (shouldShow) {
            item.style.display = 'block';
            item.classList.add('active');
        } else {
            item.style.display = 'none';
            item.classList.remove('active');
        }
    });

    if (emptyTip) {
        var visibleCount = 0;
        singerItems.forEach(function(item) {
            if (item.style.display !== 'none') visibleCount++;
        });
        emptyTip.style.display = (visibleCount === 0) ? 'block' : 'none';
    }
}

// 歌手点击 → 打开详情弹窗（事件委托）
if (singerListContainer) {
    singerListContainer.addEventListener('click', function(e) {
        var item = e.target.closest('.singer-item');
        if (!item) return;
        var singerName = item.getAttribute('data-singer-name');
        var avatarSrc = item.getAttribute('data-singer-img');
        if (!singerName) return;

        var singerModal = document.getElementById('singerModal');
        if (singerModal) {
            if (typeof window.closeAllSideModals === 'function') {
                window.closeAllSideModals(singerModal);
            }
            var iframe = singerModal.querySelector('iframe');
            if (iframe) {
                var params = new URLSearchParams();
                params.set('singer', singerName);
                if (avatarSrc) {
                    var fixedSrc = avatarSrc;
                    if (fixedSrc.indexOf('./') === 0) {
                        fixedSrc = '..' + fixedSrc.substring(1);
                    }
                    params.set('img', fixedSrc);
                }
                iframe.src = 'html/artistpage.html?' + params.toString();
            }
            singerModal.style.display = 'flex';
            setTimeout(function() { singerModal.classList.add('show'); }, 10);
            toggleBodyScroll(true);
        }
    });
}

// 筛选栏滑动指示器
function updateFilterIndicator(targetBtn) {
    if (filterIndicator && targetBtn) {
        filterIndicator.style.left = targetBtn.offsetLeft + 'px';
        filterIndicator.style.width = targetBtn.offsetWidth + 'px';
    }
}

// 初始化指示器
setTimeout(function() {
    updateFilterIndicator(document.querySelector('.filter-btn.active'));
}, 50);

// 筛选按钮事件
filterBtns.forEach(function(btn) {
    btn.addEventListener('mouseenter', function() {
        updateFilterIndicator(this);
    });
    btn.addEventListener('click', function() {
        if (this.classList.contains('active')) return;
        filterBtns.forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        updateFilterIndicator(this);
        applySingerFilter(this.getAttribute('data-type'));
    });
});

// 鼠标离开筛选栏时，指示器回到当前激活按钮
if (filterBar) {
    filterBar.addEventListener('mouseleave', function() {
        updateFilterIndicator(document.querySelector('.filter-btn.active'));
    });
}

// HTML 转义（全局）
function escHtml(s) {
    s = s || '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// 从数据库加载歌手数据渲染列表
(function loadSingersFromDB() {
    if (!singerListContainer) return;

    function tryFetch(url, fallback) {
        return fetch(url).then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        }).catch(function() {
            if (fallback) return tryFetch(fallback, null);
            throw new Error('failed');
        });
    }

    // 歌手主页分页
    var singerPageAll = [];
    var singerPageCurrent = 1;
    var singerPageSize = 12;

    function renderSingerPage() {
        var total = Math.ceil(singerPageAll.length / singerPageSize);
        var start = (singerPageCurrent - 1) * singerPageSize;
        var pageData = singerPageAll.slice(start, start + singerPageSize);

        var html = '';
        pageData.forEach(function(s, i) {
            var name = s.name || '';
            var gender = s.gender || 'male';
            var imgPath = s.image_path || '';
            if (!imgPath) imgPath = './歌手/周杰伦.png';
            if (imgPath.indexOf('../') === 0) imgPath = '.' + imgPath.substring(2);
            var delay = ((i % 4) + 1) * 100;
            html += '<div class="singer-item reveal active delay-' + delay + '" data-gender="' + gender + '" data-singer-name="' + escHtml(name) + '" data-singer-img="' + imgPath + '">';
            html += '<img src="' + imgPath + '" alt="' + escHtml(name) + '" class="singer-avatar" loading="lazy">';
            html += '<p class="singer-name">' + escHtml(name) + '</p>';
            html += '</div>';
        });
        html += '<div class="empty-tip" style="display:none;">暂无匹配歌手</div>';
        singerListContainer.innerHTML = html;

        var pagDiv = document.getElementById('singerPagePag');
        var prevBtn = document.getElementById('singerPagePrev');
        var nextBtn = document.getElementById('singerPageNext');
        var info = document.getElementById('singerPageInfo');
        if (pagDiv) {
            pagDiv.style.display = total > 1 ? 'flex' : 'none';
            if (prevBtn) prevBtn.disabled = singerPageCurrent <= 1;
            if (nextBtn) nextBtn.disabled = singerPageCurrent >= total;
            if (info) info.textContent = '第 ' + singerPageCurrent + ' 页 / 共 ' + total + ' 页';
            var indicator = document.getElementById('singerPagePagIndicator');
            var pagFirstOpen = !indicator._initDone;
            if (!indicator._initDone) {
                indicator._initDone = true;
            }
            setTimeout(function() {
                var t = _singerPageActiveBtn && !_singerPageActiveBtn.disabled ? _singerPageActiveBtn : (prevBtn && !prevBtn.disabled ? prevBtn : (nextBtn && !nextBtn.disabled ? nextBtn : null));
                if (t) {
                    if (pagFirstOpen) {
                        indicator.style.transition = 'none';
                        indicator.style.left = t.offsetLeft + 'px';
                        indicator.style.width = t.offsetWidth + 'px';
                        requestAnimationFrame(function() { requestAnimationFrame(function() { indicator.style.transition = ''; }); });
                    } else {
                        indicator.style.left = t.offsetLeft + 'px';
                        indicator.style.width = t.offsetWidth + 'px';
                    }
                    _singerPageActiveBtn = t;
                }
            }, 80);
        }
    }

    var _singerPageActiveBtn = null;
    function bindSingerPageEvents() {
        var prevBtn = document.getElementById('singerPagePrev');
        var nextBtn = document.getElementById('singerPageNext');
        var indicator = document.getElementById('singerPagePagIndicator');
        function upd(t) { if (indicator && t && !t.disabled) { indicator.style.left = t.offsetLeft + 'px'; indicator.style.width = t.offsetWidth + 'px'; } }
        if (prevBtn) { prevBtn.onclick = function() { if (singerPageCurrent > 1) { singerPageCurrent--; _singerPageActiveBtn = this; renderSingerPage(); } }; prevBtn.addEventListener('mouseenter', function() { if (!this.disabled) upd(this); }); }
        if (nextBtn) { nextBtn.onclick = function() { var t = Math.ceil(singerPageAll.length / singerPageSize); if (singerPageCurrent < t) { singerPageCurrent++; _singerPageActiveBtn = this; renderSingerPage(); } }; nextBtn.addEventListener('mouseenter', function() { if (!this.disabled) upd(this); }); }
        var pagDiv = document.getElementById('singerPagePag');
        if (pagDiv) { pagDiv.addEventListener('mouseleave', function() { var t = _singerPageActiveBtn && !_singerPageActiveBtn.disabled ? _singerPageActiveBtn : (prevBtn && !prevBtn.disabled ? prevBtn : (nextBtn && !nextBtn.disabled ? nextBtn : null)); upd(t); }); }
    }

    function renderDB(singers) {
        if (!Array.isArray(singers) || singers.length === 0) {
            singerListContainer.innerHTML = '<div class="empty-tip">暂无歌手数据</div>';
            document.getElementById('singerPagePag').style.display = 'none';
            return;
        }
        singerPageAll = singers;
        singerPageCurrent = 1;
        renderSingerPage();
        bindSingerPageEvents();
    }

    tryFetch('/singers', '/api/singers')
        .then(renderDB)
        .catch(function() {
            singerListContainer.innerHTML = '<div class="empty-tip">加载失败，请检查后端服务是否启动</div>';
        });
})();
function initAlbumTableIndicator() {
    var indicator = document.getElementById('albumTableIndicator');
    var tableWrap = document.getElementById('albumTableWrap');
    var thead = tableWrap ? tableWrap.querySelector('thead') : null;
    if (!indicator || !tableWrap || !thead) return;

    // 行 hover
    tableWrap.querySelectorAll('tbody .song-row').forEach(function(row) {
        row.addEventListener('mouseenter', function() {
            var wrapRect = tableWrap.getBoundingClientRect();
            var rowRect = this.getBoundingClientRect();
            indicator.style.opacity = '1';
            indicator.style.top = (rowRect.top - wrapRect.top) + 'px';
            indicator.style.height = rowRect.height + 'px';
        });
    });

    // 离开 → 回到表头
    tableWrap.addEventListener('mouseleave', function() {
        var wrapRect = tableWrap.getBoundingClientRect();
        var headRect = thead.getBoundingClientRect();
        indicator.style.top = (headRect.top - wrapRect.top) + 'px';
        indicator.style.height = headRect.height + 'px';
    });

    // 默认停在表头
    function positionAtThead() {
        var wrapRect = tableWrap.getBoundingClientRect();
        var headRect = thead.getBoundingClientRect();
        if (headRect.height > 0) {
            indicator.style.transition = 'none';
            indicator.style.top = (headRect.top - wrapRect.top) + 'px';
            indicator.style.height = headRect.height + 'px';
            indicator.style.opacity = '1';
            requestAnimationFrame(function() {
                requestAnimationFrame(function() { indicator.style.transition = ''; });
            });
        } else {
            setTimeout(positionAtThead, 100);
        }
    }
    setTimeout(positionAtThead, 150);
}

// ======================== 专辑编辑弹窗 ========================
var albumEditAll = [], albumEditPage = 1, albumEditPageSize = 5;

function openAlbumEditor() {
    var modal = document.getElementById('albumEditModal');
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(function() { modal.classList.add('show'); }, 10);
    toggleBodyScroll(true);
    loadAlbumEditList();
}
function closeAlbumEditor() {
    var modal = document.getElementById('albumEditModal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(function() { modal.style.display = 'none'; }, 300);
    toggleBodyScroll(false);
}
function loadAlbumEditList() {
    var tbody = document.getElementById('albumEditBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.4);padding:40px;">加载中...</td></tr>';
    fetch('/api/albums').then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .catch(function() { return fetch('/albums').then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); })
        .then(function(albums) {
            albumEditAll = Array.isArray(albums) ? albums : [];
            // 首次初始化：如果没有选中任何专辑，默认选前5个
            var shownIds = JSON.parse(localStorage.getItem('shownAlbumIds') || '[]');
            if (shownIds.length === 0 && albumEditAll.length > 0) {
                shownIds = albumEditAll.slice(0, 5).map(function(a) { return a.id; });
                localStorage.setItem('shownAlbumIds', JSON.stringify(shownIds));
            }
            albumEditPage = 1;
            renderAlbumEditPage();
        }).catch(function() { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.4);padding:40px;">加载失败</td></tr>'; });
}
function renderAlbumEditPage() {
    var tbody = document.getElementById('albumEditBody');
    // 只展示用户选中的专辑（albumEditAll 保持全量，供修改下拉使用）
    var shownIds = JSON.parse(localStorage.getItem('shownAlbumIds') || '[]');
    var shownAlbums = albumEditAll.filter(function(a) { return shownIds.indexOf(a.id) !== -1; });
    var total = Math.ceil(shownAlbums.length / albumEditPageSize);
    var start = (albumEditPage - 1) * albumEditPageSize;
    var page = shownAlbums.slice(start, start + albumEditPageSize);
    var html = '';
    if (page.length === 0) {
        html = '<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.4);padding:40px;">未选择展示专辑</td></tr>';
    } else {
        page.forEach(function(a,i) {
            var img = a.albumImagePath || a.album_image_path || '';
            if (img && img.indexOf('../') === 0) img = '.' + img.substring(2);
            html += '<tr class="song-row"><td style="text-align:center;padding:0;"><img src="' + img + '" style="width:38px;height:38px;border-radius:6px;object-fit:cover;" onerror="this.style.display=\'none\'"></td>';
            html += '<td style="text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><span class="song-name">' + escHtml(a.albumName||a.album_name||'') + '</span></td>';
            html += '<td style="width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escHtml(a.singerName||a.singer_name||'') + '</td>';
            html += '<td style="width:50px;">¥' + (a.price||'0') + '</td>';
            html += '<td style="text-align:center;"><button style="color:#fff;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.08);backdrop-filter:blur(8px);padding:5px 14px;font-size:13px;border-radius:20px;cursor:pointer;" onclick="editAlbumRow(' + a.id + ')">修改</button></td></tr>';
        });
    }
    tbody.innerHTML = html;
    var pagDiv = document.getElementById('albumEditPag'), prev = document.getElementById('albumEditPrev'), next = document.getElementById('albumEditNext');
    if (pagDiv) { pagDiv.style.display = total > 1 ? 'flex' : 'none'; if (prev) prev.disabled = albumEditPage <= 1; if (next) next.disabled = albumEditPage >= total; document.getElementById('albumEditPageInfo').textContent = '第 ' + albumEditPage + ' 页 / 共 ' + total + ' 页'; initAlbumPagIndicator(); }
    initAlbumTableIndicator();
}
function editAlbumRow(id) {
    var row = event.target.closest('tr');
    if (!row) return;
    var names = [];
    albumEditAll.forEach(function(a) { var n = a.albumName||a.album_name||''; if (n && names.indexOf(n)===-1) names.push(n); });
    var optsHtml = names.map(function(v) { return '<div class="edit-album-opt" data-val="' + escHtml(v) + '" style="padding:8px 14px;color:#fff;font-size:13px;cursor:pointer;border-radius:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" onmouseover="this.style.background=\'rgba(255,255,255,0.12)\'" onmouseout="this.style.background=\'transparent\'" onclick="event.stopPropagation();document.getElementById(\'editNameBtn\').textContent=this.getAttribute(\'data-val\');document.getElementById(\'editNameVal\').value=this.getAttribute(\'data-val\');document.getElementById(\'editNameDropdown\').style.display=\'none\';autoFillAlbumRow();">' + escHtml(v) + '</div>'; }).join('');

    // 临时放开表格 overflow，让下拉不被裁掉
    var tableWrap = row.closest('.table-wrap');
    if (tableWrap) { tableWrap.style.overflow = 'visible'; }
    var tds = row.querySelectorAll('td');
    tds[0].innerHTML = '<img id="editThumb" src="" style="width:38px;height:38px;border-radius:6px;object-fit:cover;margin:0 auto;display:block;" onerror="this.style.display=\'none\'"><input type="hidden" id="editImgOld" value="">';
    tds[1].setAttribute('colspan', '3');
    tds[1].style.textAlign = 'left';
    tds[1].style.overflow = 'visible';
    tds[1].innerHTML = '<div style="display:flex;align-items:center;gap:6px;">' +
        '<div style="position:relative;width:230px;overflow:visible;">' +
            '<button id="editNameBtn" type="button" style="width:100%;padding:6px 30px 6px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.06);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#fff;font-size:13px;text-align:left;cursor:pointer;outline:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" onclick="event.stopPropagation();var d=document.getElementById(\'editNameDropdown\');d.style.display=d.style.display===\'block\'?\'none\':\'block\';">选择专辑</button>' +
            '<i class="fa-solid fa-chevron-down" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.4);font-size:9px;pointer-events:none;"></i>' +
            '<div id="editNameDropdown" style="display:none;position:absolute;top:100%;left:0;right:0;margin-top:4px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(30,30,30,0.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 8px 32px rgba(0,0,0,0.4);z-index:9999;max-height:200px;overflow-y:auto;padding:4px;">' + optsHtml + '</div>' +
        '</div>' +
        '<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px;"><span id="autoSinger" style="color:rgba(255,255,255,0.4);font-size:13px;"></span></span>' +
        '<span id="autoPrice" style="color:#e4393c;font-size:14px;font-weight:600;white-space:nowrap;min-width:40px;"></span>' +
        '</div><input type="hidden" id="editNameVal" value="">';
    if (tds[2]) tds[2].style.display = 'none';
    if (tds[3]) tds[3].style.display = 'none';
    tds[4].innerHTML = '<div style="display:flex;gap:4px;justify-content:center;">' +
        '<button style="color:#fff;border:1px solid rgba(228,57,60,0.4);background:rgba(228,57,60,0.2);backdrop-filter:blur(10px);padding:4px 10px;font-size:12px;border-radius:16px;cursor:pointer;" onclick="saveAlbumRow(' + id + ')">保存</button>' +
        '<button style="color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.08);backdrop-filter:blur(8px);padding:4px 10px;font-size:12px;border-radius:16px;cursor:pointer;" onclick="var tw=document.getElementById(\'albumTableWrap\');if(tw)tw.style.overflow=\'\';loadAlbumEditList()">取消</button>' +
        '</div>';
    row.setAttribute('data-edit-id', id);
    setTimeout(function() {
        document.addEventListener('click', function closeDropdown(e) {
            var btn = document.getElementById('editNameBtn');
            var dd = document.getElementById('editNameDropdown');
            if (!btn || !dd) { document.removeEventListener('click', closeDropdown); return; }
            if (!btn.contains(e.target) && !dd.contains(e.target)) { dd.style.display = 'none'; }
        });
    }, 50);
}
function autoFillAlbumRow() {
    var nameEl = document.getElementById('editNameVal');
    if (!nameEl) return;
    var name = nameEl.value;
    var found = null;
    for (var i = 0; i < albumEditAll.length; i++) {
        var a = albumEditAll[i];
        if ((a.albumName||a.album_name||'') === name) { found = a; break; }
    }
    var singerEl = document.getElementById('autoSinger'), priceEl = document.getElementById('autoPrice'), imgOld = document.getElementById('editImgOld');
    if (found) {
        if (singerEl) { singerEl.textContent = found.singerName||found.singer_name||''; singerEl.style.color = '#fff'; }
        if (priceEl) { priceEl.textContent = '¥' + (found.price||'0'); priceEl.style.color = '#fff'; }
        var path = found.albumImagePath||found.album_image_path||'';
        if (imgOld) imgOld.value = path;
        var thumb = document.getElementById('editThumb');
        if (thumb && path) { var src = path.indexOf('../')===0 ? '.' + path.substring(2) : path; thumb.src = src; thumb.style.display = ''; }
    } else {
        if (singerEl) { singerEl.textContent = '—'; singerEl.style.color = 'rgba(255,255,255,0.5)'; }
        if (priceEl) { priceEl.textContent = '—'; priceEl.style.color = 'rgba(255,255,255,0.5)'; }
        if (imgOld) imgOld.value = '';
    }
}
function saveAlbumRow(id) {
    var newName = document.getElementById('editNameVal')?.value?.trim() || '';
    if (!newName) { showPlayerToast('请选择专辑'); return; }
    var newAlbum = null;
    for (var i = 0; i < albumEditAll.length; i++) {
        if ((albumEditAll[i].albumName||albumEditAll[i].album_name||'') === newName) { newAlbum = albumEditAll[i]; break; }
    }
    if (!newAlbum) { showPlayerToast('未找到该专辑'); return; }
    // 只更新 shownAlbumIds，不修改数据库
    var shownIds = JSON.parse(localStorage.getItem('shownAlbumIds') || '[]');
    var idx = shownIds.indexOf(id);
    if (idx !== -1 && shownIds.indexOf(newAlbum.id) === -1) {
        shownIds[idx] = newAlbum.id;
    }
    localStorage.setItem('shownAlbumIds', JSON.stringify(shownIds));
    // 恢复表格 overflow
    var tw = document.getElementById('albumTableWrap');
    if (tw) tw.style.overflow = '';
    showPlayerToast('已切换为：' + newName);
    loadAlbumEditList();
    if (typeof loadAlbums === 'function') loadAlbums();
}
function resetBtnIndicator(group) {
    var indicator = group.querySelector('.btn-slide-indicator');
    if (!indicator) return;
    var defaultBtn = group.querySelector('[data-default="1"]');
    if (defaultBtn) {
        indicator.style.left = defaultBtn.offsetLeft + 'px';
        indicator.style.width = defaultBtn.offsetWidth + 'px';
    }
}
function moveBtnIndicator(btn) {
    var group = btn.parentElement;
    if (!group) return;
    var indicator = group.querySelector('.btn-slide-indicator');
    if (!indicator) return;
    indicator.style.left = btn.offsetLeft + 'px';
    indicator.style.width = btn.offsetWidth + 'px';
}
// 初始化：指示器默认停在编辑按钮
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        document.querySelectorAll('.btn-slide-indicator').forEach(function(ind) {
            var group = ind.parentElement;
            if (!group) return;
            var defaultBtn = group.querySelector('[data-default="1"]');
            if (defaultBtn) {
                ind.style.left = defaultBtn.offsetLeft + 'px';
                ind.style.width = defaultBtn.offsetWidth + 'px';
            }
        });
    }, 500);
});

function toggleAlbumShow(cb) {
    var id = parseInt(cb.getAttribute('data-id'));
    var ids = JSON.parse(localStorage.getItem('shownAlbumIds') || '[]');
    if (cb.checked) {
        if (ids.indexOf(id) === -1) {
            if (ids.length >= 5) { cb.checked = false; showPlayerToast('最多只能选择5个专辑显示在前端'); return; }
            ids.push(id);
        }
    } else {
        ids = ids.filter(function(v) { return v !== id; });
    }
    localStorage.setItem('shownAlbumIds', JSON.stringify(ids));
    if (typeof loadAlbums === 'function') loadAlbums();
    renderAlbumEditPage();
}

async function deleteAlbum(id) {
    if (!(await showConfirm('确定删除该专辑？'))) return;
    fetch('/api/albums/' + id, { method: 'DELETE' }).then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); })
        .catch(function() { return fetch('/albums/' + id, { method: 'DELETE' }).then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); }); })
        .then(function() { showPlayerToast('已删除'); loadAlbumEditList(); if (typeof loadAlbums === 'function') loadAlbums(); })
        .catch(function() { showPlayerToast('删除失败'); });
}
function addAlbumFromForm() {
    var name = document.getElementById('newAlbumName').value.trim(), singer = document.getElementById('newAlbumSinger').value.trim(), price = parseFloat(document.getElementById('newAlbumPrice').value)||0;
    var imageFile = document.getElementById('newAlbumImage').files[0];
    var img = imageFile ? '../专辑/' + imageFile.name : '';
    if (!name || !singer || !img) { showPlayerToast('请填写所有字段（包括选择图片）'); return; }
    fetch('/api/albums', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ albumName: name, singerName: singer, price: price, albumImagePath: img }) })
        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .catch(function() { return fetch('/albums', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ albumName: name, singerName: singer, price: price, albumImagePath: img }) }).then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); })
        .then(function() { showPlayerToast('专辑已添加（仅存入数据库）'); ['newAlbumName','newAlbumSinger','newAlbumPrice','newAlbumImage'].forEach(function(id) { document.getElementById(id).value = ''; }); document.getElementById('albumImagePreview').textContent = '未选择文件'; })
        .catch(function() { showPlayerToast('添加失败'); });
}
document.getElementById('closeAlbumEditBtn')?.addEventListener('click', closeAlbumEditor);
document.getElementById('albumEditModal')?.addEventListener('click', function(e) { if (e.target.id === 'albumEditModal') closeAlbumEditor(); });
document.getElementById('addAlbumBtn')?.addEventListener('click', addAlbumFromForm);
// 专辑图片文件选择预览
document.getElementById('newAlbumImage')?.addEventListener('change', function() {
    var preview = document.getElementById('albumImagePreview');
    if (preview) {
        preview.textContent = this.files[0] ? this.files[0].name : '未选择文件';
        preview.style.color = this.files[0] ? '#fff' : 'rgba(255,255,255,0.7)';
    }
});
var _albumPagActiveBtn = null;
function initAlbumPagIndicator() {
    var indicator = document.getElementById('albumEditPagIndicator');
    var pag = document.getElementById('albumEditPag');
    var prevBtn = document.getElementById('albumEditPrev');
    var nextBtn = document.getElementById('albumEditNext');
    if (!indicator || !pag) return;

    function upd(target) {
        if (!target || target.disabled) return;
        indicator.style.left = target.offsetLeft + 'px';
        indicator.style.width = target.offsetWidth + 'px';
    }

    // 只绑定一次
    if (!pag._pagInited) {
        pag._pagInited = true;
        pag.addEventListener('mouseover', function(e) {
            var btn = e.target.closest('.pagination-btn');
            if (btn && !btn.disabled) upd(btn);
        });
        pag.addEventListener('mouseleave', function() {
            var t = _albumPagActiveBtn && !_albumPagActiveBtn.disabled ? _albumPagActiveBtn : (prevBtn && !prevBtn.disabled ? prevBtn : (nextBtn && !nextBtn.disabled ? nextBtn : null));
            upd(t);
        });
    }

    setTimeout(function() {
        var t = _albumPagActiveBtn && !_albumPagActiveBtn.disabled ? _albumPagActiveBtn : (prevBtn && !prevBtn.disabled ? prevBtn : (nextBtn && !nextBtn.disabled ? nextBtn : null));
        if (t) {
            if (!indicator._hasShown) {
                indicator._hasShown = true;
                indicator.style.transition = 'none';
                upd(t);
                indicator.offsetHeight;
                indicator.style.transition = '';
            } else {
                upd(t);
            }
            _albumPagActiveBtn = t;
        }
    }, 100);
}

document.getElementById('albumEditPrev')?.addEventListener('click', function() { if (albumEditPage > 1) { albumEditPage--; _albumPagActiveBtn = this; renderAlbumEditPage(); } });
document.getElementById('albumEditNext')?.addEventListener('click', function() { if (albumEditPage < Math.ceil(albumEditAll.length/albumEditPageSize)) { albumEditPage++; _albumPagActiveBtn = this; renderAlbumEditPage(); } });


/**
 * =============================================================================
 * 模块：通用提示弹窗
 * =============================================================================
 */
function showAlert(message) {
    const alertModal = document.getElementById('alertModal');
    const alertMessage = document.getElementById('alertMessage');
    const confirmAlertBtn = document.getElementById('confirmAlertBtn');

    if (alertModal && alertMessage && confirmAlertBtn) {
        alertMessage.innerHTML = message;
        alertModal.style.display = 'flex';
        setTimeout(() => alertModal.classList.add('show'), 10);
        toggleBodyScroll(true);

        let closed = false;
        const closeAlert = () => {
            if (closed) return;
            closed = true;
            alertModal.classList.remove('show');
            setTimeout(() => alertModal.style.display = 'none', 300);
            toggleBodyScroll(false);
        };

        confirmAlertBtn.onclick = (e) => { e.stopPropagation(); closeAlert(); };
        alertModal.onclick = (e) => {
            if (e.target === alertModal) closeAlert();
        };
    } else {
        alert(message);
    }
}

function showConfirm(message) {
    return new Promise((resolve) => {
        const confirmModal = document.getElementById('confirmModal');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmOkBtn = document.getElementById('confirmOkBtn');
        const confirmCancelBtn = document.getElementById('confirmCancelBtn');

        if (confirmModal && confirmMessage && confirmOkBtn && confirmCancelBtn) {
            confirmMessage.textContent = message;
            confirmModal.style.display = 'flex';
            setTimeout(() => confirmModal.classList.add('show'), 10);
            toggleBodyScroll(true);

            let closed = false;
            const closeConfirm = (result) => {
                if (closed) return;
                closed = true;
                confirmModal.classList.remove('show');
                setTimeout(() => confirmModal.style.display = 'none', 300);
                toggleBodyScroll(false);
                resolve(result);
            };

            confirmOkBtn.onclick = (e) => { e.stopPropagation(); closeConfirm(true); };
            confirmCancelBtn.onclick = (e) => { e.stopPropagation(); closeConfirm(false); };
            confirmModal.onclick = (e) => {
                if (e.target === confirmModal) closeConfirm(false);
            };
        } else {
            resolve(confirm(message));
        }
    });
}

async function apiRequest(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    const headers = isFormData
        ? { ...(options.headers || {}) }  // FormData 让浏览器自动设置 Content-Type
        : {
            'Content-Type': 'application/json',
            ...(options.headers || {})
          };

    // 优先走 /api 代理路径，失败则回退到裸路径（生产模式直接访问后端）
    try {
        const response = await fetch(`/api${path}`, { ...options, headers });
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;
        if (!response.ok) throw new Error(data?.message || '请求失败');
        return data;
    } catch (e) {
        // /api 代理不通，回退到裸路径（生产模式后端直接暴露）
        const response = await fetch(path, { ...options, headers });
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;
        if (!response.ok) throw new Error(data?.message || '请求失败，请检查后端服务');
        return data;
    }
}

function normalizeApiUser(user) {
    if (!user) return null;
    return {
        ...user,
        role: (user.role || 'VISITOR').toLowerCase(),
        userStatus: user.userStatus || 'ACTIVE'
    };
}

function syncStoredUser(user) {
    const normalizedUser = normalizeApiUser(user);
    if (!normalizedUser) return null;

    const users = getStoredUsers();
    const index = users.findIndex(item => item.id === normalizedUser.id || item.account === normalizedUser.account);

    if (index >= 0) {
        users[index] = { ...users[index], ...normalizedUser };
    } else {
        users.push(normalizedUser);
    }

    saveStoredUsers(users);
    return normalizedUser;
}

function getStoredUsers() {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.map(user => ({
            ...user,
            role: (user.role || 'visitor').toLowerCase()
        }));
    } catch (error) {
        return [];
    }
}

function saveStoredUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getCurrentUserRecord() {
    const account = localStorage.getItem('currentUser');
    if (!account) return null;
    return getStoredUsers().find(user => user.account === account) || null;
}

function getRoleLabel(role) {
    return role === 'admin' ? '管理员' : '游客';
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[char]);
}

function getSavedList(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
        return [];
    }
}

function collectSavedContent() {
    return {
        playlist: getSavedList('yjay_playlist'),
        favorites: getSavedList('yjay_favorites'),
        history: getSavedList('yjay_played')
    };
}

function renderUserContentGrid() {
    const contentGrid = document.getElementById('adminContentGrid');
    if (!contentGrid) return;
    const savedContent = collectSavedContent();
    const buyer = localStorage.getItem('currentUser') || '匿名用户';

    // 封面映射
    var songCoverMap = {};
    var albumCoverMap = {};

    function loadCoverMaps(cb) {
        var done = 0;
        function check() { done++; if (done >= 2) cb(); }
        // 歌曲封面
        fetch('/api/music?size=200')
            .then(function(r) { return r.ok ? r.json() : []; })
            .catch(function() { return fetch('/music?size=200').then(function(r) { return r.ok ? r.json() : []; }).catch(function() { return []; }); })
            .then(function(songs) {
                var arr = Array.isArray(songs) ? songs : (songs.records || []);
                arr.forEach(function(s) {
                    var name = s.musicName || s.music_name || '';
                    var img = s.imagePath || s.image_path || '';
                    if (img && img.indexOf('../') === 0) img = '.' + img.substring(2);
                    if (img && img.indexOf('./') !== 0 && img.indexOf('/') === 0) img = '.' + img;
                    if (name && img) songCoverMap[name] = img;
                });
                check();
            });
        // 专辑封面
        fetch('/api/albums')
            .then(function(r) { return r.ok ? r.json() : []; })
            .catch(function() { return fetch('/albums').then(function(r) { return r.ok ? r.json() : []; }).catch(function() { return []; }); })
            .then(function(albums) {
                if (Array.isArray(albums)) albums.forEach(function(a) {
                    var name = a.albumName || a.album_name || '';
                    var img = a.albumImagePath || a.album_image_path || '';
                    if (img && img.indexOf('../') === 0) img = '.' + img.substring(2);
                    if (name && img) albumCoverMap[name] = img;
                });
                check();
            });
    }

    function itemHtml(item, isAlbum) {
        var title = isAlbum ? (item.albumName || item.album_name || item.title || '') : (item.title || '');
        var sub = isAlbum ? (item.singerName || item.singer_name || '') : (item.singer || '');
        var thumb = isAlbum ? (albumCoverMap[title] || '') : (songCoverMap[title] || '');
        var qty = item.quantity > 1 ? ' ×' + item.quantity : '';
        var iconHtml = thumb
            ? '<img src="' + thumb + '" class="card-item-thumb">'
            : '<div class="card-item-thumb" style="display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);font-size:14px;">' + (isAlbum ? '💿' : '🎵') + '</div>';
        return '<div class="card-item">' + iconHtml +
            '<div class="card-item-info">' +
            '<div class="card-item-title">' + escapeHTML(title) + qty + '</div>' +
            (sub ? '<div class="card-item-sub">' + escapeHTML(sub) + '</div>' : '') +
            '</div></div>';
    }

    var groups = [
        { title: '我的收藏', html: '<div class="card-item"><div class="card-item-info"><div class="card-item-sub">加载中...</div></div></div>', count: 0 },
        { title: '已购专辑', html: '<div class="card-item"><div class="card-item-info"><div class="card-item-sub">加载中...</div></div></div>', count: 0 }
    ];

    function renderGroups() {
        contentGrid.innerHTML = groups.map(function(g) {
            return '<div class="admin-content-card"><h4>' + g.title + '</h4><p>共 ' + g.count + ' 条</p>' + g.html + '</div>';
        }).join('');
    }
    renderGroups();

    loadCoverMaps(function() {
        // 收藏
        groups[0].count = savedContent.favorites.length;
        groups[0].html = savedContent.favorites.length > 0
            ? savedContent.favorites.slice(0, 8).map(function(f) { return itemHtml(f, false); }).join('')
            : '<div class="card-item"><div class="card-item-thumb" style="display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);">🎵</div><div class="card-item-info"><div class="card-item-sub">暂无收藏</div></div></div>';
        renderGroups();

        // 已购
        fetch('/api/purchases?buyer=' + encodeURIComponent(buyer))
            .then(function(r) { return r.ok ? r.json() : []; })
            .catch(function() { return fetch('/purchases?buyer=' + encodeURIComponent(buyer)).then(function(r) { return r.ok ? r.json() : []; }).catch(function() { return []; }); })
            .then(function(purchases) {
                var arr = Array.isArray(purchases) ? purchases : [];
                groups[1].count = arr.length;
                groups[1].html = arr.length > 0
                    ? arr.slice(0, 8).map(function(p) { return itemHtml(p, true); }).join('')
                    : '<div class="card-item"><div class="card-item-thumb" style="display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);">💿</div><div class="card-item-info"><div class="card-item-sub">暂无购买</div></div></div>';
                renderGroups();
            });
    });
}

async function renderAdminUserTable() {
    const tableBody = document.getElementById('adminUsersTable');
    if (!tableBody) return;

    try {
        const users = await apiRequest('/users');
        const currentAccount = localStorage.getItem('currentUser');

        tableBody.innerHTML = users.map(user => `
            <tr class="song-row">
                <td>${escapeHTML(user.name || user.account)}</td>
                <td>${escapeHTML(user.account)}</td>
                <td>••••••</td>
                <td>
                    <select class="role-select" data-user-id="${user.id}" ${user.account === currentAccount ? 'disabled' : ''}>
                        <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>管理员</option>
                        <option value="VISITOR" ${user.role === 'VISITOR' ? 'selected' : ''}>游客</option>
                    </select>
                </td>
                <td class="admin-actions">
                    <button class="action-btn-small edit-btn" data-user-id="${user.id}" data-name="${escapeHTML(user.name || '')}" data-account="${escapeHTML(user.account)}">编辑</button>
                    <button class="action-btn-small danger-btn" data-user-id="${user.id}" data-name="${escapeHTML(user.name || user.account)}" ${user.account === currentAccount ? 'disabled' : ''}>删除</button>
                </td>
            </tr>
        `).join('');

        // 权限下拉框事件
        tableBody.querySelectorAll('.role-select').forEach(select => {
            select.addEventListener('change', async function() {
                const userId = this.getAttribute('data-user-id');
                const newRole = this.value;
                try {
                    await apiRequest(`/users/${userId}/role`, {
                        method: 'PUT',
                        body: JSON.stringify({ role: newRole })
                    });
                    showPlayerToast('权限已更新');
                    syncAllUsers();
                } catch (error) {
                    showPlayerToast('权限修改失败');
                    renderAdminUserTable();
                }
            });
        });

        // 编辑按钮事件
        tableBody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                const name = this.getAttribute('data-name');
                const account = this.getAttribute('data-account');
                openEditUserModal({ id: parseInt(userId), name, account });
            });
        });

        // 删除按钮事件
        tableBody.querySelectorAll('.danger-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                const userName = this.getAttribute('data-name');
                deleteUser(userId, userName);
            });
        });
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#ff4d4f;">加载用户列表失败，请检查后端服务</td></tr>';
    }
}

async function syncAllUsers() {
    try {
        const users = await apiRequest('/users');
        users.forEach(user => syncStoredUser(user));
        renderAdminUserTable();
    } catch (error) {
        // ignore
    }
}

async function deleteUser(userId, userName) {
    if (!(await showConfirm(`确定要删除用户「${userName}」吗？此操作不可恢复。`))) return;
    try {
        await apiRequest(`/users/${userId}`, { method: 'DELETE' });
        showPlayerToast(`用户「${userName}」已删除`);
        renderAdminUserTable();
    } catch (error) {
        showPlayerToast('删除失败：' + (error.message || '未知错误'));
    }
}

function openEditUserModal(user) {
    const modal = document.getElementById('editUserModal');
    if (!modal) return;

    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserName').value = user.name || '';
    document.getElementById('editUserAccount').value = user.account || '';
    document.getElementById('editUserPassword').value = '';
    document.getElementById('editUserTips').textContent = '';

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
    toggleBodyScroll(true);
}

function closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    const settingsModal = document.getElementById('settingsModal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
    const settingsVisible = settingsModal?.style.display === 'flex' || settingsModal?.classList.contains('show');
    if (!settingsVisible) toggleBodyScroll(false);
}

async function submitEditUser(e) {
    e.preventDefault();
    const tips = document.getElementById('editUserTips');
    const userId = document.getElementById('editUserId').value;
    const name = document.getElementById('editUserName').value.trim();
    const account = document.getElementById('editUserAccount').value.trim();
    const password = document.getElementById('editUserPassword').value.trim();

    if (!name) { tips.textContent = '名字不能为空'; tips.className = 'tips error'; return; }
    if (!account) { tips.textContent = '账号不能为空'; tips.className = 'tips error'; return; }

    try {
        const body = { id: parseInt(userId), name, account };
        if (password) body.password = password;
        const updated = await apiRequest('/users', { method: 'PUT', body: JSON.stringify(body) });
        syncStoredUser(updated);
        tips.textContent = '保存成功';
        tips.className = 'tips success';
        setTimeout(() => {
            closeEditUserModal();
            renderAdminUserTable();
            renderSettingsModal();
        }, 600);
    } catch (error) {
        tips.textContent = error.message || '保存失败';
        tips.className = 'tips error';
    }
}

function renderAdminPanel() {
    var userPanel = document.getElementById('userContentPanel');
    var btnLine = document.getElementById('adminBtnsInline');
    var statsPanel = document.getElementById('adminStatsPanel');
    var cur = getCurrentUserRecord();

    if (userPanel) userPanel.style.display = 'none';
    if (btnLine) btnLine.style.display = 'none';
    if (statsPanel) statsPanel.style.display = 'none';

    if (!cur) return;

    if (cur.role === 'admin') {
        if (btnLine) btnLine.style.display = 'flex';
        if (statsPanel) statsPanel.style.display = 'block';
        var eb = document.getElementById('editHotBtn'); if (eb) eb.style.display = 'inline-block';
        var erb = document.getElementById('editRemenBtn'); if (erb) erb.style.display = 'inline-block';
        var esb = document.getElementById('editSingerBtn'); if (esb) esb.style.display = 'inline-block';; var eab = document.getElementById('editAlbumBtn'); if (eab) eab.style.display = 'inline-block';
        document.querySelectorAll('[id^=refresh][id$=Btn]').forEach(function(b){ b.style.display = 'inline-block'; });
        setTimeout(function() { if (typeof echarts !== 'undefined') renderSingerStatsChart(); }, 350);
    } else {
        if (userPanel) userPanel.style.display = 'block';
        var eb2 = document.getElementById('editHotBtn'); if (eb2) eb2.style.display = 'none';
        var erb2 = document.getElementById('editRemenBtn'); if (erb2) erb2.style.display = 'none';
        var esb2 = document.getElementById('editSingerBtn'); if (esb2) esb2.style.display = 'none';; var eab2 = document.getElementById('editAlbumBtn'); if (eab2) eab2.style.display = 'none';
        document.querySelectorAll('[id^=refresh][id$=Btn]').forEach(function(b){ b.style.display = 'none'; });
        renderUserContentGrid();
    }
}

// ======================== 统计图表 ========================
async function renderSingerStatsChart() {
    var dom = document.getElementById('singerStatsChart'); if (!dom) return;
    try {
        var r = await apiRequest('/stats/album-purchases');
        if (!r || !r.length) { dom.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.4);font-size:14px;">暂无购买数据</div>'; return; }
        var top = r.slice(0, 15);
        var albums = top.map(function(d) { return d.album_name; });
        var qty = top.map(function(d) { return d.total_quantity; });
        var short = top.map(function(d) {
            var n = d.album_name || '';
            if (n === 'The 1st Album XOXO (KISS&HUG)') return 'XOXO';
            if (n === 'Jay / Turn Of A Page') return 'Jay';
            if (n.length > 6) return n.slice(0,5)+'…';
            return n;
        });
        if (typeof echarts !== 'undefined') {
            var chart = echarts.init(dom);
            chart.setOption({
                tooltip: { trigger:'axis', axisPointer:{type:'shadow'}, formatter:function(p){var i=(Array.isArray(p)?p[0]:p).dataIndex;return'<strong>'+albums[i]+'</strong><br/>购买量：'+qty[i]+' 张';} },
                grid: { left:'2%', right:'3%', bottom:'6%', top:'15%', containLabel:true },
                xAxis: { type:'category', data:short, axisLabel:{color:'rgba(255,255,255,0.85)',fontSize:12,interval:0}, axisLine:{lineStyle:{color:'rgba(255,255,255,0.2)'}}, axisTick:{show:false} },
                yAxis: { type:'value', name:'购买量（张）', nameTextStyle:{color:'rgba(255,255,255,0.5)',fontSize:11}, axisLabel:{color:'rgba(255,255,255,0.7)'}, splitLine:{lineStyle:{color:'rgba(255,255,255,0.06)'}} },
                series: [{ type:'bar', data:qty,
                    itemStyle: { borderRadius:[8,8,0,0], color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(255,120,120,0.25)'},{offset:0.5,color:'rgba(228,57,60,0.15)'},{offset:1,color:'rgba(228,57,60,0.06)'}]), borderColor:'rgba(255,100,100,0.5)', borderWidth:1.5, shadowBlur:10, shadowColor:'rgba(228,57,60,0.2)', shadowOffsetY:2 },
                    emphasis: { itemStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(228,57,60,0.4)'},{offset:1,color:'rgba(228,57,60,0.15)'}]),borderColor:'rgba(255,130,130,0.75)',borderWidth:2} },
                    barMaxWidth:50, label:{show:true,position:'top',color:'rgba(255,255,255,0.55)',fontSize:11} }]
            });
            new ResizeObserver(function(){chart.resize();}).observe(dom);
        }
    } catch(e) { dom.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.4);font-size:14px;">统计数据加载失败</div>'; }
}

// ======================== 用户/音乐管理弹窗 ========================
function openUserManageModal() {
    var m = document.getElementById('userManageModal'); if(!m)return;
    if (typeof closeAllSideModals === 'function') closeAllSideModals(m);
    m.style.display='flex'; setTimeout(function(){m.classList.add('show')},10); toggleBodyScroll(true);
    renderAdminUserTable();
    setTimeout(initUserTableIndicator, 150);
}

// 用户管理表格滑动指示器
function initUserTableIndicator() {
    var indicator = document.getElementById('userTableIndicator');
    var tableWrap = document.getElementById('userTableWrap');
    var thead = tableWrap ? tableWrap.querySelector('thead') : null;
    if (!indicator || !tableWrap || !thead) return;

    function moveToRow(row) {
        var wrapRect = tableWrap.getBoundingClientRect(), rowRect = row.getBoundingClientRect();
        indicator.style.opacity = '1';
        indicator.style.top = (rowRect.top - wrapRect.top) + 'px';
        indicator.style.height = rowRect.height + 'px';
    }

    tableWrap.querySelectorAll('tbody .song-row').forEach(function(row) {
        row.addEventListener('mouseenter', function() { moveToRow(this); });
    });

    tableWrap.addEventListener('mouseleave', function() {
        var wrapRect = tableWrap.getBoundingClientRect(), headRect = thead.getBoundingClientRect();
        indicator.style.top = (headRect.top - wrapRect.top) + 'px';
        indicator.style.height = headRect.height + 'px';
    });

    function snapToThead() {
        var wrapRect = tableWrap.getBoundingClientRect(), headRect = thead.getBoundingClientRect();
        if (headRect.height > 0) {
            indicator.style.transition = 'none';
            indicator.style.top = (headRect.top - wrapRect.top) + 'px';
            indicator.style.height = headRect.height + 'px';
            indicator.style.opacity = '1';
            indicator.offsetHeight;
            indicator.style.transition = '';
        } else { setTimeout(snapToThead, 100); }
    }
    setTimeout(snapToThead, 150);
}
function closeUserManageModal() {
    var m = document.getElementById('userManageModal'); if(!m)return;
    m.classList.remove('show'); setTimeout(function(){m.style.display='none'},300); toggleBodyScroll(false);
}
function openMusicManageModal() {
    var m = document.getElementById('musicManageModal'); if(!m)return;
    if (typeof closeAllSideModals === 'function') closeAllSideModals(m);
    m.style.display='flex'; setTimeout(function(){m.classList.add('show')},10); toggleBodyScroll(true);
    renderMusicTable();
    setTimeout(initMusicTableIndicator, 150);
}

// 音乐管理表格滑动指示器
function initMusicTableIndicator() {
    var indicator = document.getElementById('musicTableIndicator');
    var tableWrap = document.getElementById('musicTableWrap');
    var thead = tableWrap ? tableWrap.querySelector('thead') : null;
    if (!indicator || !tableWrap || !thead) return;

    function moveToRow(row) {
        var wrapRect = tableWrap.getBoundingClientRect(), rowRect = row.getBoundingClientRect();
        indicator.style.opacity = '1';
        indicator.style.top = (rowRect.top - wrapRect.top) + 'px';
        indicator.style.height = rowRect.height + 'px';
    }

    tableWrap.querySelectorAll('tbody .song-row').forEach(function(row) {
        row.addEventListener('mouseenter', function() { moveToRow(this); });
    });

    tableWrap.addEventListener('mouseleave', function() {
        var wrapRect = tableWrap.getBoundingClientRect(), headRect = thead.getBoundingClientRect();
        indicator.style.top = (headRect.top - wrapRect.top) + 'px';
        indicator.style.height = headRect.height + 'px';
    });

    function snapToThead() {
        var wrapRect = tableWrap.getBoundingClientRect(), headRect = thead.getBoundingClientRect();
        if (headRect.height > 0) {
            indicator.style.transition = 'none';
            indicator.style.top = (headRect.top - wrapRect.top) + 'px';
            indicator.style.height = headRect.height + 'px';
            indicator.style.opacity = '1';
            indicator.offsetHeight;
            indicator.style.transition = '';
        } else { setTimeout(snapToThead, 100); }
    }
    setTimeout(snapToThead, 150);
}
function closeMusicManageModal() {
    var m = document.getElementById('musicManageModal'); if(!m)return;
    m.classList.remove('show'); setTimeout(function(){m.style.display='none'},300); toggleBodyScroll(false);
    _musicPagInited = false;
    _musicPagFirstOpen = true;
}

// 音乐管理分页滑动指示器
var _musicPagInited = false;
var _musicPagFirstOpen = true;
var _musicPagActiveBtn = null;
function initMusicPagIndicator() {
    var indicator = document.getElementById('musicPagIndicator');
    var pag = document.getElementById('musicPagination');
    if (!indicator || !pag) return;

    function updatePagIndicator(target) {
        if (!target || target.disabled) return;
        indicator.style.left = target.offsetLeft + 'px';
        indicator.style.width = target.offsetWidth + 'px';
    }

    var prevBtn = document.getElementById('musicPrevPage');
    var nextBtn = document.getElementById('musicNextPage');

    // 只绑定一次事件
    if (!_musicPagInited) {
        _musicPagInited = true;
        pag.addEventListener('mouseover', function(e) {
            var btn = e.target.closest('.pagination-btn');
            if (btn && !btn.disabled) updatePagIndicator(btn);
        });
        pag.addEventListener('mouseleave', function() {
            var target = _musicPagActiveBtn && !_musicPagActiveBtn.disabled ? _musicPagActiveBtn : (prevBtn && !prevBtn.disabled ? prevBtn : (nextBtn && !nextBtn.disabled ? nextBtn : null));
            updatePagIndicator(target);
        });
        if (prevBtn) prevBtn.addEventListener('click', function() {
            _musicPagActiveBtn = prevBtn;
            setTimeout(function() { updatePagIndicator(prevBtn); }, 80);
        });
        if (nextBtn) nextBtn.addEventListener('click', function() {
            _musicPagActiveBtn = nextBtn;
            setTimeout(function() { updatePagIndicator(nextBtn); }, 80);
        });
    }

    // 每次渲染更新引用并定位
    setTimeout(function() {
        if (_musicPagActiveBtn) {
            if (_musicPagActiveBtn.id === 'musicPrevPage') _musicPagActiveBtn = prevBtn;
            else _musicPagActiveBtn = nextBtn;
        }
        if (!_musicPagActiveBtn || _musicPagActiveBtn.disabled) {
            _musicPagActiveBtn = prevBtn && !prevBtn.disabled ? prevBtn : (nextBtn && !nextBtn.disabled ? nextBtn : null);
        }
        if (_musicPagActiveBtn) {
            if (_musicPagFirstOpen) {
                // 首次打开瞬间定位，无过渡
                _musicPagFirstOpen = false;
                indicator.style.transition = 'none';
                updatePagIndicator(_musicPagActiveBtn);
                indicator.offsetHeight;
                indicator.style.transition = 'left 0.55s cubic-bezier(0.33,0,0.67,1), width 0.55s cubic-bezier(0.33,0,0.67,1)';
            } else {
                // 翻页时保留过渡效果
                updatePagIndicator(_musicPagActiveBtn);
            }
        }
    }, 200);
}

// ======================== 音乐管理 ========================

var gMusicPage = 1;
var gMusicKeyword = '';
var MUSIC_PAGE_SIZE = 10;

async function renderMusicTable(keyword, page) {
    var tbody = document.getElementById('musicTableBody');
    if (!tbody) return;
    if (keyword !== undefined) gMusicKeyword = keyword;
    if (page !== undefined) gMusicPage = page;

    try {
        var params = new URLSearchParams();
        if (gMusicKeyword) params.set('keyword', gMusicKeyword);
        params.set('page', gMusicPage);
        params.set('size', MUSIC_PAGE_SIZE);
        var result = await apiRequest('/music?' + params.toString());

        var musicList, total, totalPages;
        if (Array.isArray(result)) {
            total = result.length;
            totalPages = Math.ceil(total / MUSIC_PAGE_SIZE) || 1;
            var start = (gMusicPage - 1) * MUSIC_PAGE_SIZE;
            musicList = result.slice(start, start + MUSIC_PAGE_SIZE);
        } else {
            musicList = result.records || [];
            total = result.total || 0;
            totalPages = Math.ceil(total / MUSIC_PAGE_SIZE) || 1;
        }

        tbody.innerHTML = musicList.map(function(m) {
            var img = m.imagePath ? '<img src="' + (m.imagePath.indexOf('/') === 0 ? m.imagePath : '/' + m.imagePath) + '" style="width:40px;height:40px;border-radius:4px;object-fit:cover;">' : '<span style="color:#888;">无封面</span>';
            var musicJson = JSON.stringify({id:m.id,musicName:m.musicName,singerName:m.singerName,imagePath:m.imagePath,musicPath:m.musicPath}).replace(/'/g,'&#39;');
            return '<tr class="song-row">' +
                '<td>' + img + '</td>' +
                '<td>' + escapeHTML(m.musicName) + '</td>' +
                '<td>' + escapeHTML(m.singerName) + '</td>' +
                '<td class="admin-actions">' +
                    '<button class="action-btn-small edit-btn" data-music=\'' + musicJson + '\'>编辑</button>' +
                    '<button class="action-btn-small danger-btn" data-music-id="' + m.id + '" data-music-name="' + escapeHTML(m.musicName) + '">删除</button>' +
                '</td>' +
            '</tr>';
        }).join('') || '<tr><td colspan="4" style="text-align:center;color:#888;">暂无音乐数据</td></tr>';

        var pag = document.getElementById('musicPagination');
        var prevBtn = document.getElementById('musicPrevPage');
        var nextBtn = document.getElementById('musicNextPage');
        var info = document.getElementById('musicPageInfo');
        if (pag) {
            pag.style.display = totalPages > 1 ? 'flex' : 'none';
            if (prevBtn) prevBtn.disabled = gMusicPage <= 1;
            if (nextBtn) nextBtn.disabled = gMusicPage >= totalPages;
            if (info) info.textContent = '第 ' + gMusicPage + ' 页 / 共 ' + totalPages + ' 页';
            // 分页指示器
            initMusicPagIndicator();
        }

        tbody.querySelectorAll('.edit-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                openMusicFormModal(JSON.parse(this.getAttribute('data-music')));
            });
        });
        tbody.querySelectorAll('.danger-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                deleteMusic(this.getAttribute('data-music-id'), this.getAttribute('data-music-name'));
            });
        });
    } catch(e) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#ff4d4f;">加载失败，请检查后端</td></tr>';
    }
}

function openMusicFormModal(music) {
    const modal = document.getElementById('musicFormModal');
    if (!modal) return;

    document.getElementById('musicFormTitle').textContent = music ? '编辑音乐' : '添加音乐';
    document.getElementById('musicFormId').value = music ? music.id : '';
    document.getElementById('musicFormName').value = music ? music.musicName : '';
    document.getElementById('musicFormSinger').value = music ? music.singerName : '';
    document.getElementById('musicFormImage').value = '';
    document.getElementById('musicFormFile').value = '';
    document.getElementById('musicFormTips').textContent = '';

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
    toggleBodyScroll(true);
}

function closeMusicFormModal() {
    const modal = document.getElementById('musicFormModal');
    const settingsModal = document.getElementById('settingsModal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
    const settingsVisible = settingsModal?.style.display === 'flex' || settingsModal?.classList.contains('show');
    if (!settingsVisible) toggleBodyScroll(false);
}

async function submitMusicForm(e) {
    e.preventDefault();
    const tips = document.getElementById('musicFormTips');
    const id = document.getElementById('musicFormId').value;
    const musicName = document.getElementById('musicFormName').value.trim();
    const singerName = document.getElementById('musicFormSinger').value.trim();
    const imageFile = document.getElementById('musicFormImage').files[0];
    const musicFile = document.getElementById('musicFormFile').files[0];

    if (!musicName) { tips.textContent = '歌名不能为空'; tips.className = 'tips error'; return; }
    if (!singerName) { tips.textContent = '歌手名不能为空'; tips.className = 'tips error'; return; }
    if (!imageFile) { tips.textContent = '请选择封面图片'; tips.className = 'tips error'; return; }
    if (!musicFile) { tips.textContent = '请选择音乐文件'; tips.className = 'tips error'; return; }

    try {
        const formData = new FormData();
        formData.append('musicName', musicName);
        formData.append('singerName', singerName);
        formData.append('imageFile', imageFile);
        formData.append('musicFile', musicFile);

        if (id) {
            // 编辑
            await apiRequest(`/music/${id}/upload`, {
                method: 'PUT',
                headers: {},
                body: formData
            });
        } else {
            // 添加
            await apiRequest('/music/upload', {
                method: 'POST',
                headers: {},
                body: formData
            });
        }

        tips.textContent = '保存成功';
        tips.className = 'tips success';
        setTimeout(() => {
            closeMusicFormModal();
            renderMusicTable();
        }, 500);
    } catch (error) {
        tips.textContent = error.message || '保存失败';
        tips.className = 'tips error';
    }
}

async function deleteMusic(id, name) {
    if (!(await showConfirm(`确定要删除「${name}」吗？此操作不可恢复。`))) return;
    try {
        await apiRequest(`/music/${id}`, { method: 'DELETE' });
        showPlayerToast(`「${name}」已删除`);
        renderMusicTable();
    } catch (error) {
        showPlayerToast('删除失败：' + (error.message || '未知错误'));
    }
}

function renderSettingsModal() {
    const currentUser = getCurrentUserRecord();
    const avatarEl = document.getElementById('settingsAvatar');
    const nameEl = document.getElementById('settingsName');
    const accountEl = document.getElementById('settingsAccount');
    const roleEl = document.getElementById('settingsRole');

    if (!currentUser) return;

    let avatarPath = currentUser.avatar || '头像/1.png';
    if (avatarPath && !avatarPath.startsWith('data:') && !avatarPath.startsWith('http') && !avatarPath.startsWith('/')) {
        avatarPath = '/' + avatarPath;
    }
    if (avatarEl) {
        avatarEl.style.backgroundImage = `url('${avatarPath}')`;
    }
    if (nameEl) nameEl.textContent = currentUser.name || currentUser.account;
    if (accountEl) accountEl.textContent = currentUser.account;
    if (roleEl) {
        roleEl.textContent = getRoleLabel(currentUser.role);
        roleEl.classList.toggle('admin', currentUser.role === 'admin');
    }

    renderAdminPanel();
}

async function openSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');

    if (!settingsModal) return;

    // 关闭侧边弹窗（播放列表、收藏、历史）
    if (typeof closeAllSideModals === 'function') {
        closeAllSideModals(settingsModal);
    }

    // 从数据库刷新当前用户信息（确保权限实时有效，而非仅依赖本地缓存）
    const currentUser = getCurrentUserRecord();
    if (currentUser && currentUser.id) {
        try {
            const freshUser = await apiRequest(`/users/${currentUser.id}`);
            syncStoredUser(freshUser);
        } catch (error) {
            // 后端不可用时降级使用本地缓存
        }
    }

    renderSettingsModal();

    settingsModal.style.display = 'flex';
    setTimeout(() => settingsModal.classList.add('show'), 10);
    toggleBodyScroll(true);
}

function closeSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    if (!settingsModal) return;
    settingsModal.classList.remove('show');
    setTimeout(() => settingsModal.style.display = 'none', 300);
    toggleBodyScroll(false);
}

function openPasswordModal() {
    const passwordModal = document.getElementById('passwordModal');
    const passwordTips = document.getElementById('passwordTips');
    const form = document.getElementById('changePasswordForm');

    if (!passwordModal) return;

    if (passwordTips) passwordTips.textContent = '';
    if (form) form.reset();

    passwordModal.style.display = 'flex';
    setTimeout(() => passwordModal.classList.add('show'), 10);
    toggleBodyScroll(true);
}

function closePasswordModal() {
    const passwordModal = document.getElementById('passwordModal');
    const settingsModal = document.getElementById('settingsModal');
    if (!passwordModal) return;
    passwordModal.classList.remove('show');
    setTimeout(() => passwordModal.style.display = 'none', 300);
    const settingsVisible = settingsModal?.style.display === 'flex' || settingsModal?.classList.contains('show');
    if (!settingsVisible) {
        toggleBodyScroll(false);
    }
}

async function handleAvatarSelect(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;

    var currentUser = getCurrentUserRecord();
    if (!currentUser) return;

    var avatarEl = document.getElementById('settingsAvatar');

    // 用文件名构建头像路径
    var avatarPath = 'assets/images/头像/' + file.name;

    try {
        var resp = await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentUser.id, avatar: avatarPath })
        });
        if (!resp.ok) throw new Error('fail');
        var updated = await resp.json();
        syncStoredUser(updated);

        var path = updated.avatar || '头像/1.png';
        if (path.indexOf('/') !== 0) path = '/' + path;
        if (avatarEl) avatarEl.style.backgroundImage = 'url(\'' + path + '\')';
        var ta = document.querySelector('.avatar-wrapper');
        if (ta) ta.style.backgroundImage = 'url(\'' + path + '\')';
        showPlayerToast('头像已更新');
    } catch (err) {
        showPlayerToast('更新失败');
    }
}

async function changeCurrentUserPassword() {
    const currentUser = getCurrentUserRecord();
    const passwordTips = document.getElementById('passwordTips');
    const oldPassword = document.getElementById('oldPassword')?.value.trim();
    const newPassword = document.getElementById('newPassword')?.value.trim();
    const confirmNewPassword = document.getElementById('confirmNewPassword')?.value.trim();

    if (!currentUser || !passwordTips) return;
    if (!newPassword || newPassword.length < 6) {
        passwordTips.textContent = '新密码长度不能少于6位';
        passwordTips.className = 'tips error';
        return;
    }
    if (newPassword !== confirmNewPassword) {
        passwordTips.textContent = '两次输入的新密码不一致';
        passwordTips.className = 'tips error';
        return;
    }

    try {
        const updatedUser = await apiRequest(`/users/${currentUser.id}/password`, {
            method: 'PUT',
            body: JSON.stringify({ oldPassword, newPassword })
        });
        syncStoredUser(updatedUser);
        passwordTips.textContent = '密码已更新';
        passwordTips.className = 'tips success';
        document.getElementById('changePasswordForm')?.reset();
        setTimeout(() => {
            closePasswordModal();
            showAlert('密码已保存到数据库');
        }, 600);
    } catch (error) {
        passwordTips.textContent = error.message || '密码修改失败，请检查后端服务';
        passwordTips.className = 'tips error';
    }
}

function performLogout() {
    localStorage.removeItem('currentUser');
    updateRecommendHeader(null);
    updateLoginButton(null);

    // 隐藏所有管理员编辑按钮
    ['editSingerBtn','editHotBtn','editRemenBtn','editAlbumBtn','refreshSingerBtn','refreshHotBtn','refreshRemenBtn','refreshAlbumBtn'].forEach(function(id) {
        var btn = document.getElementById(id); if (btn) btn.style.display = 'none';
    });

    const logoutModal = document.getElementById('logoutModal');
    const settingsModal = document.getElementById('settingsModal');
    [logoutModal, settingsModal].forEach(modal => {
        if (!modal) return;
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    });
    toggleBodyScroll(false);
    showAlert('已退出登录');

    const playerTitle = document.getElementById('playerSongTitle');
    const playerTotalTime = document.getElementById('playerTotalTime');
    const playerCurrentTime = document.getElementById('playerCurrentTime');
    const heartIconBtn = document.getElementById('playerHeartIcon');
    const tag = document.querySelector('.player-right .hq-tag');

    if (playerTitle) playerTitle.textContent = '暂无歌曲 请手动添加~';
    if (playerTotalTime) playerTotalTime.textContent = '00:00';
    if (playerCurrentTime) playerCurrentTime.textContent = '00:00';
    if (heartIconBtn) heartIconBtn.style.display = 'none';
    if (tag) tag.style.display = 'none';

    if (typeof window.stopGlobalMusic === 'function') {
        window.stopGlobalMusic();
    }

    const playerIframe = document.querySelector('iframe[src*="musicnav.html"]');
    if (playerIframe && playerIframe.contentWindow && typeof playerIframe.contentWindow.stopProgress === 'function') {
        playerIframe.contentWindow.stopProgress();
    }
}

function openLogoutModal() {
    const logoutModal = document.getElementById('logoutModal');
    if (!logoutModal) return;

    logoutModal.style.display = 'flex';
    setTimeout(() => logoutModal.classList.add('show'), 10);
    toggleBodyScroll(true);

    const closeModal = () => {
        logoutModal.classList.remove('show');
        setTimeout(() => logoutModal.style.display = 'none', 300);
        toggleBodyScroll(false);
    };

    document.getElementById('confirmLogoutBtn').onclick = performLogout;
    document.getElementById('cancelLogoutBtn').onclick = closeModal;
    document.getElementById('closeLogoutBtn').onclick = closeModal;
    logoutModal.onclick = (e) => { if (e.target === logoutModal) closeModal(); };
}

/**
 * =============================================================================
 * 模块：登录/注册逻辑
 * =============================================================================
 */
function updateRecommendHeader(displayName) {
    const headerTitle = document.getElementById('recommendHeaderTitle');
    if (headerTitle) {
        headerTitle.textContent = displayName ? `Hi ${displayName} 今日为你推荐` : '暂未登录 请先登录';
    }
}

function updateLoginButton(user) {
    const loginArea = document.querySelector('.login-area');
    if (!loginArea) return;

    const playerTitle = document.getElementById('playerSongTitle');

    if (user && user.account) {
        const username = user.name || user.account;
        let avatarPath = user.avatar || '头像/1.png';
        if (avatarPath && !avatarPath.startsWith('data:') && !avatarPath.startsWith('http') && !avatarPath.startsWith('/')) {
            avatarPath = '/' + avatarPath;
        }

        loginArea.innerHTML = `
            <div class="user-info">
                <div class="avatar-wrapper" style="background-image: url('${avatarPath}');"></div>
                <span class="user-name">${username}</span>
            </div>
        `;

        const playerHeartIcon = document.getElementById('playerHeartIcon');
        const playerTag = document.querySelector('.player-right .hq-tag');
        const isNoMusic = !playerTitle || playerTitle.textContent === '暂无歌曲 请手动添加~';

        if (playerHeartIcon) playerHeartIcon.style.display = isNoMusic ? 'none' : 'inline-block';
        if (playerTag) playerTag.style.display = isNoMusic ? 'none' : 'inline-block';

        const avatarWrapper = loginArea.querySelector('.avatar-wrapper');
        if (avatarWrapper) {
            avatarWrapper.addEventListener('click', openSettingsModal);
        }
        if (user.role === 'admin') {
            var eb3 = document.getElementById('editHotBtn');
            if (eb3) eb3.style.display = 'inline-block';
            var erb3 = document.getElementById('editRemenBtn');
            if (erb3) erb3.style.display = 'inline-block';
        }
    } else {
        loginArea.innerHTML = '<button class="login-btn">登录</button>';
        var eb4 = document.getElementById('editHotBtn'); if (eb4) eb4.style.display = 'none';
        var erb4 = document.getElementById('editRemenBtn'); if (erb4) erb4.style.display = 'none';
        const btn = loginArea.querySelector('.login-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                if (loginModal) {
                    loginModal.style.display = 'flex';
                    setTimeout(() => loginModal.classList.add('show'), 10);
                    toggleBodyScroll(true);
                    if (loginForm) loginForm.reset();
                    if (loginTips) loginTips.textContent = '';
                    if (agreementCheck) agreementCheck.checked = false;
                }
            });
        }
    }
}

/**
 * =============================================================================
 * 模块：音质卡片 3D 轮播图
 * =============================================================================
 */
function initQualityCarousel() {
    const cards = document.querySelectorAll('.quality-card');
    const container = document.querySelector('.quality-cards');
    if (!cards.length || !container) return;

    let currentIndex = 0;
    let timer = null;

    function updateCarousel() {
        cards.forEach((card, index) => {
            card.classList.remove('active', 'prev', 'next', 'hidden');
            
            const n = cards.length;
            const diff = (index - currentIndex + n) % n;

            if (diff === 0) {
                card.classList.add('active');
            } else if (diff === 1 || (diff === -2 && n === 3)) {
                card.classList.add('next');
            } else if (diff === n - 1 || (diff === 2 && n === 3)) {
                card.classList.add('prev');
            } else {
                card.classList.add('hidden');
            }
        });
    }

    function nextSlide() {
        if (window.isModalOpen || document.body.classList.contains('modal-open')) return;
        currentIndex = (currentIndex + 1) % cards.length;
        updateCarousel();
    }

    function startAutoPlay() {
        stopAutoPlay();
        if (isVisible && !window.isModalOpen && !document.body.classList.contains('modal-open')) {
            timer = setInterval(nextSlide, 3500);
        }
    }

    function stopAutoPlay() {
        if (timer) clearInterval(timer);
    }

    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
        if (isVisible) startAutoPlay();
        else stopAutoPlay();
    }, { threshold: 0.1 });
    observer.observe(container);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && isVisible) startAutoPlay();
        else stopAutoPlay();
    });

    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            if (index !== currentIndex) {
                currentIndex = index;
                updateCarousel();
                startAutoPlay();
            }
        });
    });

    container.addEventListener('mouseenter', stopAutoPlay);
    container.addEventListener('mouseleave', startAutoPlay);

    const prevBtn = document.getElementById('qualityPrevBtn');
    const nextBtn = document.getElementById('qualityNextBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            if (window.isModalOpen || document.body.classList.contains('modal-open')) return;
            e.stopPropagation();
            currentIndex = (currentIndex - 1 + cards.length) % cards.length;
            updateCarousel();
            startAutoPlay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            if (window.isModalOpen || document.body.classList.contains('modal-open')) return;
            e.stopPropagation();
            nextSlide();
            startAutoPlay();
        });
    }

    window.startQualityAutoPlay = startAutoPlay;
    window.stopQualityAutoPlay = stopAutoPlay;

    updateCarousel();
    startAutoPlay();
}

/**
 * =============================================================================
 * 模块：英雄区域轮播图 (高性能 2D 切换)
 * =============================================================================
 */
function initHero3DCarousel() {
    const items = document.querySelectorAll('.carousel-3d-item');
    const indicators = document.querySelectorAll('.carousel-3d-indicators .indicator');
    const prevBtn = document.getElementById('heroPrevBtn');
    const nextBtn = document.getElementById('heroNextBtn');
    const container = document.querySelector('.carousel-3d-container');

    if (!items.length) return;

    let currentIndex = 0;
    const total = items.length;
    let timer = null;
    let isTransitioning = false;

    function updateCarousel() {
        if (isTransitioning) return;
        isTransitioning = true;

        items.forEach((item, index) => {
            item.classList.remove('active', 'prev', 'next');
            
            const diff = (index - currentIndex + total) % total;

            if (diff === 0) {
                item.classList.add('active');
            } else if (diff === 1) {
                item.classList.add('next');
            } else if (diff === total - 1) {
                item.classList.add('prev');
            }
        });

        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
        });

        setTimeout(() => {
            isTransitioning = false;
        }, 500);
    }

    function nextSlide() {
        if (isTransitioning || window.isModalOpen || document.body.classList.contains('modal-open')) return;
        currentIndex = (currentIndex + 1) % total;
        updateCarousel();
    }

    function prevSlide() {
        if (isTransitioning || window.isModalOpen || document.body.classList.contains('modal-open')) return;
        currentIndex = (currentIndex - 1 + total) % total;
        updateCarousel();
    }

    nextBtn?.addEventListener('click', (e) => {
        if (window.isModalOpen || document.body.classList.contains('modal-open')) return;
        e.stopPropagation();
        nextSlide();
        startAutoPlay();
    });

    prevBtn?.addEventListener('click', (e) => {
        if (window.isModalOpen || document.body.classList.contains('modal-open')) return;
        e.stopPropagation();
        prevSlide();
        startAutoPlay();
    });

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            if (window.isModalOpen || document.body.classList.contains('modal-open')) return;
            const slideTo = parseInt(indicator.getAttribute('data-slide-to')) || index;
            if (slideTo !== currentIndex && !isTransitioning) {
                currentIndex = slideTo;
                updateCarousel();
                startAutoPlay();
            }
        });
    });

    function startAutoPlay() {
        stopAutoPlay();
        if (isVisible && !window.isModalOpen && !document.body.classList.contains('modal-open')) {
            timer = setInterval(nextSlide, 5000);
        }
    }

    function stopAutoPlay() {
        if (timer) clearInterval(timer);
    }

    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
        if (isVisible) startAutoPlay();
        else stopAutoPlay();
    }, { threshold: 0.1 });
    if (container) observer.observe(container);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && isVisible) startAutoPlay();
        else stopAutoPlay();
    });

    container?.addEventListener('mouseenter', stopAutoPlay);
    container?.addEventListener('mouseleave', startAutoPlay);

    window.startHero3DAutoPlay = startAutoPlay;
    window.stopHero3DAutoPlay = stopAutoPlay;

    updateCarousel();
    startAutoPlay();
}

/**
 * =============================================================================
 * 模块：页面初始化加载与全局事件
 * =============================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    initHero3DCarousel();
    initQualityCarousel();
    const currentUserRecord = getCurrentUserRecord();
    updateRecommendHeader(currentUserRecord?.name || currentUserRecord?.account || null);
    updateLoginButton(currentUserRecord);

    // 非管理员隐藏编辑按钮
    if (!currentUserRecord || currentUserRecord.role !== 'admin') {
        ['editSingerBtn','editHotBtn','editRemenBtn','editAlbumBtn','refreshSingerBtn','refreshHotBtn','refreshRemenBtn','refreshAlbumBtn'].forEach(function(id) {
            var btn = document.getElementById(id); if (btn) btn.style.display = 'none';
        });
    }

    document.getElementById('closeSettingsBtn')?.addEventListener('click', closeSettingsModal);
    document.getElementById('settingsModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') closeSettingsModal();
    });

    // 头像选择 - 打开文件选择框
    var avatarWrapper2 = document.getElementById('settingsAvatarWrapper');
    var avatarFileInput2 = document.getElementById('avatarFileInput');
    if (avatarWrapper2 && avatarFileInput2) {
        avatarWrapper2.addEventListener('click', function() { avatarFileInput2.click(); });
        avatarFileInput2.addEventListener('change', handleAvatarSelect);
    }

    document.getElementById('openPasswordModalBtn')?.addEventListener('click', openPasswordModal);
    document.getElementById('closePasswordBtn')?.addEventListener('click', closePasswordModal);
    document.getElementById('passwordModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'passwordModal') closePasswordModal();
    });
    document.getElementById('settingsLogoutBtn')?.addEventListener('click', () => {
        closeSettingsModal();
        setTimeout(openLogoutModal, 320);
    });
    document.getElementById('changePasswordForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        changeCurrentUserPassword();
    });

    // 编辑用户弹窗事件
    document.getElementById('closeEditUserBtn')?.addEventListener('click', closeEditUserModal);
    document.getElementById('editUserModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'editUserModal') closeEditUserModal();
    });
    document.getElementById('editUserForm')?.addEventListener('submit', submitEditUser);

    // 音乐管理弹窗事件
    document.getElementById('openAddMusicBtn')?.addEventListener('click', () => openMusicFormModal(null));
    document.getElementById('closeMusicFormBtn')?.addEventListener('click', closeMusicFormModal);
    document.getElementById('musicFormModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'musicFormModal') closeMusicFormModal();
    });
    document.getElementById('musicForm')?.addEventListener('submit', submitMusicForm);
    document.getElementById('musicSearchBtn')?.addEventListener('click', function() {
        var kw = document.getElementById('musicSearchInput')?.value.trim() || '';
        renderMusicTable(kw, 1);
    });
    document.getElementById('musicSearchInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            var kw = e.target.value.trim() || '';
            renderMusicTable(kw, 1);
        }
    });
    document.getElementById('musicPrevPage')?.addEventListener('click', function() {
        if (gMusicPage > 1) renderMusicTable(undefined, gMusicPage - 1);
    });
    document.getElementById('musicNextPage')?.addEventListener('click', function() {
        renderMusicTable(undefined, gMusicPage + 1);
    });

    document.getElementById('reportLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof window.showPlayerToast === 'function') {
            window.showPlayerToast('作者暂未制作听歌报告...');
        } else {
            alert('作者暂未制作听歌报告...');
        }
    });

    // 编辑热门按钮（管理员可见）- 排行
    var editBtn = document.getElementById('editHotBtn');
    if (editBtn && currentUserRecord && currentUserRecord.role === 'admin') {
        editBtn.style.display = 'inline-block';
        editBtn.addEventListener('click', openHotEditor);
    }
    document.getElementById('closeHotEditBtn')?.addEventListener('click', closeHotEditor);
    document.getElementById('cancelHotEditBtn')?.addEventListener('click', closeHotEditor);
    document.getElementById('saveHotEditBtn')?.addEventListener('click', saveHotEditor);
    document.getElementById('hotEditModal')?.addEventListener('click', function(e) {
        if (e.target.id === 'hotEditModal') closeHotEditor();
    });

    // 编辑热门按钮（管理员可见）- remen
    var remenBtn = document.getElementById('editRemenBtn');
    if (remenBtn && currentUserRecord && currentUserRecord.role === 'admin') {
        remenBtn.style.display = 'inline-block';
        remenBtn.addEventListener('click', openRemenEditor);
    }
    document.getElementById('closeRemenEditBtn')?.addEventListener('click', closeRemenEditor);
    document.getElementById('cancelRemenEditBtn')?.addEventListener('click', closeRemenEditor);
    document.getElementById('saveRemenEditBtn')?.addEventListener('click', saveRemenEditor);
    document.getElementById('remenEditModal')?.addEventListener('click', function(e) {
        if (e.target.id === 'remenEditModal') closeRemenEditor();
    });

    // 编辑按钮（管理员可见）- 歌手
    var singerEditBtn = document.getElementById('editSingerBtn');
    if (singerEditBtn && currentUserRecord && currentUserRecord.role === 'admin') {
        singerEditBtn.style.display = 'inline-block';
        singerEditBtn.addEventListener('click', openSingerEditor);
    }

    // 编辑按钮（管理员可见）- 专辑
    var albumEditBtn = document.getElementById('editAlbumBtn');
    if (albumEditBtn && currentUserRecord && currentUserRecord.role === 'admin') {
        albumEditBtn.style.display = 'inline-block';
        albumEditBtn.addEventListener('click', openAlbumEditor);
    }

    // 管理员：用户管理弹窗
    document.getElementById('openUserManageBtn')?.addEventListener('click', openUserManageModal);
    document.getElementById('closeUserManageBtn')?.addEventListener('click', closeUserManageModal);
    document.getElementById('userManageModal')?.addEventListener('click', function(e) { if (e.target.id === 'userManageModal') closeUserManageModal(); });

    // 管理员：音乐管理弹窗
    document.getElementById('openMusicManageBtn')?.addEventListener('click', openMusicManageModal);
    document.getElementById('closeMusicManageBtn')?.addEventListener('click', closeMusicManageModal);
    document.getElementById('musicManageModal')?.addEventListener('click', function(e) { if (e.target.id === 'musicManageModal') closeMusicManageModal(); });
});

const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginTips = document.getElementById('loginTips');
const registerTips = document.getElementById('registerTips');
const agreementCheck = document.getElementById('agreementCheck');

document.querySelectorAll('.login-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (loginModal) {
            loginModal.style.display = 'flex';
            setTimeout(() => loginModal.classList.add('show'), 10);
            toggleBodyScroll(true);
            if (loginForm) loginForm.reset();
            if (loginTips) loginTips.textContent = '';
            if (agreementCheck) agreementCheck.checked = false;
        }
    });
});

document.getElementById('recommendHeaderTitle')?.addEventListener('click', () => {
    if (!localStorage.getItem('currentUser')) {
        loginModal.style.display = 'flex';
        setTimeout(() => loginModal.classList.add('show'), 10);
        toggleBodyScroll(true);
    }
});

document.getElementById('closeLoginBtn')?.addEventListener('click', () => {
    loginModal.classList.remove('show');
    setTimeout(() => loginModal.style.display = 'none', 300);
    toggleBodyScroll(false);
});

document.getElementById('closeRegisterBtn')?.addEventListener('click', () => {
    registerModal.classList.remove('show');
    setTimeout(() => registerModal.style.display = 'none', 300);
    toggleBodyScroll(false);
});

document.getElementById('goToRegister')?.addEventListener('click', () => {
    loginModal.style.display = 'none';
    loginModal.classList.remove('show');
    registerModal.style.display = 'flex';
    setTimeout(() => registerModal.classList.add('show'), 10);
});

document.getElementById('goToLogin')?.addEventListener('click', () => {
    registerModal.style.display = 'none';
    registerModal.classList.remove('show');
    loginModal.style.display = 'flex';
    setTimeout(() => loginModal.classList.add('show'), 10);
});

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const name = document.getElementById('registerName').value.trim();
        const account = document.getElementById('registerAccount').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();

        if (!name) { registerTips.textContent = '名称不能为空！'; registerTips.className = 'tips error'; return; }
        if (!account) { registerTips.textContent = '账号不能为空！'; registerTips.className = 'tips error'; return; }
        if (password.length < 6) { registerTips.textContent = '密码长度不能少于6位！'; registerTips.className = 'tips error'; return; }
        if (password !== confirmPassword) { registerTips.textContent = '两次输入的密码不一致！'; registerTips.className = 'tips error'; return; }

        try {
            const newUser = await apiRequest('/users/register', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    account,
                    username: account,
                    password
                })
            });
            // 将后端返回的用户信息（含默认头像等）同步到本地
            syncStoredUser(newUser);
            registerTips.textContent = '注册成功！即将返回登录';
            registerTips.className = 'tips success';
            setTimeout(() => {
                registerModal.classList.remove('show');
                setTimeout(() => {
                    registerModal.style.display = 'none';
                    loginModal.style.display = 'flex';
                    setTimeout(() => loginModal.classList.add('show'), 10);
                    document.getElementById('loginAccount').value = account;
                }, 300);
            }, 2000);
        } catch (error) {
            registerTips.textContent = error.message || '注册失败';
            registerTips.className = 'tips error';
            registerModal.style.display = 'flex';
            registerModal.classList.add('show');
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const account = document.getElementById('loginAccount').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (agreementCheck && !agreementCheck.checked) {
            loginTips.textContent = '请先阅读并同意用户协议和隐私政策！'; loginTips.className = 'tips error'; return;
        }

        try {
            const user = await apiRequest('/users/login', {
                method: 'POST',
                body: JSON.stringify({ account, password })
            });
            const normalizedUser = syncStoredUser(user);
            localStorage.setItem('currentUser', normalizedUser.account);
            loginTips.textContent = '登录成功！';
            loginTips.className = 'tips success';
            setTimeout(() => {
                loginModal.classList.remove('show');
                setTimeout(() => {
                    loginModal.style.display = 'none';
                    toggleBodyScroll(false);
                    showAlert(`欢迎你，${normalizedUser.name || normalizedUser.account}！`);
                    updateRecommendHeader(normalizedUser.name || normalizedUser.account);
                    updateLoginButton(normalizedUser);
                    // 管理员显示编辑按钮
                    if (normalizedUser.role === 'admin') {
                        ['editSingerBtn','editHotBtn','editRemenBtn','editAlbumBtn','refreshSingerBtn','refreshHotBtn','refreshRemenBtn','refreshAlbumBtn'].forEach(function(id) {
                            var btn = document.getElementById(id); if (btn) btn.style.display = 'inline-block';
                        });
                    }
                    // 刷新专辑购买状态
                    if (typeof loadAlbums === 'function') loadAlbums();
                }, 300);
            }, 1000);
        } catch (error) {
            loginTips.textContent = error.message || '账号或密码错误，或该用户未注册！';
            loginTips.className = 'tips error';
            loginModal.style.display = 'flex';
            loginModal.classList.add('show');
        }
    });
}

window.addEventListener('click', (e) => {
    if (e.target === loginModal || e.target === registerModal) {
        e.target.classList.remove('show');
        setTimeout(() => {
            e.target.style.display = 'none';
            toggleBodyScroll(false);
        }, 300);
    }
});

/**
 * =============================================================================
 * 模块：底部音乐播放条逻辑
 * =============================================================================
 */
(function() {
    const audio = new Audio();
    window.audio = audio; 
    let currentMusicIndex = -1;
    let playMode = 0; // 0: 列表循环, 1: 随机播放
    let isPlaying = false;

    const singerModal = document.getElementById('singerModal');
    const playBtn = document.getElementById('playerPlayBtn');
    const progressFill = document.getElementById('playerProgressFill');
    const currentTimeEl = document.getElementById('playerCurrentTime');
    const progressBar = document.getElementById('playerProgressBar');
    const heartIcon = document.getElementById('playerHeartIcon');
    const toast = document.getElementById('playerToast');
    const playIcon = playBtn ? playBtn.querySelector('i') : null;
    const volumeBtn = document.getElementById('playerVolumeBtn');
    const volumePanel = document.getElementById('playerVolumePanel');
    const volumeSlider = document.querySelector('.player-volume-slider');
    const volumeProgress = document.getElementById('playerVolumeProgress');
    const volumeDot = document.getElementById('playerVolumeDot');
    const playModeBtn = document.getElementById('playerPlayModeBtn');
    const hidePlayerBtn = document.getElementById('playerHideBtn');
    const showPlayerBtn = document.getElementById('playerShowBtn');
    const playerBar = document.querySelector('.player-bar');

    if (playerBar && !playerBar.classList.contains('hidden')) {
        showPlayerBtn?.classList.add('active');
    }

    const playerTitle = document.getElementById('playerSongTitle');
    const playerTotalTime = document.getElementById('playerTotalTime');

    const lastPlayed = JSON.parse(localStorage.getItem('yjay_last_played') || 'null');
    if (lastPlayed && playerTitle && playerTotalTime) {
        playerTitle.textContent = `${lastPlayed.title} - ${lastPlayed.singer}`;
        playerTotalTime.textContent = lastPlayed.duration || '00:00';
        
        if (heartIcon) {
            heartIcon.style.display = 'inline-block';
            
            const savedFavorites = JSON.parse(localStorage.getItem('yjay_favorites') || '[]');
            const isFavorite = savedFavorites.some(f => f.title === lastPlayed.title && f.singer === lastPlayed.singer);
            if (isFavorite) {
                heartIcon.classList.add('active');
            } else {
                heartIcon.classList.remove('active');
            }
        }
        const playerTag = document.querySelector('.player-right .hq-tag');
        if (playerTag) {
            playerTag.textContent = lastPlayed.tag || 'HQ';
            playerTag.style.display = 'inline-block';
        }
        
        const savedPlaylist = JSON.parse(localStorage.getItem('yjay_playlist') || '[]');
        currentMusicIndex = savedPlaylist.findIndex(s => s.title === lastPlayed.title && s.singer === lastPlayed.singer);
    } else {
        if (playerTitle) playerTitle.textContent = '暂无歌曲 请手动添加~';
        if (playerTotalTime) playerTotalTime.textContent = '00:00';
    }

    const musicVaultLink = document.getElementById('musicVaultLink');
    if (musicVaultLink) {
        musicVaultLink.addEventListener('click', function(e) {
            e.preventDefault();
            showPlayerToast('作者并未做音质宝库...');
        });
    }

    const nav = document.querySelector('.nav');
    window.addEventListener('scroll', throttle(() => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }, 16), { passive: true });

    const revealElements = document.querySelectorAll('.reveal');
    
    const revealConfig = {
        threshold: 0.1, 
        rootMargin: '0px 0px -20px 0px' 
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const el = entry.target;
            
            if (entry.isIntersecting) {
                if (!el.classList.contains('active')) {
                    el.classList.add('active');
                    el.classList.remove('exit', 'exit-down');
                }
            } else {
                if (el.classList.contains('active') && !el.closest('#relaxScroll')) {
                    el.classList.remove('active');
                    const rect = entry.boundingClientRect;
                    el.classList.add(rect.top < 0 ? 'exit' : 'exit-down');
                }
            }
        });
    }, revealConfig);

    const initReveal = () => {
        revealElements.forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                setTimeout(() => {
                    el.classList.add('active');
                }, index * 50);
            }
            revealObserver.observe(el);
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReveal);
    } else {
        initReveal();
    }

    const playlistModal = document.getElementById('playlistModal');
    const favoritesModal = document.getElementById('favoritesModal');
    const historyModal = document.getElementById('historyModal');
    const settingsModal = document.getElementById('settingsModal');
    const userManageModal = document.getElementById('userManageModal');
    const musicManageModal = document.getElementById('musicManageModal');

    const closeAllSideModals = (exceptModal = null) => {
        [
            { modal: playlistModal, btnId: 'myPlaylistBtn' },
            { modal: favoritesModal, btnId: 'myFavoritesBtn' },
            { modal: historyModal, btnId: 'playHistoryBtn' },
            { modal: singerModal, btnId: null },
            { modal: userManageModal, btnId: null },
            { modal: musicManageModal, btnId: null }
        ].forEach(item => {
            const { modal, btnId } = item;
            if (modal && modal !== exceptModal && modal.style.display === 'flex') {
                modal.classList.remove('show');
                if (btnId) document.getElementById(btnId)?.classList.remove('active');
                setTimeout(() => {
                    modal.style.display = 'none';
                    if (!document.querySelector('.modal-mask.show')) {
                        toggleBodyScroll(false);
                    }
                }, 500);
            }
        });
    };
    
    window.closeAllSideModals = closeAllSideModals;

    document.getElementById('myPlaylistBtn')?.addEventListener('click', function() {
        if (playlistModal) {
            if (playlistModal.style.display === 'flex') {
                playlistModal.classList.remove('show');
                this.classList.remove('active');
                setTimeout(() => {
                    playlistModal.style.display = 'none';
                    toggleBodyScroll(false);
                }, 500);
            } else {
                closeAllSideModals(playlistModal);
                // 关闭设置弹窗
                if (settingsModal && settingsModal.style.display === 'flex') {
                    settingsModal.classList.remove('show');
                    setTimeout(() => { settingsModal.style.display = 'none'; }, 300);
                }
                playlistModal.style.display = 'flex';
                this.classList.add('active');
                setTimeout(() => playlistModal.classList.add('show'), 10);
                toggleBodyScroll(true);

                const iframe = playlistModal.querySelector('iframe');
                if (iframe && iframe.contentWindow && typeof iframe.contentWindow.updatePlayingStatus === 'function') {
                    iframe.contentWindow.updatePlayingStatus();
                }
            }
        }
    });

    document.getElementById('myFavoritesBtn')?.addEventListener('click', function() {
        if (favoritesModal) {
            if (favoritesModal.style.display === 'flex') {
                favoritesModal.classList.remove('show');
                this.classList.remove('active');
                setTimeout(() => {
                    favoritesModal.style.display = 'none';
                    toggleBodyScroll(false);
                }, 300);
            } else {
                closeAllSideModals(favoritesModal);
                if (settingsModal && settingsModal.style.display === 'flex') {
                    settingsModal.classList.remove('show');
                    setTimeout(() => { settingsModal.style.display = 'none'; }, 300);
                }
                favoritesModal.style.display = 'flex';
                this.classList.add('active');
                setTimeout(() => favoritesModal.classList.add('show'), 10);
                toggleBodyScroll(true);

                const iframe = favoritesModal.querySelector('iframe');
                if (iframe && iframe.contentWindow) {
                    if (typeof iframe.contentWindow.updatePlayingStatus === 'function') {
                        iframe.contentWindow.updatePlayingStatus();
                    }
                    if (typeof iframe.contentWindow.loadFromLocalStorage === 'function') {
                        iframe.contentWindow.loadFromLocalStorage();
                    }
                }
            }
        }
    });

    document.getElementById('playHistoryBtn')?.addEventListener('click', function() {
        if (historyModal) {
            if (historyModal.style.display === 'flex') {
                historyModal.classList.remove('show');
                this.classList.remove('active');
                setTimeout(() => {
                    historyModal.style.display = 'none';
                    toggleBodyScroll(false);
                }, 500);
            } else {
                closeAllSideModals(historyModal);
                if (settingsModal && settingsModal.style.display === 'flex') {
                    settingsModal.classList.remove('show');
                    setTimeout(() => { settingsModal.style.display = 'none'; }, 300);
                }
                historyModal.style.display = 'flex';
                this.classList.add('active');
                setTimeout(() => historyModal.classList.add('show'), 10);
                toggleBodyScroll(true);

                const iframe = historyModal.querySelector('iframe');
                if (iframe && iframe.contentWindow) {
                    if (typeof iframe.contentWindow.updatePlayingStatus === 'function') {
                        iframe.contentWindow.updatePlayingStatus();
                    }
                    if (typeof iframe.contentWindow.initHeartStatus === 'function') {
                        iframe.contentWindow.initHeartStatus();
                    }
                }
            }
        }
    });

    document.querySelectorAll('.play-btn-overlay, .card-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // 歌手页歌曲列表 (用于随机播放)
            const singerSongs = [
                { title: '夜曲', duration: SONG_DURATION_MAP['夜曲'] || '03:46', tag: '臻品母带' },
                { title: '晴天', duration: SONG_DURATION_MAP['晴天'] || '04:29', tag: '臻品母带' },
                { title: '搁浅', duration: SONG_DURATION_MAP['搁浅'] || '04:00', tag: '臻品母带' },
                { title: '花海', duration: SONG_DURATION_MAP['花海'] || '04:24', tag: '臻品母带' },
                { title: '七里香', duration: SONG_DURATION_MAP['七里香'] || '04:59', tag: '臻品母带' }
            ];
            
            // 随机选一首
            const randomSong = singerSongs[Math.floor(Math.random() * singerSongs.length)];
            const singerName = '周杰伦';
            
            // 调用全局播放函数
            if (typeof window.playSingleSong === 'function') {
                window.playSingleSong(randomSong.title, singerName, randomSong.duration, randomSong.tag);
                
                // 显示特别提示
                if (typeof window.showPlayerToast === 'function') {
                    window.showPlayerToast(`正在播放Jay的歌曲~`);
                }
            }
        });
    });

    [
        { modal: playlistModal, btn: 'closePlaylistBtn', sideBtn: 'myPlaylistBtn' },
        { modal: favoritesModal, btn: 'closeFavoritesBtn', sideBtn: 'myFavoritesBtn' },
        { modal: historyModal, btn: 'closeHistoryBtn', sideBtn: 'playHistoryBtn' }
    ].forEach(item => {
        if (item.modal) {
            const closeBtn = document.getElementById(item.btn);
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    item.modal.classList.remove('show');
                    document.getElementById(item.sideBtn)?.classList.remove('active');
                    setTimeout(() => {
                        item.modal.style.display = 'none';
                        toggleBodyScroll(false);
                    }, 500); // 等待动画结束
                });
            }
            item.modal.addEventListener('click', (e) => {
                if (e.target === item.modal) {
                    item.modal.classList.remove('show');
                    document.getElementById(item.sideBtn)?.classList.remove('active');
                    setTimeout(() => {
                        item.modal.style.display = 'none';
                        toggleBodyScroll(false);
                    }, 500);
                }
            });
        }
    });

    const totalTimeEl = document.getElementById('playerTotalTime');
    const prevBtn = document.getElementById('playerPrevBtn');
    const nextBtn = document.getElementById('playerNextBtn');
    const playlistBtn = document.getElementById('playerPlaylistBtn');
    
    // 更新全局播放状态类
    function updatePlaybackClass() {
        if (isPlaying) {
            document.body.classList.add('music-playing');
        } else {
            document.body.classList.remove('music-playing');
        }
    }
    
    const musicItems = Array.from(document.querySelectorAll('.music-item'));

    let toastTimer = null;
    window.showPlayerToast = function(message) {
        if (!toast) return;
        
        // 清除之前的定时器
        if (toastTimer) {
            clearTimeout(toastTimer);
        }
        
        toast.textContent = message;
        toast.classList.add('show');
        
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
            toastTimer = null;
        }, 2000);
    }

    // 更新播放器显示的歌曲信息
    function updatePlayerInfo(item) {
        if (!item) return;

        // 未登录拦截
        if (!localStorage.getItem('currentUser')) {
            if (typeof window.showPlayerToast === 'function') {
                window.showPlayerToast('请先右上角登录~');
            }
            return;
        }
        
        const musicTitleEl = item.querySelector('.music-title');
        const singer = item.querySelector('.music-singer').textContent.trim();
        
        // 获取纯净的标题（移除标签后的文本）
        let title = musicTitleEl.childNodes[0].textContent.trim();
        const durationStr = item.dataset.duration || SONG_DURATION_MAP[title] || '04:07';
        
        // 提取音质标签
        const tagEl = musicTitleEl.querySelector('.tag, .hq-tag');
        let tagText = 'HQ';
        
        if (tagEl) {
            tagText = tagEl.textContent.trim();
        }

        // 调用统一的播放函数
        if (typeof window.playSingleSong === 'function') {
            window.playSingleSong(title, singer, durationStr, tagText);
        }
    }

    // 更新进度条位置和时间
    function updateProgress() {
        if (!progressFill || !progressBar || !currentTimeEl) return;
        
        // 如果没有音频时长（例如退出登录或未加载），则重置为 0
        const duration = audio.duration || 0;
        const currentTime = audio.currentTime || 0;
        const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
        
        progressFill.style.width = `${percent}%`;
        progressBar.style.setProperty('--progress-pos', `${percent}%`);
        currentTimeEl.textContent = formatTime(currentTime);
    }

    // 音频元数据加载完成，更新总时长
    audio.onloadedmetadata = function() {
        if (playerTotalTime) {
            playerTotalTime.textContent = formatTime(audio.duration);
        }
    };

    // 音频播放位置更新
    audio.ontimeupdate = updateProgress;

    // 音频状态处理
    audio.onplay = () => {
        isPlaying = true;
        updatePlaybackClass();
        if (playIcon) playIcon.className = 'fa-solid fa-pause';
        if (playBtn) {
            playBtn.style.paddingLeft = '0px';
            playBtn.title = '暂停音乐';
        }
        
        // 通知所有相关的 iframe 更新图标
        setTimeout(() => {
            const modals = ['playlistModal', 'favoritesModal', 'historyModal'];
            modals.forEach(id => {
                const modal = document.getElementById(id);
                if (modal) {
                    const iframe = modal.querySelector('iframe');
                    if (iframe && iframe.contentWindow && typeof iframe.contentWindow.updatePlayingStatus === 'function') {
                        iframe.contentWindow.updatePlayingStatus();
                    }
                }
            });
        }, 100);
    };

    audio.onpause = () => {
        isPlaying = false;
        updatePlaybackClass();
        if (playIcon) playIcon.className = 'fa-solid fa-play';
        if (playBtn) {
            playBtn.style.paddingLeft = '2px';
            playBtn.title = '播放音乐';
        }

        // 通知所有相关的 iframe 更新图标
        setTimeout(() => {
            const modals = ['playlistModal', 'favoritesModal', 'historyModal'];
            modals.forEach(id => {
                const modal = document.getElementById(id);
                if (modal) {
                    const iframe = modal.querySelector('iframe');
                    if (iframe && iframe.contentWindow && typeof iframe.contentWindow.updatePlayingStatus === 'function') {
                        iframe.contentWindow.updatePlayingStatus();
                    }
                }
            });
        }, 100);
    };

    // 下一首
    function playNext() {
        const saved = localStorage.getItem('yjay_playlist');
        let playlist = saved ? JSON.parse(saved) : [];
        
        if (playlist.length === 0) {
            showPlayerToast('播放列表为空，无法切换歌曲');
            return;
        }

        if (playMode === 1) { // 随机播放
            const randomIndex = Math.floor(Math.random() * playlist.length);
            const song = playlist[randomIndex];
            window.playSingleSong(song.title, song.singer, song.duration, song.tag || 'HQ');
        } else {
            // 列表循环：将当前第一首移到末尾，播放新的第一首
            if (playlist.length > 1) {
                const currentSong = playlist.shift();
                playlist.push(currentSong);
                localStorage.setItem('yjay_playlist', JSON.stringify(playlist));
                
                const nextSong = playlist[0];
                window.playSingleSong(nextSong.title, nextSong.singer, nextSong.duration, nextSong.tag || 'HQ');
            } else {
                // 只有一首，直接播放
                const song = playlist[0];
                window.playSingleSong(song.title, song.singer, song.duration, song.tag || 'HQ');
            }
        }
    }

    // 上一首
    function playPrev() {
        const saved = localStorage.getItem('yjay_playlist');
        let playlist = saved ? JSON.parse(saved) : [];
        
        if (playlist.length === 0) {
            showPlayerToast('播放列表为空，无法切换歌曲');
            return;
        }

        if (playMode === 1) { // 随机播放
            const randomIndex = Math.floor(Math.random() * playlist.length);
            const song = playlist[randomIndex];
            window.playSingleSong(song.title, song.singer, song.duration, song.tag || 'HQ');
        } else {
            // 列表循环：播放最后一首（即逻辑上的上一首），playSingleSong 会自动将其移到第一位
            if (playlist.length > 1) {
                const prevSong = playlist[playlist.length - 1];
                window.playSingleSong(prevSong.title, prevSong.singer, prevSong.duration, prevSong.tag || 'HQ');
            } else {
                // 只有一首，直接播放
                const song = playlist[0];
                window.playSingleSong(song.title, song.singer, song.duration, song.tag || 'HQ');
            }
        }
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const playerSongTitle = document.getElementById('playerSongTitle');
            if (currentMusicIndex === -1 && (!playerSongTitle || playerSongTitle.textContent === '暂无歌曲 请手动添加~')) {
                showPlayerToast('请先选择一首歌曲播放~');
                return;
            }
            playPrev();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const playerSongTitle = document.getElementById('playerSongTitle');
            if (currentMusicIndex === -1 && (!playerSongTitle || playerSongTitle.textContent === '暂无歌曲 请手动添加~')) {
                showPlayerToast('请先选择一首歌曲播放~');
                return;
            }
            playNext();
        });
    }

    if (hidePlayerBtn && playerBar && showPlayerBtn) {
        hidePlayerBtn.addEventListener('click', () => {
            playerBar.classList.add('hidden');
            showPlayerBtn.classList.remove('active');
            showPlayerToast('已隐藏播放条');
        });

        showPlayerBtn.addEventListener('click', () => {
            const isHidden = playerBar.classList.contains('hidden');
            if (isHidden) {
                playerBar.classList.remove('hidden');
                showPlayerBtn.classList.add('active');
                showPlayerToast('已显示播放条');
            } else {
                playerBar.classList.add('hidden');
                showPlayerBtn.classList.remove('active');
                showPlayerToast('已隐藏播放条');
            }
        });
    }

    /**
     * =============================================================================
     * 模块：电梯导航逻辑 + 滑动指示器
     * =============================================================================
     */
    const navItems = document.querySelectorAll('.nav-item');
    const navIndicator = document.querySelector('.nav-indicator');
    const logoEl = document.querySelector('.logo');
    let isManualScrolling = false;

    /**
     * 更新滑动指示器位置到指定元素（始终计算位置确保丝滑过渡）
     * @param {HTMLElement} targetEl - 目标元素 (.logo 或 .nav-item)
     */
    function updateNavIndicator(targetEl) {
        if (!navIndicator || !targetEl) return;

        const wrapper = document.querySelector('.nav-wrapper');
        if (!wrapper) return;

        const wrapperRect = wrapper.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        const padding = 4;
        const left = targetRect.left - wrapperRect.left - padding;
        const width = targetRect.width + padding * 2;

        // 始终更新位置，保证从 Music → 标签的滑动动画丝滑
        navIndicator.style.left = left + 'px';
        navIndicator.style.width = width + 'px';

        const isLogo = targetEl === logoEl;

        if (isLogo) {
            // 在 Music：隐藏圈框，文字变红发光
            navIndicator.style.opacity = '0';
            logoEl.style.color = '#ff3333';
            logoEl.style.textShadow = 'none';
        } else {
            // 在导航项：显示圈框，logo 恢复白色
            navIndicator.style.opacity = '1';
            logoEl.style.color = '#fff';
            logoEl.style.textShadow = 'none';
        }
    }

    // 页面加载时指示器定位在 Music logo
    if (navIndicator && logoEl) {
        updateNavIndicator(logoEl);
    }

    // Music logo 点击置顶
    if (logoEl) {
        logoEl.style.cursor = 'pointer';
        logoEl.addEventListener('click', function() {
            isManualScrolling = true;
            navItems.forEach(nav => nav.classList.remove('active'));
            updateNavIndicator(logoEl);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => { isManualScrolling = false; }, 600);
        });
    }

    navItems.forEach(item => {
        // 点击：锁定指示器
        item.addEventListener('click', function(e) {
            const targetId = this.getAttribute('data-target');
            if (!targetId) return;

            e.preventDefault();
            isManualScrolling = true;

            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // 滑动指示器跟随点击
            updateNavIndicator(this);

            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                const offset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - offset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }

            let scrollEndTimer;
            const onScroll = () => {
                clearTimeout(scrollEndTimer);
                scrollEndTimer = setTimeout(() => {
                    window.removeEventListener('scroll', onScroll);
                    isManualScrolling = false;
                }, 100);
            };
            window.addEventListener('scroll', onScroll);
        });

        // 悬浮：指示器预览跟随
        item.addEventListener('mouseenter', function() {
            updateNavIndicator(this);
        });

        // 离开：指示器回到当前激活项或 logo
        item.addEventListener('mouseleave', function() {
            const activeItem = document.querySelector('.nav-item.active');
            if (activeItem) {
                updateNavIndicator(activeItem);
            } else if (logoEl) {
                updateNavIndicator(logoEl);
            }
        });
    });

    /** 滚动监听：更新导航激活状态 */
    function updateNavActive() {
        if (isManualScrolling) return;

        let current = 'home-tab';
        const offset = 120;
        const isBottom = (window.innerHeight + window.pageYOffset) >= document.documentElement.scrollHeight - 50;

        if (isBottom) {
            const validTargets = Array.from(navItems).filter(item => {
                const tid = item.getAttribute('data-target');
                return tid && tid !== 'home-tab';
            });
            if (validTargets.length > 0) {
                current = validTargets[validTargets.length - 1].getAttribute('data-target');
            }
        } else {
            navItems.forEach(item => {
                const targetId = item.getAttribute('data-target');
                if (!targetId || targetId === 'home-tab') return;

                const section = document.getElementById(targetId);
                if (section) {
                    const sectionTop = section.getBoundingClientRect().top + window.pageYOffset;
                    if (window.pageYOffset >= sectionTop - offset) {
                            current = targetId;
                        }
                    }
                });
            }

        // 页面在顶部：清除所有激活，指示器回 Music
        if (window.pageYOffset < 200) {
            navItems.forEach(item => item.classList.remove('active'));
            if (logoEl) updateNavIndicator(logoEl);
        } else {
            navItems.forEach(item => {
                const wasActive = item.classList.contains('active');
                item.classList.remove('active');
                if (item.getAttribute('data-target') === current) {
                    item.classList.add('active');
                    if (!wasActive) {
                        updateNavIndicator(item);
                    }
                }
            });
        }
    }

    window.addEventListener('scroll', throttle(updateNavActive, 100), { passive: true });
    // 尾随 debounce：滚动停止 150ms 后再次确认导航状态，解决快速滚动到底部时导航不更新问题
    window.addEventListener('scroll', debounce(updateNavActive, 150), { passive: true });

    window.dispatchEvent(new Event('scroll'));

    const playModes = [
        { icon: 'fa-solid fa-repeat', text: '列表循环' },
        { icon: 'fa-solid fa-shuffle', text: '随机播放' }
    ];

    if (playModeBtn) {
        playModeBtn.addEventListener('click', () => {
            playMode = (playMode + 1) % playModes.length;
            const mode = playModes[playMode];
            
            // 更新图标和标题
            playModeBtn.className = `${mode.icon} control-btn`;
            playModeBtn.title = mode.text;
            
            showPlayerToast(`已切换为：${mode.text}`);
        });
    }

    if (playlistBtn) {
        playlistBtn.addEventListener('click', () => {
            const playlistBtnTop = document.getElementById('myPlaylistBtn');
            if (playlistBtnTop) playlistBtnTop.click();
        });
    }

    // 暴露给 iframe 调用的函数：更新播放条收藏图标状态 (新增全局同步逻辑)
    window.updatePlayerHeartStatus = function(isActive, title, singer) {
        const heartIconBtn = document.getElementById('playerHeartIcon');
        const playerSongTitle = document.getElementById('playerSongTitle');
        
        // 1. 同步底部播放条状态
        if (playerSongTitle && heartIconBtn) {
            const fullTitle = playerSongTitle.textContent.trim();
            const parts = fullTitle.split(' - ');
            const currentTitle = parts[0] || '';
            const currentSinger = parts[1] || '';
            
            if (currentTitle === title && currentSinger === singer) {
                if (isActive) {
                    heartIconBtn.classList.add('active');
                } else {
                    heartIconBtn.classList.remove('active');
                }
            }
        }

        // 2. 同步所有 iframe 中的爱心状态 (artistpage.html, favorite.html 等)
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                if (iframe.contentWindow && typeof iframe.contentWindow.updateHeartUI === 'function') {
                    iframe.contentWindow.updateHeartUI(isActive, title, singer);
                }
            } catch (e) {
                // 跨域或未加载完成时忽略
            }
        });
    };

    if (heartIcon) {
        // 初始化当前播放歌曲的收藏状态
        const initPlayerHeartStatus = () => {
            const saved = localStorage.getItem('yjay_favorites');
            if (saved) {
                const favorites = JSON.parse(saved);
                const playerSongTitle = document.getElementById('playerSongTitle');
                if (playerSongTitle) {
                    const fullTitle = playerSongTitle.textContent.trim();
                    const parts = fullTitle.split(' - ');
                    const title = parts[0] || '';
                    const singer = parts[1] || '';
                    const isFav = favorites.some(f => f.title === title && f.singer === singer);
                    if (isFav) {
                        heartIcon.classList.add('active');
                    } else {
                        heartIcon.classList.remove('active');
                    }
                }
            }
        };
        initPlayerHeartStatus();

        heartIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            const isActive = !this.classList.contains('active');
            this.classList.toggle('active');
            
            // 获取当前播放歌曲信息
            const playerSongTitle = document.getElementById('playerSongTitle');
            const playerTotalTime = document.getElementById('playerTotalTime');
            
            if (playerSongTitle) {
                const fullTitle = playerSongTitle.textContent.trim();
                // 假设标题格式为 "歌名 - 歌手"
                const parts = fullTitle.split(' - ');
                const title = parts[0] || '未知歌曲';
                const singer = parts[1] || '未知歌手';
                const duration = playerTotalTime ? playerTotalTime.textContent : '00:00';
                
                // 调用全局 toggleFavorite 函数同步到收藏列表 iframe
                if (typeof window.toggleFavorite === 'function') {
                    window.toggleFavorite(isActive, {
                        title: title,
                        singer: singer,
                        duration: duration
                    });
                }

                // 新增：同步状态到所有 iframe (如 artistpage.html)
                if (typeof window.updatePlayerHeartStatus === 'function') {
                    window.updatePlayerHeartStatus(isActive, title, singer);
                }
            }
            
            showPlayerToast(this.classList.contains('active') ? '已收藏该歌曲' : '已取消收藏');
        });
    }

    /**
     * =============================================================================
     * 模块：单曲播放逻辑 (公开给 iframe 调用)
     * =============================================================================
     */
    window.playSingleSong = function(title, singer, durationStr, tag, shouldPlay = true, silent = false) {
        // 未登录拦截 (初始化加载时不拦截)
        if (shouldPlay && !localStorage.getItem('currentUser')) {
            if (typeof window.showPlayerToast === 'function') {
                window.showPlayerToast('请先右上角登录~');
            } else {
                alert('请先右上角登录~');
            }
            return;
        }

        const playerTitle = document.getElementById('playerSongTitle');

        // 检查是否正在播放同一首歌
        if (playerTitle && playerTitle.textContent === `${title} - ${singer}`) {
            const currentSrc = decodeURIComponent(audio.src || '');
            const isSameSrc = currentSrc.includes(title);
            
            if (shouldPlay && !audio.ended && isSameSrc) {
                if (!silent && typeof window.showPlayerToast === 'function') {
                    window.showPlayerToast('当前正在播放该歌曲');
                }
                return;
            }
        }

        const playerBar = document.querySelector('.player-bar');
        const showPlayerBtn = document.getElementById('playerShowBtn');
        const playerTotalTime = document.getElementById('playerTotalTime');
        const playerTag = document.querySelector('.player-right .hq-tag');
        const playerHeartIcon = document.getElementById('playerHeartIcon');
        
        if (playerTitle) playerTitle.textContent = `${title} - ${singer}`;
        if (playerTotalTime && durationStr) playerTotalTime.textContent = durationStr;
        
        localStorage.setItem('yjay_last_played', JSON.stringify({
            title: title,
            singer: singer,
            duration: durationStr,
            tag: tag
        }));
        
        if (playerHeartIcon) playerHeartIcon.style.display = 'inline-block';
        if (playerTag) playerTag.style.display = 'inline-block';

        if (shouldPlay) {
            const audioSrc = `music/${title}.mp3`;
            audio.src = audioSrc;
            audio.currentTime = 0;
            audio.play().catch(() => {});
        }
        
        const saved = localStorage.getItem('yjay_playlist');
        let playlist = saved ? JSON.parse(saved) : [];
        const playlistIndex = playlist.findIndex(s => s.title === title && s.singer === singer);
        
        if (playlistIndex === -1) {
            if (shouldPlay) {
                playlist.unshift({
                    title: title,
                    singer: singer,
                    duration: durationStr || SONG_DURATION_MAP[title] || '04:00',
                    tag: tag || 'HQ'
                });
                localStorage.setItem('yjay_playlist', JSON.stringify(playlist));
                currentMusicIndex = 0; 
                
                const playlistIframe = document.querySelector('#playlistModal iframe');
                if (playlistIframe && playlistIframe.contentWindow && typeof playlistIframe.contentWindow.loadFromLocalStorage === 'function') {
                    playlistIframe.contentWindow.loadFromLocalStorage(true);
                }
            }
        } else {
            if (shouldPlay) {
                const [playingSong] = playlist.splice(playlistIndex, 1);
                playlist.unshift(playingSong);
                localStorage.setItem('yjay_playlist', JSON.stringify(playlist));
                currentMusicIndex = 0;

                const playlistIframe = document.querySelector('#playlistModal iframe');
                if (playlistIframe && playlistIframe.contentWindow && typeof playlistIframe.contentWindow.loadFromLocalStorage === 'function') {
                    playlistIframe.contentWindow.loadFromLocalStorage(true);
                }
            } else {
                currentMusicIndex = playlistIndex;
            }
        }
        
        if (playerTag && tag) {
            playerTag.textContent = tag;
            playerTag.style.display = 'inline-block';
            playerTag.className = 'hq-tag';
            
            if (tag === '臻品母带') {
                playerTag.classList.add('tag-zhen');
            } else if (tag === '全景声') {
                playerTag.classList.add('tag-quan');
            } else if (tag === 'Hi-Res' || tag === '臻品Hi-Res') {
                playerTag.classList.add('tag-hires');
            }
        }
        
        if (progressFill) progressFill.style.width = '0%';
        if (progressBar) progressBar.style.setProperty('--progress-pos', '0%');
        if (currentTimeEl) currentTimeEl.textContent = '00:00';
        updateProgress();
        
        if (shouldPlay) {
            isPlaying = true;
            updatePlaybackClass();
            if (playIcon) playIcon.className = 'fa-solid fa-pause';
            if (playBtn) playBtn.style.paddingLeft = '0px';
            
            if (playerBar && playerBar.classList.contains('hidden')) {
                playerBar.classList.remove('hidden');
                if (showPlayerBtn) showPlayerBtn.classList.add('active');
            }

            if (!silent && typeof window.showPlayerToast === 'function') {
                window.showPlayerToast(`开始播放: ${title}`);
            }

            if (typeof window.syncToHistory === 'function') {
                window.syncToHistory(title, singer, durationStr);
            }
        }
        
        if (playerHeartIcon) {
            playerHeartIcon.style.display = 'inline-block';
            const savedFavorites = localStorage.getItem('yjay_favorites');
            let isFavorite = false;
            if (savedFavorites) {
                const favorites = JSON.parse(savedFavorites);
                isFavorite = favorites.some(f => f.title === title && f.singer === singer);
            }
            
            if (isFavorite) {
                playerHeartIcon.classList.add('active');
            } else {
                playerHeartIcon.classList.remove('active');
            }
        }
    };

    function formatTime(s) {
        return `${Math.floor(s/60).toString().padStart(2,'0')}:${Math.floor(s%60).toString().padStart(2,'0')}`;
    }

    // 停止所有音乐播放并重置播放器状态
    window.stopGlobalMusic = function() {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            // 确保 src 也被清除，防止重新登录后误点播放
            audio.src = '';
            audio.load();
        }
        isPlaying = false;
        currentMusicIndex = -1;
        
        // 强制重置进度条 UI，不依赖 updateProgress 的逻辑
        if (progressFill) progressFill.style.width = '0%';
        if (progressBar) progressBar.style.setProperty('--progress-pos', '0%');
        if (currentTimeEl) currentTimeEl.textContent = '00:00';
        
        updatePlaybackClass();
        
        // 重置其他 UI 元素
        const playerTitle = document.getElementById('playerSongTitle');
        const playerTotalTime = document.getElementById('playerTotalTime');
        const playerHeartIcon = document.getElementById('playerHeartIcon');
        const playerTag = document.querySelector('.player-right .hq-tag');
        const playIcon = document.querySelector('#playerPlayBtn i');
        
        if (playerTitle) playerTitle.textContent = '暂无歌曲 请手动添加~';
        if (playerTotalTime) playerTotalTime.textContent = '00:00';
        if (playerHeartIcon) playerHeartIcon.style.display = 'none';
        if (playerTag) playerTag.style.display = 'none';
        if (playIcon) {
            playIcon.className = 'fa-solid fa-play';
            const playBtn = document.getElementById('playerPlayBtn');
            if (playBtn) {
                playBtn.style.paddingLeft = '2px';
                playBtn.title = '播放音乐';
            }
        }
        
        // 清除本地存储的最后播放记录
        localStorage.removeItem('yjay_last_played');
    };

    // 统一的播放/暂停切换逻辑
    window.toggleAudioPlay = function() {
        const playerSongTitle = document.getElementById('playerSongTitle');
        if (currentMusicIndex === -1 && (!playerSongTitle || playerSongTitle.textContent === '暂无歌曲 请手动添加~')) {
            showPlayerToast('请先选择一首歌曲播放~');
            return;
        }
        
        if (!audio.src || audio.src === window.location.href || audio.src.endsWith('/')) {
            // 如果还没有音频源，尝试根据左边的歌名直接加载并播放
            if (playerSongTitle && playerSongTitle.textContent !== '暂无歌曲 请手动添加~') {
                const fullTitle = playerSongTitle.textContent.trim();
                const parts = fullTitle.split(' - ');
                const title = parts[0];
                const singer = parts[1];
                
                // 获取当前进度条中的总时长
                const duration = document.getElementById('playerTotalTime').textContent;
                
                // 直接播放
                window.playSingleSong(title, singer, duration, 'HQ');
                return;
            }
            showPlayerToast('请先选择一首歌曲播放~');
            return;
        }
        
        if (audio.paused) {
            audio.play().catch(err => {
                showPlayerToast('播放失败，请检查音频文件是否存在');
            });
        } else {
            audio.pause();
        }
    };

    if (playBtn && playIcon) {
        playBtn.addEventListener('click', () => {
            window.toggleAudioPlay();
        });
    }

    if (progressBar) {
        let isDragging = false;

        const handleSeek = (e) => {
            const rect = progressBar.getBoundingClientRect();
            let percent = (e.clientX - rect.left) / rect.width;
            percent = Math.max(0, Math.min(1, percent));
            
            if (audio.duration) {
                audio.currentTime = percent * audio.duration;
                updateProgress();
            }
        };

        progressBar.addEventListener('mousedown', (e) => {
            const playerSongTitle = document.getElementById('playerSongTitle');
            if (currentMusicIndex === -1 && (!playerSongTitle || playerSongTitle.textContent === '暂无歌曲 请手动添加~')) {
                return;
            }
            isDragging = true;
            handleSeek(e);
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                handleSeek(e);
            }
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        progressBar.addEventListener('touchstart', (e) => {
            const playerSongTitle = document.getElementById('playerSongTitle');
            if (currentMusicIndex === -1 && (!playerSongTitle || playerSongTitle.textContent === '暂无歌曲 请手动添加~')) {
                return;
            }
            isDragging = true;
            handleSeek(e.touches[0]);
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (isDragging) {
                handleSeek(e.touches[0]);
            }
        }, { passive: false });

        window.addEventListener('touchend', () => {
            isDragging = false;
        });
    }

    if (volumeBtn && volumePanel) {
        volumeBtn.addEventListener('click', (e) => { e.stopPropagation(); volumePanel.classList.toggle('show'); });
    }
    document.addEventListener('click', () => volumePanel?.classList.remove('show'));
    volumePanel?.addEventListener('click', (e) => e.stopPropagation());

    function updateVolume(e) {
        if (!volumeSlider || !volumeProgress || !volumeDot || !volumeBtn) return;
        const rect = volumeSlider.getBoundingClientRect();
        let clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
        let percent = Math.max(0, Math.min(1, (rect.bottom - clientY) / rect.height));
        const vol = Math.round(percent * 100);
        
        audio.volume = percent;
        
        volumeProgress.style.height = `${vol}%`;
        volumeDot.style.bottom = `${vol}%`;
        volumeBtn.className = `fa-solid fa-volume-${vol === 0 ? 'off' : vol < 50 ? 'low' : 'high'} control-btn`;
    }

    let isDraggingVolume = false;
    if (volumeSlider) {
        volumeSlider.addEventListener('mousedown', (e) => { isDraggingVolume = true; updateVolume(e); });
        document.addEventListener('mousemove', (e) => { if (isDraggingVolume) updateVolume(e); });
        document.addEventListener('mouseup', () => isDraggingVolume = false);
    }

    // 使用事件委托处理动态生成的 .music-item 点击（包括热门/排行等区域）
    document.getElementById('hotMusicGrid')?.addEventListener('click', function(e) {
        // 向上查找最近的 .music-item 和 .play-btn
        const playBtn = e.target.closest('.play-btn');
        if (!playBtn) return;
        const musicItem = playBtn.closest('.music-item');
        if (!musicItem) return;
        e.stopPropagation();
        updatePlayerInfo(musicItem);
    });

    // 兼容其他可能动态生成 .music-item 的容器（如无则忽略）
    document.querySelectorAll('.music-grid, .music-container').forEach(function(container) {
        if (container.id === 'hotMusicGrid') return; // 上面已处理
        container.addEventListener('click', function(e) {
            const playBtn = e.target.closest('.play-btn');
            if (!playBtn) return;
            const musicItem = playBtn.closest('.music-item');
            if (!musicItem) return;
            e.stopPropagation();
            updatePlayerInfo(musicItem);
        });
    });

    /**
     * =============================================================================
     * 模块：专辑详情弹窗逻辑
     * =============================================================================
     */
    // ======================== 专辑加载 & 购买 ========================
    function loadAlbums() {
        var list = document.getElementById('albumList');
        if (!list) return;
        fetch('/api/albums')
            .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
            .catch(function() { return fetch('/albums').then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); })
            .then(function(albums) {
                if (!Array.isArray(albums) || albums.length === 0) {
                    list.innerHTML = '<div style="width:100%;text-align:center;color:rgba(255,255,255,0.4);padding:40px;">暂无专辑</div>';
                    return;
                }
                // 只展示用户选中的专辑
                var shownIds = JSON.parse(localStorage.getItem('shownAlbumIds') || '[]');
                albums = albums.filter(function(a) { return shownIds.indexOf(a.id) !== -1; });
                var html = '';
                albums.forEach(function(a, i) {
                    var imgPath = a.albumImagePath || a.album_image_path || '';
                    if (imgPath && imgPath.indexOf('../') === 0) imgPath = '.' + imgPath.substring(2);
                    html += '<div class="album-card reveal active delay-' + ((i % 5 + 1) * 100) + '">';
                    html += '<img src="' + imgPath + '" alt="' + escHtml(a.albumName || a.album_name || '') + '" class="album-cover" loading="lazy">';
                    html += '<div class="album-title">' + escHtml(a.albumName || a.album_name || '') + '</div>';
                    html += '<div class="album-artist">' + escHtml(a.singerName || a.singer_name || '') + '</div>';
                    html += '<div class="album-price">¥' + (a.price != null ? a.price : '0.00') + '</div>';
                    html += '<button class="buy-btn" data-album="' + escHtml(a.albumName || a.album_name || '') + '"><i class="fas fa-shopping-cart"></i> 点击购买</button>';
                    html += '</div>';
                });
                list.innerHTML = html;
                // 检查当前用户已购买专辑
                var buyer = localStorage.getItem('currentUser') || '匿名用户';
                var boughtAlbums = [];
                fetch('/api/purchases?buyer=' + encodeURIComponent(buyer))
                    .then(function(r) { return r.ok ? r.json() : []; })
                    .catch(function() { return fetch('/purchases?buyer=' + encodeURIComponent(buyer)).then(function(r) { return r.ok ? r.json() : []; }).catch(function() { return []; }); })
                    .then(function(purchases) {
                        if (Array.isArray(purchases)) purchases.forEach(function(p) { boughtAlbums.push(p.albumName || p.album_name); });
                        list.querySelectorAll('.buy-btn').forEach(function(btn) {
                            var albumName = btn.getAttribute('data-album');
                            if (boughtAlbums.indexOf(albumName) !== -1) {
                                btn.innerHTML = '<i class="fas fa-check"></i> 已购买';
                                btn.disabled = true;
                            }
                            btn.addEventListener('click', function() {
                                if (this.disabled) return;
                                var name = this.getAttribute('data-album');
                                fetch('/api/purchases', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ albumName: name, buyerName: buyer, quantity: 1 }) })
                                    .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                                    .catch(function() { return fetch('/purchases', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ albumName: name, buyerName: buyer, quantity: 1 }) }).then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); })
                                    .then(function() { showPlayerToast('已购买专辑：' + name); btn.innerHTML = '<i class="fas fa-check"></i> 已购买'; btn.disabled = true; })
                                    .catch(function() { showPlayerToast('购买失败，请重试'); });
                            });
                        });
                    });
            })
            .catch(function() { list.innerHTML = '<div style="width:100%;text-align:center;color:rgba(255,255,255,0.4);padding:40px;">加载失败</div>'; });
    }

    loadAlbums();

    // 记录已随机播放过的歌曲索引
    let playedRandomIndices = [];

    // 音频播放结束后的处理
    audio.onended = function() {
        // 读取播放列表
        const saved = localStorage.getItem('yjay_playlist');
        const playlist = saved ? JSON.parse(saved) : [];
        
        if (playlist.length === 0) return;

        if (playMode === 1) {
            // 随机播放逻辑：确保不重复
            if (playedRandomIndices.length >= playlist.length) {
                playedRandomIndices = []; // 所有歌都放过了，重置
            }

            // 如果当前播放的歌曲还在列表里，记录它的索引
            const playerTitle = document.getElementById('playerSongTitle');
            if (playerTitle) {
                const fullTitle = playerTitle.textContent.trim();
                const currentIndex = playlist.findIndex(s => `${s.title} - ${s.singer}` === fullTitle);
                if (currentIndex !== -1 && !playedRandomIndices.includes(currentIndex)) {
                    playedRandomIndices.push(currentIndex);
                }
            }

            // 如果全部播完了，重置
            if (playedRandomIndices.length >= playlist.length) {
                playedRandomIndices = [];
            }

            let nextIndex;
            // 只有一首歌时直接选，多首歌时避开已播放的
            if (playlist.length <= 1) {
                nextIndex = 0;
            } else {
                do {
                    nextIndex = Math.floor(Math.random() * playlist.length);
                } while (playedRandomIndices.includes(nextIndex));
            }

            playedRandomIndices.push(nextIndex);
            const song = playlist[nextIndex];
            window.playSingleSong(song.title, song.singer, song.duration, song.tag || 'HQ');
        } else {
            // 列表循环：根据用户要求，播放条始终在第一首，播放完后将第二首变为第一首
            if (playlist.length > 1) {
                // 将当前播放完的第一首移到末尾
                const finishedSong = playlist.shift();
                playlist.push(finishedSong);
                localStorage.setItem('yjay_playlist', JSON.stringify(playlist));
                
                // 播放现在处于第一首的歌曲（即原来的第二首）
                const nextSong = playlist[0];
                window.playSingleSong(nextSong.title, nextSong.singer, nextSong.duration, nextSong.tag || 'HQ');
            } else if (playlist.length === 1) {
                // 只有一首歌，直接重播
                const song = playlist[0];
                window.playSingleSong(song.title, song.singer, song.duration, song.tag || 'HQ');
            }
        }
    };

    /**
     * =============================================================================
     * 模块：歌手详情弹窗
     * =============================================================================
     */
    const closeSingerBtn = document.getElementById('closeSingerBtn');

    if (closeSingerBtn && singerModal) {
        const closeSinger = () => {
            singerModal.classList.remove('show');
            setTimeout(() => singerModal.style.display = 'none', 300);
            toggleBodyScroll(false);
        };
        closeSingerBtn.addEventListener('click', closeSinger);
        singerModal.addEventListener('click', (e) => {
            if (e.target === singerModal) closeSinger();
        });
    }

    /**
     * =============================================================================
     * 模块：初始化播放器
     * 功能：从 localStorage 恢复播放状态，确保刷新页面后内容不丢失
     * =============================================================================
     */
    function initPlayerFromPlaylist() {
        // 不再强制清除数据，实现刷新后内容持久化
        // localStorage.removeItem('yjay_playlist');
        // localStorage.removeItem('yjay_favorites');
        // localStorage.removeItem('yjay_played');
        // localStorage.removeItem('yjay_last_played');
        
        const playerTitle = document.getElementById('playerSongTitle');
        const playerTotalTime = document.getElementById('playerTotalTime');
        const heartIcon = document.getElementById('playerHeartIcon');
        const playerTag = document.querySelector('.player-right .hq-tag');

        // 尝试从本地存储恢复最后播放的歌曲信息
        const lastPlayed = JSON.parse(localStorage.getItem('yjay_last_played'));
        
        if (lastPlayed && lastPlayed.title) {
            if (playerTitle) playerTitle.textContent = lastPlayed.title;
            if (playerTotalTime) playerTotalTime.textContent = lastPlayed.duration || '00:00';
            if (heartIcon) heartIcon.style.display = 'inline-block';
            if (playerTag) {
                playerTag.style.display = 'inline-block';
                playerTag.textContent = lastPlayed.tag || 'HQ';
            }
            
            // 检查这首歌是否在收藏夹中，以更新红心状态
            const favorites = JSON.parse(localStorage.getItem('yjay_favorites')) || [];
            const isFav = favorites.some(f => f.title === lastPlayed.title);
            if (heartIcon) {
                heartIcon.classList.toggle('active', isFav);
                heartIcon.style.color = isFav ? '#ff4d4f' : '';
            }
        } else {
            if (playerTitle) playerTitle.textContent = '暂无歌曲 请手动添加~';
            if (playerTotalTime) playerTotalTime.textContent = '00:00';
            if (heartIcon) heartIcon.style.display = 'none';
            if (playerTag) playerTag.style.display = 'none';
        }
        
        // 恢复当前播放索引
        const playlist = JSON.parse(localStorage.getItem('yjay_playlist')) || [];
        if (lastPlayed) {
            currentMusicIndex = playlist.findIndex(s => s.title === lastPlayed.title);
        } else {
            currentMusicIndex = -1;
        }

        // 通知所有可能存在的 iframe 更新（如果它们已经加载）
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            if (iframe.contentWindow && typeof iframe.contentWindow.loadFromLocalStorage === 'function') {
                iframe.contentWindow.loadFromLocalStorage();
            }
        });
    }
    
    // 执行初始化
    initPlayerFromPlaylist();
})();

// ======================== 顶部导航搜索下拉 ========================
(function() {
    var searchInput = document.getElementById('navSearchInput');
    var searchDropdown = document.getElementById('navSearchDropdown');
    var searchBox = document.getElementById('navSearchBox');
    if (!searchInput || !searchDropdown) return;

    var allSongs = [];
    var debounceTimer;

    // 从API加载歌曲数据
    function loadSongs() {
        fetch('/api/music?size=200').then(function(r) { return r.json(); }).then(function(data) {
            var songs = Array.isArray(data) ? data : (data.records || []);
            allSongs = songs.map(function(s) { return { title: s.musicName, singer: s.singerName }; });
        }).catch(function() {});
    }
    loadSongs();

    // 判断是否为当前播放歌曲
    function isCurrentlyPlaying(title, singer) {
        var el = document.getElementById('playerSongTitle');
        if (!el) return false;
        var txt = el.textContent.trim();
        if (txt === '暂无歌曲 请手动添加~') return false;
        var parts = txt.split(' - ');
        return parts[0] === title && parts[1] === singer;
    }

    // 判断全局是否暂停
    function isAudioPaused() {
        return window.audio && window.audio.paused;
    }

    function renderResults(matches) {
        if (!matches.length) {
            searchDropdown.innerHTML = '<div style="padding:16px;color:rgba(255,255,255,0.4);text-align:center;font-size:13px;">暂无匹配歌曲</div>';
            searchDropdown.classList.add('show');
            return;
        }
        searchDropdown.innerHTML = matches.slice(0, 10).map(function(s) {
            var playing = isCurrentlyPlaying(s.title, s.singer);
            var icon = playing && !isAudioPaused() ? 'fa-pause' : 'fa-play';
            var cls = playing ? 'search-result-play playing' : 'search-result-play';
            return '<div class="search-result-item" data-title="' + s.title.replace(/"/g,'&quot;') + '" data-singer="' + s.singer.replace(/"/g,'&quot;') + '">' +
                '<div class="search-result-info">' +
                    '<div class="search-result-title">' + s.title + '</div>' +
                    '<div class="search-result-singer">' + s.singer + '</div>' +
                '</div>' +
                '<button class="' + cls + '" title="播放"><i class="fa-solid ' + icon + '"></i></button>' +
            '</div>';
        }).join('');
        searchDropdown.classList.add('show');

        // 播放/暂停按钮事件
        searchDropdown.querySelectorAll('.search-result-play').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var item = this.closest('.search-result-item');
                var title = item.getAttribute('data-title');
                var singer = item.getAttribute('data-singer');
                if (isCurrentlyPlaying(title, singer)) {
                    // 正在播放 → 切换暂停
                    if (window.toggleAudioPlay) window.toggleAudioPlay();
                    // 刷新图标
                    setTimeout(function() { renderResults(matches); }, 100);
                } else {
                    if (typeof window.playSingleSong === 'function') {
                        window.playSingleSong(title, singer, '04:00', 'HQ');
                        setTimeout(function() { renderResults(matches); }, 100);
                    }
                }
            });
        });

        // 点击行播放
        searchDropdown.querySelectorAll('.search-result-item').forEach(function(item) {
            item.addEventListener('click', function() {
                var title = this.getAttribute('data-title');
                var singer = this.getAttribute('data-singer');
                if (isCurrentlyPlaying(title, singer)) {
                    if (window.toggleAudioPlay) window.toggleAudioPlay();
                    setTimeout(function() { renderResults(matches); }, 100);
                } else {
                    if (typeof window.playSingleSong === 'function') {
                        window.playSingleSong(title, singer, '04:00', 'HQ');
                        setTimeout(function() { renderResults(matches); }, 100);
                    }
                }
            });
        });
    }

    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        var val = this.value.trim();
        if (!val) { searchDropdown.classList.remove('show'); return; }
        debounceTimer = setTimeout(function() {
            var kw = val.toLowerCase();
            var matches = allSongs.filter(function(s) {
                return s.title.toLowerCase().includes(kw) || s.singer.toLowerCase().includes(kw);
            });
            renderResults(matches);
        }, 200);
    });

    searchInput.addEventListener('focus', function() {
        if (this.value.trim() && searchDropdown.innerHTML) searchDropdown.classList.add('show');
    });

    // 搜索按钮
    var searchBtn = document.getElementById('navSearchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            var val = searchInput.value.trim();
            if (!val) return;
            var kw = val.toLowerCase();
            var matches = allSongs.filter(function(s) {
                return s.title.toLowerCase().includes(kw) || s.singer.toLowerCase().includes(kw);
            });
            renderResults(matches);
        });
    }

    // 点击外部关闭
    document.addEventListener('click', function(e) {
        if (!searchBox.contains(e.target)) searchDropdown.classList.remove('show');
    });
})();




