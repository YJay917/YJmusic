/**
 * 歌手详情页逻辑 - 从 URL 参数获取歌手名，动态从数据库加载歌曲和歌手信息
 */
(function() {

// 歌手头像映射（当数据库无头像时使用本地图片）
var singerImgMap = {
    '周杰伦': '../歌手/周杰伦.png', '林俊杰': '../歌手/林俊杰.png',
    '陈奕迅': '../歌手/陈奕迅.png', 'G.E.M.邓紫棋': '../歌手/邓紫棋.png',
    '方大同': '../歌手/方大同.png', '张靓颖': '../歌手/张靓颖.png',
    '薛之谦': '../歌手/薛之谦.png', 'Taylor Swift': '../歌手/Taylor Swift.png',
    '黄霄雲': '../歌手/黄云霄.png', 'EXO': '../歌手/周杰伦.png',
    '鹿晗': '../歌手/周杰伦.png'
};

// 从 URL 参数获取歌手名，URL 无参数时从页面 h1 读取
function getSingerNameFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var name = params.get('singer');
    if (name) return name;
    // 兼容直接打开 artistpage.html 无参数的情况
    var h1 = document.getElementById('singerName');
    if (h1 && h1.textContent && h1.textContent !== '加载中...') return h1.textContent.trim();
    return '周杰伦';
}

// 从 URL 参数获取头像路径
function getAvatarFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get('img') || '';
}

// 当前歌手名
var currentSingerName = getSingerNameFromUrl();

// 显示提示弹窗函数
function showToast(message) {
    if (window.parent && typeof window.parent.showPlayerToast === 'function') {
        window.parent.showPlayerToast(message);
        return;
    }
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 2000);
}

// 获取歌手名（供外部调用）
function getSingerName() {
    return currentSingerName;
}

// 从数据库获取的歌手头像（优先使用）
var dbImagePath = null;

// 从数据库加载歌手信息并更新头部
function loadSingerInfo() {
    fetch('/api/singers/name/' + encodeURIComponent(currentSingerName))
        .then(function(r) { return r.json(); })
        .then(function(singer) {
            if (!singer || !singer.name) {
                // 数据库无此歌手，使用 URL 参数中的名字
                updateSingerUI(currentSingerName, '—', '—');
                updateAvatar();
                return;
            }
            var country = singer.country || '—';
            var fans = singer.fans != null ? singer.fans + '万' : '—';
            // 保存数据库中的头像路径
            dbImagePath = singer.imagePath || null;
            updateSingerUI(singer.name, country, fans);
            updateAvatar();
        })
        .catch(function(err) {
            console.error('歌手信息加载失败，使用默认值:', err);
            updateSingerUI(currentSingerName, '—', '—');
            updateAvatar();
        });
}

function updateSingerUI(name, country, fans) {
    // 更新歌手名
    var h1 = document.getElementById('singerName');
    if (h1) h1.textContent = name;
    // 更新国籍
    var countryEl = document.getElementById('statCountry');
    if (countryEl) countryEl.textContent = country;
    // 更新粉丝数（去掉"万"后缀，stat-value 里用数字）
    var fansEl = document.getElementById('statFans');
    if (fansEl) fansEl.textContent = fans;
    // 更新页面标题
    document.title = name;
}

// 更新歌曲数量统计
function updateSongCount(count) {
    var el = document.getElementById('statSongs');
    if (el) el.textContent = count + '首';
}

function updateAvatar() {
    var avatarEl = document.getElementById('singerAvatar');
    if (!avatarEl) return;
    // 第一优先：数据库 singer 表的 image_path 字段
    if (dbImagePath) {
        // 保留相对路径（如 ../歌手/周杰伦.png），绝对路径（如 /exact/p/歌手/1.png）也直接使用
        avatarEl.src = dbImagePath;
        avatarEl.alt = currentSingerName + '头像';
        return;
    }
    // 第二优先：URL 参数传递的图片
    var imgFromUrl = getAvatarFromUrl();
    if (imgFromUrl) {
        avatarEl.src = imgFromUrl;
        avatarEl.alt = currentSingerName + '头像';
        return;
    }
    // 第三优先：本地硬编码映射
    var localImg = singerImgMap[currentSingerName];
    if (localImg) {
        avatarEl.src = localImg;
        avatarEl.alt = currentSingerName + '头像';
        return;
    }
    // 默认头像
    avatarEl.src = '../歌手/周杰伦.png';
    avatarEl.alt = currentSingerName + '头像';
}

// 收藏状态同步
function syncHeartUI() {
    var saved = localStorage.getItem('yjay_favorites');
    if (!saved) return;
    var favorites = JSON.parse(saved);
    document.querySelectorAll('#songsBody .song-row').forEach(function(row) {
        var nameEl = row.querySelector('.song-name');
        if (!nameEl) return;
        var isFav = favorites.some(function(f) {
            return f.title === nameEl.textContent && f.singer === currentSingerName;
        });
        var icon = row.querySelector('.heart-icon');
        if (icon) {
            if (isFav) icon.classList.add('active');
            else icon.classList.remove('active');
        }
    });
}

// 分页相关
var allSongs = [];
var currentPage = 1;
var pageSize = 5;

// 加载歌曲列表
function loadSongs() {
    var tbody = document.getElementById('songsBody');
    if (!tbody) { console.error('artistpage: 找不到 #songsBody'); return; }

    var apiUrl = '/api/music?keyword=' + encodeURIComponent(currentSingerName) + '&size=50';
    fetch(apiUrl)
        .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(function(data) {
            allSongs = Array.isArray(data) ? data : (data.records || []);
            updateSongCount(allSongs.length);
            if (!allSongs.length) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.4);padding:60px 20px;">暂无歌曲</td></tr>';
                document.getElementById('songPagination').style.display = 'none';
                return;
            }
            currentPage = 1;
            renderPage();
        })
        .catch(function(err) {
            console.error('artistpage: 歌曲加载失败', err);
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
        var album = song.album || '—';
        var duration = formatDuration(song.duration || 240);
        var tag = tags[idx % tags.length];
        html += '<tr class="song-row">';
        html += '<td class="col-heart"><span class="heart-icon" title="收藏"><i class="fa-solid fa-heart"></i></span></td>';
        html += '<td class="col-name"><span class="song-name">' + escHtml(title) + '</span><span class="quality-tag">' + tag + '</span></td>';
        html += '<td class="col-play"><button class="play-btn" title="播放"><i class="fa-solid fa-play"></i></button></td>';
        html += '<td class="col-album"><span class="album-text">' + escHtml(album) + '</span></td>';
        html += '<td class="col-duration">' + duration + '</td>';
        html += '</tr>';
    });
    tbody.innerHTML = html;

    // 更新分页控件
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

    // 分页指示器：仅首次渲染定位，翻页时保持用户最后悬停位置
    var indicator = document.getElementById('songPagIndicator');
    var nextBtn = document.getElementById('songNextPage');
    var prevBtn = document.getElementById('songPrevPage');
    if (indicator && !indicator._initDone) {
        indicator._initDone = true;
        setTimeout(function() {
            var target = (nextBtn && !nextBtn.disabled) ? nextBtn : (prevBtn && !prevBtn.disabled ? prevBtn : null);
            if (target && pagDiv.style.display === 'flex') {
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

function escHtml(s) {
    s = s || '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDuration(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

// 绑定歌曲行事件
function bindRowEvents() {
    var indicator = document.getElementById('tableIndicator');
    var tableWrap = document.querySelector('.table-wrap');
    var thead = document.querySelector('.songs-table thead');

    if (!indicator || !tableWrap || !thead) return;

    // 表格行 hover → 滑动指示器
    document.querySelectorAll('#songsBody .song-row').forEach(function(row) {
        row.addEventListener('mouseenter', function() {
            var wrapRect = tableWrap.getBoundingClientRect();
            var rowRect = this.getBoundingClientRect();
            indicator.style.opacity = '1';
            indicator.style.top = (rowRect.top - wrapRect.top - 4) + 'px';
            indicator.style.height = (rowRect.height + 8) + 'px';
        });
    });

    // 鼠标离开表格区域 → 回到表头
    tableWrap.addEventListener('mouseleave', function() {
        var wrapRect = tableWrap.getBoundingClientRect();
        var headRect = thead.getBoundingClientRect();
        indicator.style.top = (headRect.top - wrapRect.top) + 'px';
        indicator.style.height = headRect.height + 'px';
    });

    // 延迟定位初始位置，确保 iframe 布局完成
    function positionAtThead() {
        var wrapRect = tableWrap.getBoundingClientRect();
        var headRect = thead.getBoundingClientRect();
        if (headRect.height > 0) {
            indicator.style.transition = 'none';
            indicator.style.top = (headRect.top - wrapRect.top) + 'px';
            indicator.style.height = headRect.height + 'px';
            indicator.style.opacity = '1';
            // 下一帧恢复过渡动画
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    indicator.style.transition = '';
                });
            });
        } else {
            // 布局未完成，重试
            setTimeout(positionAtThead, 100);
        }
    }
    setTimeout(positionAtThead, 150);

    // 播放按钮点击
    document.querySelectorAll('#songsBody .play-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var row = this.closest('.song-row');
            if (!row) return;
            var nameEl = row.querySelector('.song-name');
            if (!nameEl) return;
            var title = nameEl.textContent;
            var duration = row.querySelector('td:last-child').textContent;
            var tag = row.querySelector('.quality-tag')?.textContent || 'HQ';
            if (window.parent && typeof window.parent.playSingleSong === 'function') {
                window.parent.playSingleSong(title, currentSingerName, duration, tag);
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
            if (!nameEl) return;
            var title = nameEl.textContent;
            var duration = row.querySelector('td:last-child').textContent;
            var isActive = !this.classList.contains('active');

            if (isActive) {
                this.classList.add('active');
                showToast('已收藏该歌曲');
                if (window.parent && typeof window.parent.toggleFavorite === 'function') {
                    window.parent.toggleFavorite(true, { title: title, singer: currentSingerName, duration: duration });
                }
                if (window.parent && typeof window.parent.updatePlayerHeartStatus === 'function') {
                    window.parent.updatePlayerHeartStatus(true, title, currentSingerName);
                }
            } else {
                this.classList.remove('active');
                showToast('已取消收藏');
                if (window.parent && typeof window.parent.toggleFavorite === 'function') {
                    window.parent.toggleFavorite(false, { title: title, singer: currentSingerName });
                }
                if (window.parent && typeof window.parent.updatePlayerHeartStatus === 'function') {
                    window.parent.updatePlayerHeartStatus(false, title, currentSingerName);
                }
            }
        });
    });
}

// 页面加载
document.addEventListener('DOMContentLoaded', function() {
    // 先更新头像（URL参数或本地映射）
    updateAvatar();

    // 从数据库加载歌手信息
    loadSingerInfo();

    // 从数据库加载歌曲
    loadSongs();

    // 分页按钮 + 滑动指示器
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
            if (currentPage > 1) { currentPage--; renderPage(); updateActiveBtn(); updatePagIndicator(this); }
        });
        prevBtn.addEventListener('mouseenter', function() {
            if (!this.disabled) updatePagIndicator(this);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            var totalPages = Math.ceil(allSongs.length / pageSize);
            if (currentPage < totalPages) { currentPage++; renderPage(); updateActiveBtn(); updatePagIndicator(this); }
        });
        nextBtn.addEventListener('mouseenter', function() {
            if (!this.disabled) updatePagIndicator(this);
        });
    }

    function updateActiveBtn() {
        if (prevBtn) prevBtn.classList.remove('active');
        if (nextBtn) nextBtn.classList.remove('active');
    }

    // 离开分页区 → 回到可用按钮（优先下一页，否则上一页）
    if (indicator) {
        document.getElementById('songPagination').addEventListener('mouseleave', function() {
            if (nextBtn && !nextBtn.disabled) updatePagIndicator(nextBtn);
            else if (prevBtn && !prevBtn.disabled) updatePagIndicator(prevBtn);
        });
    }
});

// 暴露给父窗口调用的 UI 同步函数
window.updateHeartUI = function(isActive, title, singer) {
    if (currentSingerName !== singer) return;
    document.querySelectorAll('#songsBody .song-row').forEach(function(row) {
        var nameEl = row.querySelector('.song-name');
        if (!nameEl) return;
        if (nameEl.textContent === title) {
            var icon = row.querySelector('.heart-icon');
            if (icon) {
                if (isActive) icon.classList.add('active');
                else icon.classList.remove('active');
            }
        }
    });
};

// 暴露给外部调用的初始化
window.initHeartStatus = function() {
    syncHeartUI();
};

})();
