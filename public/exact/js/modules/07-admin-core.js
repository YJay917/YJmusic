/**
 * =============================================================================
 * 模块：通用提示
 * =============================================================================
 * 全站告知类提示（欢迎语、已退出登录、密码已保存…）统一走黑胶囊 toast
 * （common/toast.js 的 window.showToast，与前台播放器 showPlayerToast 同一套）。
 * 原 #alertModal 确认弹窗已删除——纯告知不需要用户点「确认」，toast 自动消失。
 * 保留 showAlert 函数名，3 处历史调用点零改动。
 */
function showAlert(message) {
    if (typeof window.showToast === 'function') {
        window.showToast(message);
        return;
    }
    if (typeof window.showPlayerToast === 'function') {
        window.showPlayerToast(message);
        return;
    }
    // 两个 toast 组件都缺失时的兜底（正常不会走到）
    alert(message);
}

async function apiRequest(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    const headers = isFormData
        ? { ...(options.headers || {}) }  // FormData 让浏览器自动设置 Content-Type
        : {
            'Content-Type': 'application/json',
            ...(options.headers || {})
          };

    // 发起请求并尝试解析 JSON，返回 { response, data, parsed }
    async function request(url) {
        let response;
        try {
            response = await fetch(url, { ...options, headers });
        } catch (networkErr) {
            return { response: null, data: null, parsed: false };
        }
        const text = await response.text();
        let data = null;
        let parsed = false;
        try { data = text ? JSON.parse(text) : null; parsed = true; } catch (jsonErr) { parsed = false; }
        return { response, data, parsed };
    }

    // 优先走 /api 代理路径
    let result = await request(`/api${path}`);

    // 只有代理本身不可用时才回退到裸路径（生产模式后端直接暴露）：
    //  1) 返回非 JSON（如 Vite 的 HTML 404/502 错误页），或
    //  2) 直接访问后端时 /api 前缀命中 404（后端没有 /api 这个路由）
    const proxyUnavailable = !result.parsed || (result.response && result.response.status === 404);
    if (proxyUnavailable) {
        result = await request(path);
    }

    if (!result.parsed) {
        throw new Error('服务器异常，请检查后端是否启动');
    }
    if (!result.response || !result.response.ok) {
        throw new Error(result.data?.message || '请求失败');
    }
    return result.data;
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
        apiGet('/api/music?size=200', '/music?size=200')
            .catch(function() { return []; })
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
        apiGet('/api/albums', '/albums')
            .catch(function() { return []; })
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
        apiGet('/api/purchases?buyer=' + encodeURIComponent(buyer), '/purchases?buyer=' + encodeURIComponent(buyer))
            .catch(function() { return []; })
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

// 说明：前台的「用户管理」表格与「编辑用户」弹窗已删除，
//       用户管理统一在后台管理页（admin.html）完成。

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
        // btnLine 就是个人设置里「名字下方」那个容器，
        // 里面放着唯一的「后台管理」入口（原来这里有 用户管理/音乐管理 两个按钮）。
        if (btnLine) btnLine.style.display = 'flex';
        if (statsPanel) statsPanel.style.display = 'block';
        setTimeout(function() { if (typeof echarts !== 'undefined') renderSingerStatsChart(); }, 350);
    } else {
        if (userPanel) userPanel.style.display = 'block';
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
