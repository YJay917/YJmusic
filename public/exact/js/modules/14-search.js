// ======================== 顶部导航搜索下拉 ========================
(function() {
    var searchInput = document.getElementById('navSearchInput');
    var searchDropdown = document.getElementById('navSearchDropdown');
    var searchBox = document.getElementById('navSearchBox');
    if (!searchInput || !searchDropdown) return;

    var debounceTimer;
    var lastSearchResults = [];
    var lastAlbumMatches = [];   // 命中的专辑（按专辑名/歌手名匹配）
    var gAllAlbums = null;       // 专辑列表缓存

    /** 拉取专辑列表（成功后缓存，失败不缓存） */
    function ensureAlbums(callback) {
        if (gAllAlbums) { callback(gAllAlbums); return; }
        cachedGet('/api/albums')
            .then(function(albums) {
                gAllAlbums = Array.isArray(albums) ? albums : [];
                callback(gAllAlbums);
            })
            .catch(function() { callback([]); });
    }

    /** 关键字是否命中专辑：专辑名或专辑歌手包含关键字（不区分大小写） */
    function matchAlbums(keyword) {
        var kw = keyword.toLowerCase();
        return (gAllAlbums || []).filter(function(a) {
            var name = a.albumName || a.album_name || '';
            var singer = a.singerName || a.singer_name || '';
            return name.toLowerCase().indexOf(kw) !== -1 ||
                   singer.toLowerCase().indexOf(kw) !== -1;
        });
    }

    // 从后端搜索歌曲（后端SQL LIKE匹配歌名、歌手名和专辑名）
    function searchFromBackend(keyword, callback) {
        cachedGet('/api/music?keyword=' + encodeURIComponent(keyword) + '&size=10')
            .then(function(data) {
                var songs = Array.isArray(data) ? data : (data.records || []);
                lastSearchResults = songs.map(function(s) {
                    return { title: s.musicName, singer: s.singerName };
                });
                callback(lastSearchResults);
            })
            .catch(function() {
                callback([]);
            });
    }

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
        var albums = (lastAlbumMatches || []).slice(0, 3);
        if (!matches.length && !albums.length) {
            searchDropdown.innerHTML = '<div style="padding:16px;color:rgba(255,255,255,0.4);text-align:center;font-size:13px;">暂无匹配歌曲</div>';
            searchDropdown.classList.add('show');
            return;
        }

        var html = '';
        // 命中的专辑（点唱片直接打开专辑详情弹窗）
        if (albums.length) {
            html += '<div class="search-group-label">专辑</div>';
            html += albums.map(function(a) {
                var name = a.albumName || a.album_name || '';
                var singer = a.singerName || a.singer_name || '';
                var img = a.albumImagePath || a.album_image_path || '';
                return '<div class="search-result-item search-result-album" data-album="' + escHtml(name) + '" data-album-img="' + escHtml(img) + '">' +
                    '<span class="search-album-icon"><i class="fa-solid fa-compact-disc"></i></span>' +
                    '<div class="search-result-info">' +
                        '<div class="search-result-title">' + escHtml(name) + '</div>' +
                        '<div class="search-result-singer">' + escHtml(singer || '专辑') + '</div>' +
                    '</div>' +
                    '<span class="search-album-go" title="查看专辑"><i class="fa-solid fa-arrow-right"></i></span>' +
                '</div>';
            }).join('');
        }
        // 命中的歌曲
        if (matches.length) {
            if (albums.length) html += '<div class="search-group-label">歌曲</div>';
            html += matches.slice(0, 10).map(function(s) {
                var playing = isCurrentlyPlaying(s.title, s.singer);
                var icon = playing && !isAudioPaused() ? 'fa-pause' : 'fa-play';
                var cls = playing ? 'search-result-play playing' : 'search-result-play';
                return '<div class="search-result-item" data-title="' + escHtml(s.title) + '" data-singer="' + escHtml(s.singer) + '">' +
                    '<div class="search-result-info">' +
                        '<div class="search-result-title">' + escHtml(s.title) + '</div>' +
                        '<div class="search-result-singer">' + escHtml(s.singer) + '</div>' +
                    '</div>' +
                    '<button class="' + cls + '" title="播放"><i class="fa-solid ' + icon + '"></i></button>' +
                '</div>';
            }).join('');
        }
        searchDropdown.innerHTML = html;
        searchDropdown.classList.add('show');

        // 专辑条目：点击打开专辑详情弹窗
        searchDropdown.querySelectorAll('.search-result-album').forEach(function(item) {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                var name = this.getAttribute('data-album');
                var img = this.getAttribute('data-album-img');
                searchDropdown.classList.remove('show');
                if (typeof window.openAlbumDetailByName === 'function') {
                    window.openAlbumDetailByName(name, img);
                }
            });
        });

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
        searchDropdown.querySelectorAll('.search-result-item:not(.search-result-album)').forEach(function(item) {
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
        // 未登录提示
        if (!localStorage.getItem('currentUser')) {
            searchDropdown.innerHTML = '<div style="padding:16px;color:rgba(255,255,255,0.4);text-align:center;font-size:13px;">请先点击右上角登录</div>';
            searchDropdown.classList.add('show');
            return;
        }
        debounceTimer = setTimeout(function() {
            // 先拿到专辑列表（有缓存），再同时匹配专辑与歌曲
            ensureAlbums(function() {
                lastAlbumMatches = matchAlbums(val);
                searchFromBackend(val, function(matches) {
                    renderResults(matches);
                });
            });
        }, 300);
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
            // 未登录提示
            if (!localStorage.getItem('currentUser')) {
                searchDropdown.innerHTML = '<div style="padding:16px;color:rgba(255,255,255,0.4);text-align:center;font-size:13px;">请先点击右上角登录</div>';
                searchDropdown.classList.add('show');
                return;
            }
            ensureAlbums(function() {
                lastAlbumMatches = matchAlbums(val);
                searchFromBackend(val, function(matches) {
                    renderResults(matches);
                });
            });
        });
    }

    // 点击外部关闭
    document.addEventListener('click', function(e) {
        if (!searchBox.contains(e.target)) searchDropdown.classList.remove('show');
    });
})();




