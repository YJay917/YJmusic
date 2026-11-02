/**
 * 专辑详情页逻辑 - 与歌手详情页（artistpage.js）同一套交互：
 *   从 URL 参数拿专辑名/封面 -> 加载专辑信息（价格、歌手）-> 检查当前用户是否已购买
 *   -> 已购买：展示并加载专辑歌曲（按专辑歌手匹配）；未购买：显示购买遮罩，购买后解锁。
 * 歌曲、专辑在数据库中没有外键关联，这里按「专辑的歌手名」匹配该歌手的全部歌曲。
 */
(function() {

// 从 URL 参数获取专辑名 / 封面 / 歌手
var params = new URLSearchParams(window.location.search);
var albumName = params.get('album') || '';
var imgFromUrl = params.get('img') || '';
var singerFromUrl = params.get('singer') || '';

// 专辑信息（接口加载后填充）
var albumInfo = { name: albumName, singer: singerFromUrl, price: null, cover: imgFromUrl };

// 分页相关
var allSongs = [];
var currentPage = 1;
var pageSize = 5;

function escHtml(s) {
    s = s || '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDuration(value) {
    // 时长来自数据库的 "mm:ss" 字符串（MP3 帧头解析入库）；
    // 纯数字视为旧的「秒」格式，兜底兼容；缺失/非法返回 00:00
    if (typeof value === 'string' && value.indexOf(':') !== -1) return value;
    var n = Number(value);
    if (!isFinite(n) || n <= 0) return '00:00';
    var m = Math.floor(n / 60);
    var s = Math.floor(n % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

/** 当前登录用户（与父页面购买逻辑取值方式一致） */
function getBuyer() {
    return (localStorage.getItem('currentUser') || '匿名用户').trim() || '匿名用户';
}

/* ---------------- 头部信息 ---------------- */

function loadAlbumInfo() {
    var nameEl = document.getElementById('albumName');
    if (albumName) {
        if (nameEl) nameEl.textContent = albumName;
        document.title = albumName;
    }

    fetch('/api/albums')
        .then(function(r) { return r.ok ? r.json() : []; })
        .then(function(albums) {
            if (!Array.isArray(albums)) return;
            var album = albums.find(function(a) {
                return (a.albumName || a.album_name) === albumName;
            });
            if (!album) return;
            albumInfo.singer = album.singerName || album.singer_name || albumInfo.singer;
            albumInfo.price = album.price != null ? album.price : albumInfo.price;
            albumInfo.cover = album.albumImagePath || album.album_image_path || albumInfo.cover;
            renderHeader();
            // 歌手信息到位后（重新）检查购买状态并加载歌曲
            checkPurchased();
        })
        .catch(function() { renderHeader(); checkPurchased(); });
}

function renderHeader() {
    var nameEl = document.getElementById('albumName');
    if (nameEl && albumInfo.name) {
        nameEl.textContent = albumInfo.name;
        document.title = albumInfo.name;
    }
    var singerEl = document.getElementById('statSinger');
    if (singerEl) singerEl.textContent = albumInfo.singer || '—';
    var priceEl = document.getElementById('statPrice');
    if (priceEl) priceEl.textContent = albumInfo.price != null ? ('¥' + albumInfo.price) : '—';
    var cover = document.getElementById('albumCover');
    if (cover && albumInfo.cover) {
        cover.src = albumInfo.cover;
        cover.alt = (albumInfo.name || '专辑') + '封面';
    }
    var lockCover = document.getElementById('lockCover');
    if (lockCover && albumInfo.cover) lockCover.src = albumInfo.cover;
    var lockPrice = document.getElementById('lockPrice');
    if (lockPrice) lockPrice.textContent = albumInfo.price != null ? albumInfo.price : '--';
}

/* ---------------- 购买 gate ---------------- */

/** 当前用户是否已购买该专辑 */
function checkPurchased() {
    var buyer = getBuyer();
    fetch('/api/purchases?buyer=' + encodeURIComponent(buyer))
        .then(function(r) { return r.ok ? r.json() : []; })
        .catch(function() { return []; })
        .then(function(purchases) {
            var bought = Array.isArray(purchases) && purchases.some(function(p) {
                return (p.albumName || p.album_name) === albumName;
            });
            if (bought) unlock();
            else lock();
        });
}

function lock() {
    var mask = document.getElementById('lockMask');
    if (mask) mask.style.display = 'flex';
    // 内容自己模糊 + 压暗（白字不再糊成亮雾），遮罩只留薄薄一层暗色
    var section = document.querySelector('.songs-section');
    if (section) section.classList.add('locked');
    // 歌曲照常在遮罩下方加载（头部能显示歌曲总数），交互被遮罩挡住
    loadSongs();
}

function unlock() {
    var mask = document.getElementById('lockMask');
    if (mask) mask.style.display = 'none';
    var section = document.querySelector('.songs-section');
    if (section) section.classList.remove('locked');
    loadSongs();
}

/* ---------------- 购买确认弹窗 ---------------- */

var buyQty = 1;

function getEl(id) { return document.getElementById(id); }

/** 打开购买弹窗：填入专辑信息，数量重置为 1 */
function openBuyModal() {
    if (!albumName) { showToast('专辑信息缺失，无法购买'); return; }
    var mask = getEl('buyModalMask');
    if (!mask) return;

    var cover = getEl('buyCover');
    if (cover) cover.src = albumInfo.cover || '';
    var nameEl = getEl('buyAlbumName');
    if (nameEl) nameEl.textContent = albumInfo.name || albumName;
    var singerEl = getEl('buyAlbumSinger');
    if (singerEl) singerEl.textContent = albumInfo.singer || '';
    var priceEl = getEl('buyUnitPrice');
    if (priceEl) priceEl.textContent = albumInfo.price != null ? albumInfo.price : '--';

    buyQty = 1;
    var errEl = getEl('buyError');
    if (errEl) errEl.textContent = '';
    var confirmBtn = getEl('buyConfirmBtn');
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> 确认购买';
    }

    syncQty();
    // 先 display 再下一帧加 .show，让淡入 + 上浮动画生效
    mask.style.display = 'flex';
    requestAnimationFrame(function() { mask.classList.add('show'); });
}

function closeBuyModal() {
    var mask = getEl('buyModalMask');
    if (!mask || mask.style.display === 'none') return;
    mask.classList.remove('show');
    setTimeout(function() { mask.style.display = 'none'; }, 250);
}

/** 数量与合计的联动显示（1 ~ 9 张） */
function syncQty() {
    var qtyEl = getEl('qtyValue');
    if (qtyEl) qtyEl.textContent = buyQty;
    var minus = getEl('qtyMinus');
    if (minus) minus.disabled = buyQty <= 1;
    var plus = getEl('qtyPlus');
    if (plus) plus.disabled = buyQty >= 9;
    var totalEl = getEl('buyTotal');
    if (totalEl) {
        totalEl.textContent = albumInfo.price != null ? (albumInfo.price * buyQty) : '--';
    }
}

/** 提交购买（弹窗里确认后才真正下单） */
function submitPurchase() {
    var btn = getEl('buyConfirmBtn');
    var errEl = getEl('buyError');
    if (!btn || btn.disabled) return;
    if (albumInfo.price == null) {
        if (errEl) errEl.textContent = '专辑价格加载中，请稍候再试';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 购买中...';
    if (errEl) errEl.textContent = '';

    var body = JSON.stringify({ albumName: albumName, buyerName: getBuyer(), quantity: buyQty });
    fetch('/api/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body })
        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .catch(function() {
            return fetch('/api/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body })
                .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
        })
        .then(function() {
            closeBuyModal();
            showToast('已购买专辑：' + albumName + (buyQty > 1 ? ' × ' + buyQty : ''));
            // 通知父页面刷新专辑卡片上的「已购买」按钮状态
            if (window.parent && typeof window.parent.markAlbumPurchased === 'function') {
                window.parent.markAlbumPurchased(albumName);
            }
            unlock();
        })
        .catch(function() {
            showToast('购买失败，请重试');
            if (errEl) errEl.textContent = '购买失败，请稍后再试';
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-shopping-cart"></i> 确认购买';
        });
}

function bindLockEvents() {
    var btn = document.getElementById('lockBuyBtn');
    var hint = document.getElementById('lockHint');
    if (!btn) return;
    // 点「立即购买」先弹确认弹窗，不直接下单
    btn.addEventListener('click', openBuyModal);

    // 弹窗内交互
    var mask = getEl('buyModalMask');
    var closeBtn = getEl('buyModalClose');
    var confirmBtn = getEl('buyConfirmBtn');
    var minus = getEl('qtyMinus');
    var plus = getEl('qtyPlus');
    if (closeBtn) closeBtn.addEventListener('click', closeBuyModal);
    if (confirmBtn) confirmBtn.addEventListener('click', submitPurchase);
    if (minus) minus.addEventListener('click', function() { if (buyQty > 1) { buyQty--; syncQty(); } });
    if (plus) plus.addEventListener('click', function() { if (buyQty < 9) { buyQty++; syncQty(); } });
    // 点遮罩空白处关闭（点弹窗本身不关）
    if (mask) mask.addEventListener('mousedown', function(e) {
        if (e.target === mask) closeBuyModal();
    });
    // Esc 关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeBuyModal();
    });
}

/* ---------------- 歌曲列表 ---------------- */

function updateSongCount(count) {
    var el = document.getElementById('statSongs');
    if (el) el.textContent = count + '首';
}

function loadSongs() {
    var tbody = document.getElementById('songsBody');
    if (!tbody) return;
    if (!albumInfo.singer) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.4);padding:60px 20px;">暂无歌曲</td></tr>';
        return;
    }

    // 优先按歌曲的 album_name 精确匹配；数据库里没关联上的歌回退按歌手匹配
    fetch('/api/music?keyword=' + encodeURIComponent(albumInfo.singer || albumName) + '&size=200')
        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function(data) {
            var records = Array.isArray(data) ? data : (data.records || []);
            var byAlbum = records.filter(function(s) {
                return (s.albumName || s.album_name) === albumName;
            });
            if (byAlbum.length) {
                allSongs = byAlbum;
            } else {
                allSongs = records.filter(function(s) {
                    return (s.singerName || s.singer_name) === albumInfo.singer;
                });
            }
            updateSongCount(allSongs.length);
            if (!allSongs.length) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.4);padding:60px 20px;">暂无歌曲</td></tr>';
                var pag = document.getElementById('songPagination');
                if (pag) pag.style.display = 'none';
                return;
            }
            currentPage = 1;
            renderPage();
        })
        .catch(function(err) {
            console.error('albumpage: 歌曲加载失败', err);
            updateSongCount(0);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.4);padding:60px 20px;">加载失败，请检查后端服务是否启动</td></tr>';
        });
}

function renderPage() {
    var tbody = document.getElementById('songsBody');
    var totalPages = Math.ceil(allSongs.length / pageSize);
    var start = (currentPage - 1) * pageSize;
    var pageSongs = allSongs.slice(start, start + pageSize);

    var tags = ['臻品母带','臻品母带','HQ','臻品母带','HQ','臻品母带','HQ','臻品母带'];
    var html = '';
    pageSongs.forEach(function(song, i) {
        var idx = start + i;
        var title = song.musicName || song.music_name || '';
        var singer = song.singerName || song.singer_name || '—';
        var duration = formatDuration(song.duration);
        var tag = tags[idx % tags.length];
        html += '<tr class="song-row">';
        html += '<td class="col-heart"><span class="heart-icon" title="收藏"><i class="fa-solid fa-heart"></i></span></td>';
        html += '<td class="col-name"><span class="song-name">' + escHtml(title) + '</span><span class="quality-tag">' + tag + '</span></td>';
        html += '<td class="col-play"><button class="play-btn" title="播放"><i class="fa-solid fa-play"></i></button></td>';
        html += '<td class="col-singer"><span class="singer-text">' + escHtml(singer) + '</span></td>';
        html += '<td class="col-duration">' + duration + '</td>';
        html += '</tr>';
    });
    tbody.innerHTML = html;

    var pagDiv = document.getElementById('songPagination');
    var prevBtn = document.getElementById('songPrevPage');
    var nextBtn = document.getElementById('songNextPage');
    var info = document.getElementById('songPageInfo');
    if (pagDiv) {
        pagDiv.style.display = totalPages > 1 ? 'flex' : 'none';
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
        if (info) info.textContent = '第 ' + currentPage + ' 页 / 共 ' + totalPages + ' 页';
    }

    syncHeartUI();
    bindRowEvents();

    var indicator = document.getElementById('songPagIndicator');
    if (indicator && !indicator._initDone) {
        indicator._initDone = true;
        setTimeout(function() {
            var target = (nextBtn && !nextBtn.disabled) ? nextBtn : (prevBtn && !prevBtn.disabled ? prevBtn : null);
            if (target && pagDiv && pagDiv.style.display === 'flex') {
                indicator.style.transition = 'none';
                indicator.style.left = target.offsetLeft + 'px';
                indicator.style.width = target.offsetWidth + 'px';
                requestAnimationFrame(function() {
                    requestAnimationFrame(function() { indicator.style.transition = ''; });
                });
            }
        }, 80);
    }
}

function syncHeartUI() {
    var saved = localStorage.getItem('yjay_favorites');
    if (!saved) return;
    var favorites = JSON.parse(saved);
    document.querySelectorAll('#songsBody .song-row').forEach(function(row) {
        var nameEl = row.querySelector('.song-name');
        var singerEl = row.querySelector('.singer-text');
        if (!nameEl) return;
        var isFav = favorites.some(function(f) {
            return f.title === nameEl.textContent && f.singer === (singerEl ? singerEl.textContent : albumInfo.singer);
        });
        var icon = row.querySelector('.heart-icon');
        if (icon) {
            if (isFav) icon.classList.add('active');
            else icon.classList.remove('active');
        }
    });
}

function bindRowEvents() {
    var indicator = document.getElementById('tableIndicator');
    var tableWrap = document.querySelector('.table-wrap');
    var thead = document.querySelector('.songs-table thead');
    if (!indicator || !tableWrap || !thead) return;

    document.querySelectorAll('#songsBody .song-row').forEach(function(row) {
        row.addEventListener('mouseenter', function() {
            var wrapRect = tableWrap.getBoundingClientRect();
            var rowRect = this.getBoundingClientRect();
            indicator.style.opacity = '1';
            indicator.style.top = (rowRect.top - wrapRect.top - 4) + 'px';
            indicator.style.height = (rowRect.height + 8) + 'px';
        });
    });

    tableWrap.addEventListener('mouseleave', function() {
        var wrapRect = tableWrap.getBoundingClientRect();
        var headRect = thead.getBoundingClientRect();
        indicator.style.top = (headRect.top - wrapRect.top) + 'px';
        indicator.style.height = headRect.height + 'px';
    });

    setTimeout(function() {
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
        }
    }, 150);

    // 播放按钮
    document.querySelectorAll('#songsBody .play-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var row = this.closest('.song-row');
            if (!row) return;
            var nameEl = row.querySelector('.song-name');
            var singerEl = row.querySelector('.singer-text');
            if (!nameEl) return;
            var title = nameEl.textContent;
            var singer = singerEl ? singerEl.textContent : albumInfo.singer;
            var duration = row.querySelector('td:last-child').textContent;
            var tag = (row.querySelector('.quality-tag') || {}).textContent || 'HQ';
            if (window.parent && typeof window.parent.playSingleSong === 'function') {
                window.parent.playSingleSong(title, singer, duration, tag);
            }
        });
    });

    // 爱心收藏
    document.querySelectorAll('#songsBody .heart-icon').forEach(function(icon) {
        icon.addEventListener('click', function(e) {
            e.stopPropagation();
            var row = this.closest('.song-row');
            if (!row) return;
            var nameEl = row.querySelector('.song-name');
            var singerEl = row.querySelector('.singer-text');
            if (!nameEl) return;
            var title = nameEl.textContent;
            var singer = singerEl ? singerEl.textContent : albumInfo.singer;
            var duration = row.querySelector('td:last-child').textContent;
            var isActive = !this.classList.contains('active');

            if (isActive) {
                this.classList.add('active');
                showToast('已收藏该歌曲');
                if (window.parent && typeof window.parent.toggleFavorite === 'function') {
                    window.parent.toggleFavorite(true, { title: title, singer: singer, duration: duration });
                }
                if (window.parent && typeof window.parent.updatePlayerHeartStatus === 'function') {
                    window.parent.updatePlayerHeartStatus(true, title, singer);
                }
            } else {
                this.classList.remove('active');
                showToast('已取消收藏');
                if (window.parent && typeof window.parent.toggleFavorite === 'function') {
                    window.parent.toggleFavorite(false, { title: title, singer: singer });
                }
                if (window.parent && typeof window.parent.updatePlayerHeartStatus === 'function') {
                    window.parent.updatePlayerHeartStatus(false, title, singer);
                }
            }
        });
    });
}

/* ---------------- 分页 ---------------- */

function bindPagination() {
    var prevBtn = document.getElementById('songPrevPage');
    var nextBtn = document.getElementById('songNextPage');
    var indicator = document.getElementById('songPagIndicator');

    function updatePagIndicator(target) {
        if (indicator && target && !target.disabled) {
            indicator.style.left = target.offsetLeft + 'px';
            indicator.style.width = target.offsetWidth + 'px';
        }
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (currentPage > 1) { currentPage--; renderPage(); updatePagIndicator(this); }
        });
        prevBtn.addEventListener('mouseenter', function() {
            if (!this.disabled) updatePagIndicator(this);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            var totalPages = Math.ceil(allSongs.length / pageSize);
            if (currentPage < totalPages) { currentPage++; renderPage(); updatePagIndicator(this); }
        });
        nextBtn.addEventListener('mouseenter', function() {
            if (!this.disabled) updatePagIndicator(this);
        });
    }
    if (indicator) {
        var pag = document.getElementById('songPagination');
        if (pag) pag.addEventListener('mouseleave', function() {
            if (nextBtn && !nextBtn.disabled) updatePagIndicator(nextBtn);
            else if (prevBtn && !prevBtn.disabled) updatePagIndicator(prevBtn);
        });
    }
}

/* ---------------- 启动 ---------------- */

document.addEventListener('DOMContentLoaded', function() {
    renderHeader();
    bindLockEvents();
    bindPagination();
    loadAlbumInfo();   // 内部会再触发 checkPurchased -> unlock/lock -> loadSongs
});

// 供父页面通知刷新收藏状态
window.updateHeartUI = function(isActive, title, singer) {
    document.querySelectorAll('#songsBody .song-row').forEach(function(row) {
        var nameEl = row.querySelector('.song-name');
        var singerEl = row.querySelector('.singer-text');
        if (!nameEl || nameEl.textContent !== title) return;
        if (singer && singerEl && singerEl.textContent !== singer) return;
        var icon = row.querySelector('.heart-icon');
        if (icon) {
            if (isActive) icon.classList.add('active');
            else icon.classList.remove('active');
        }
    });
};

window.initHeartStatus = function() {
    syncHeartUI();
};

})();
