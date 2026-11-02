/* ============================================================================
 * YJayMusic 后台管理 - 主逻辑（视觉与前台统一版）
 * ----------------------------------------------------------------------------
 * 设计要点
 *   1. 配置驱动：每个模块只写一份配置，表格/表单/增删改查由通用函数完成
 *   2. 视觉统一：导航栏、弹窗、表格、分页、按钮全部照搬前台 css/index.css 的参数
 *   3. 保留前台的动效：导航滑动指示器、表格行跟随高亮、分页滑动指示器、按钮组指示器
 * ========================================================================== */

/* ======================== 一、基础工具 ================================== */

// 全站唯一需要维护的接口前缀（直连后端 8080 与走 Vite 代理 5173 都能用）
const API_BASE = '/api';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** 是否已关闭动效（对应 admin.html 里 <body> 上的 no-motion 类）
 *  关闭后：平滑滚动改为瞬间定位，弹窗/列表的收尾延时归零。
 *  每次调用都重新读，所以随时去掉类名就能恢复。 */
const noMotion = () => document.body.classList.contains('no-motion');

/** HTML 转义，防止歌名/歌手名里的特殊字符破坏页面 */
function esc(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[&<>"']/g, ch => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
}

const toSnake = (key) => key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());

/** 取字段值，同时兼容驼峰与下划线两种命名 */
function val(row, key) {
    if (!row) return undefined;
    if (row[key] !== undefined && row[key] !== null) return row[key];
    const alt = toSnake(key);
    if (row[alt] !== undefined && row[alt] !== null) return row[alt];
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    return row[camel];
}

let toastTimer = null;
function toast(message, kind = 'ok') {
    const box = $('#toasts');
    let node = box.querySelector('.toast');
    if (!node) {
        node = document.createElement('div');
        box.appendChild(node);
    }
    node.className = 'toast show ' + kind;
    node.textContent = message;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        node.classList.remove('show');
        toastTimer = null;
    }, 2200);
}

/* ======================== 二、接口请求 ================================== */

async function api(method, path, body) {
    const options = { method, headers: {} };
    if (body instanceof FormData) {
        options.body = body;                        // multipart，让浏览器自动带边界
    } else if (body !== undefined && body !== null) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(API_BASE + path, options);
    } catch (err) {
        throw new Error('无法连接后端，请确认服务已启动');
    }

    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (err) { data = text; }

    if (!response.ok) {
        throw new Error((data && data.message) ? data.message : `请求失败（HTTP ${response.status}）`);
    }
    return data;
}

/* ======================== 三、模块配置（加模块只需加一项）=============== */

// 榜单显示名
const RANK_NAMES = ['飙升榜', '热歌榜', '新歌榜', '流行榜', 'MV榜'];

const MODULES = [
    { key: 'dashboard', title: '概览', icon: 'fa-gauge-high', type: 'dashboard' },
    {
        key: 'music', title: '歌曲管理', icon: 'fa-music', type: 'table',
        endpoint: '/music', paginated: true,
        search: { param: 'keyword', placeholder: '搜索歌名或歌手…' },
        createLabel: '添加歌曲',
        columns: [
            { key: '__index', label: '序号', type: 'index', width: 64 },
            { key: 'imagePath', label: '封面', type: 'image', width: 70 },
            { key: 'musicName', label: '歌名' },
            { key: 'singerName', label: '歌手' },
            { key: 'albumName', label: '专辑' },
            { key: 'duration', label: '时长', width: 80 },
            { key: 'musicPath', label: '音频文件', type: 'path' },
        ],
        fields: [
            { key: 'musicName', label: '歌名', required: true },
            { key: 'singerName', label: '歌手名', required: true },
            // 所属专辑：选项从 /albums 动态拉取；alwaysSend 保证选「未关联专辑」时
            // 也会把空值提交上去（后端据此清空 album_name，否则旧值会一直留着）
            { key: 'albumName', label: '所属专辑', type: 'select', full: true,
              optionsUrl: '/albums', optionsEmptyLabel: '未关联专辑', alwaysSend: true,
              optionsMap: (a) => {
                  const name = a.albumName || a.album_name || '';
                  return [name, a.singerName ? `${name} · ${a.singerName}` : name];
              },
              tip: '选「未关联专辑」并保存即可清除关联' },
            { key: 'imageFile', label: '封面图片', type: 'file', accept: 'image/*' },
            { key: 'musicFile', label: '音乐文件 MP3', type: 'file', accept: 'audio/mpeg,.mp3',
              requiredOnCreate: true, tip: '编辑时留空表示不替换' },
            { key: 'lyrics', label: '歌词 (LRC)', type: 'textarea', full: true, rows: 7,
              tip: '支持 [分:秒.毫秒] 时间轴格式，播放时前台歌词面板逐行高亮；留空则前台回退本地歌词文件' },
        ],
        upload: { create: '/music/upload', update: (id) => `/music/${id}/upload` },
        remove: (id) => `/music/${id}`,
    },
    {
        key: 'singers', title: '歌手管理', icon: 'fa-microphone-lines', type: 'table',
        endpoint: '/singers', createLabel: '添加歌手',
        columns: [
            { key: '__index', label: '序号', type: 'index', width: 64 },
            { key: 'imagePath', label: '头像', type: 'image', width: 70 },
            { key: 'name', label: '姓名' },
            { key: 'country', label: '国籍' },
            { key: 'fans', label: '粉丝数', type: 'fans' },
            { key: 'gender', label: '性别', type: 'gender' },
        ],
        fields: [
            { key: 'name', label: '姓名', required: true },
            { key: 'country', label: '国籍' },
            { key: 'fans', label: '粉丝数（万）', type: 'number' },
            { key: 'gender', label: '性别', type: 'select',
              options: [['', '未设置'], ['male', '男'], ['female', '女']] },
            // 与歌曲 / 专辑一致：直接选图片上传，不再手填路径
            { key: 'imageFile', label: '头像图片', type: 'file', accept: 'image/*',
              tip: '编辑时留空表示不替换头像' },
        ],
        upload: { create: '/singers/upload', update: (id) => `/singers/${id}/upload` },
    },
    {
        key: 'albums', title: '专辑管理', icon: 'fa-compact-disc', type: 'table',
        endpoint: '/albums',
        search: { param: 'keyword', placeholder: '搜索专辑名或歌手…' },
        createLabel: '添加专辑',
        columns: [
            { key: '__index', label: '序号', type: 'index', width: 64 },
            { key: 'albumImagePath', label: '封面', type: 'image', width: 70 },
            { key: 'albumName', label: '专辑名' },
            { key: 'singerName', label: '歌手' },
            { key: 'price', label: '价格', type: 'money' },
        ],
        fields: [
            { key: 'albumName', label: '专辑名', required: true },
            { key: 'singerName', label: '歌手', required: true },
            { key: 'price', label: '价格（元）', type: 'number', required: true, step: '0.01' },
            // 与歌曲管理一致：直接选图片上传，不再手填路径
            { key: 'imageFile', label: '封面图片', type: 'file', accept: 'image/*',
              tip: '编辑时留空表示不替换封面' },
        ],
        // 走了 upload 就会用 multipart 提交（而不是 JSON），字段名对应后端的 Form(alias=...)
        upload: { create: '/albums/upload', update: (id) => `/albums/${id}/upload` },
    },
    { key: 'hotSongs', title: '排行榜配置', icon: 'fa-ranking-star', type: 'charts', endpoint: '/hot-songs' },
    { key: 'remenSongs', title: '首页热门', icon: 'fa-fire', type: 'charts', endpoint: '/remen-songs' },
    {
        key: 'users', title: '用户管理', icon: 'fa-users', type: 'table',
        endpoint: '/users', createLabel: '注册新用户',
        columns: [
            { key: 'avatar', label: '头像', type: 'image', width: 70 },
            { key: 'name', label: '姓名' },
            { key: 'account', label: '账号' },
            { key: 'role', label: '角色', type: 'role' },
            { key: 'userStatus', label: '状态', type: 'status' },
            { key: 'createdAt', label: '注册时间', width: 150 },
            { key: 'favoriteCount', label: '收藏数', type: 'center' },
        ],
        fields: [
            { key: 'name', label: '姓名', required: true },
            { key: 'account', label: '账号', requiredOnCreate: true, tip: '非 admin 账号必须是 10 位纯数字' },
            { key: 'password', label: '密码', type: 'password', requiredOnCreate: true, tip: '至少 6 位；编辑时留空则不修改' },
            { key: 'role', label: '角色', type: 'select',
              options: [['VISITOR', '普通用户 VISITOR'], ['ADMIN', '管理员 ADMIN']] },
            { key: 'userStatus', label: '状态', type: 'select',
              options: [['ACTIVE', '正常 ACTIVE'], ['DISABLED', '停用 DISABLED']] },
        ],
    },
    { key: 'stats', title: '数据统计', icon: 'fa-chart-column', type: 'stats' },
];

/* ======================== 四、前台风味的动效 ============================ */

/* ---- 4.1 侧栏指示器（只标记当前模块，不跟随鼠标）----
 * 原本悬浮时会滑到鼠标所指的那一项（前台的交互），现按"触碰也不要动效"的要求
 * 取消跟随，只在切换模块时定位到激活项。
 */
function updateSideIndicator(target) {
    const indicator = $('#sideIndicator');
    const brand = $('#logo');
    if (!indicator) return;

    // 没有目标 / 目标是标志时隐藏
    if (!target || target === brand) {
        indicator.style.opacity = '0';
        return;
    }
    indicator.style.top = target.offsetTop + 'px';
    indicator.style.height = target.offsetHeight + 'px';
    indicator.style.opacity = '1';
}

/* ---- 4.2 表格行高亮 ----
 * 原先是 .table-indicator：一个跟着鼠标在行间滑动的红色发光框，
 * 而且**默认停在表头**，所以表头一直套着一个红框。
 * 现按要求整体移除，改为纯 CSS 的 tr:hover 底色 —— 没有任何跟随与过渡。
 */

/* ---- 4.3 分页滑动指示器 ----
 * 已移除：跟着鼠标在「上一页 / 下一页」之间滑动的红色胶囊。
 * 分页只保留三段文字：上一页 / 第 N 页 共 M 页 / 下一页。
 */

/* ---- 4.4 按钮组滑动指示器 ----
 * 已移除：在「＋新增 / 刷新」之间滑动的红色胶囊（同样属于触碰产生的位移）。
 * 按钮自身的悬浮反馈保留（颜色变化，瞬时无过渡）。
 */

/* ---- 4.5 逐条入场（前台 .reveal + .delay-* 的效果）----
 * 给一组元素加上错开的延迟，让它们依次淡入上浮。
 * 同步执行（加类 -> 强制重排 -> 交还给 CSS 动画），避免元素卡在隐藏状态。
 */
function revealAll(selector, root = document, step = 100, baseClass = 'reveal') {
    const nodes = $$(selector, root);
    if (!nodes.length) return;
    nodes.forEach((node, index) => {
        node.classList.add(baseClass, 'delay-' + ((index % 8) + 1) * step);
    });
    void document.body.offsetHeight;    // 强制重排，让动画从这一刻开始计延迟
}

/* ---- 4.6 滚动相关 ----
 * 侧栏是 position:fixed，页面滚动不影响它，所以不再需要前台那套
 * .nav.scrolled 的背景加深逻辑。这里保留占位说明，避免日后误加。
 */

/* ======================== 五、通用表格渲染 ============================== */

/** 把库里的路径补成可直接放进 src 的地址。
 *  歌曲封面 / 歌手头像是 `assets/images/歌曲/x.png`（不带斜杠），
 *  而专辑封面是 `/assets/images/专辑/x.png`（带斜杠）—— 两种写法这里都兼容。 */
const assetSrc = (raw) => (String(raw).startsWith('/') ? String(raw) : '/' + String(raw));

function cellHtml(row, col, serial) {
    const raw = val(row, col.key);
    switch (col.type) {
        // 序号列：不取值，用调用方算好的连续序号（跨页连续）
        case 'index':
            return `<span class="col-index">${serial ?? ''}</span>`;
        case 'image': {
            if (!raw) return '<span class="cell-dim">无</span>';
            return `<img class="thumb" src="${esc(assetSrc(raw))}" alt="" loading="lazy"
                        onerror="this.style.opacity=.25;this.title='图片不存在'">`;
        }
        case 'path':
            return `<div class="path-cell">${raw ? esc(raw) : '<span class="cell-dim">-</span>'}</div>`;
        case 'money':
            return (raw === null || raw === undefined) ? '-' : '¥' + Number(raw).toFixed(2);
        case 'fans':
            return (raw === null || raw === undefined) ? '-' : Number(raw).toLocaleString() + ' 万';
        case 'gender':
            return { male: '男', female: '女' }[raw] || '<span class="cell-dim">-</span>';
        case 'role':
            return `<span class="badge ${String(raw).toUpperCase() === 'ADMIN' ? 'badge-admin' : ''}">${esc(raw)}</span>`;
        case 'status':
            return `<span class="badge ${String(raw).toUpperCase() === 'ACTIVE' ? 'badge-ok' : 'badge-off'}">${esc(raw)}</span>`;
        case 'center':
            return `<span style="display:block;text-align:center">${esc(raw) || '-'}</span>`;
        default:
            return esc(raw) || '<span class="cell-dim">-</span>';
    }
}

async function renderTable(module, state) {
    const content = $('#content');
    state = Object.assign({ page: 1, size: 10, keyword: '' }, state);

    content.innerHTML = `
        <div class="page-title">
            <i class="fa-solid ${module.icon}"></i>
            <h3>${esc(module.title)}</h3>
            <span class="sub" id="countHint"></span>
        </div>
        <div class="panel">
            <div class="panel-head">
                <div class="btn-group" id="createGroup">
                    <button class="glow-btn" data-default="1" id="createBtn">＋ ${esc(module.createLabel || '新增')}</button>
                    <button class="glow-btn" id="refreshTableBtn">刷新</button>
                </div>
                <div class="toolbar">
                    ${module.search ? `<input class="input" id="searchInput" style="width:240px"
                        placeholder="${esc(module.search.placeholder || '搜索…')}"
                        value="${esc(state.keyword)}">` : ''}
                </div>
            </div>
            <div class="table-wrap" id="tableWrap">
                <div class="loading"><span class="loader"></span>加载中…</div>
            </div>
            <div class="pagination" id="pagination" style="display:none">
                <button class="pagination-btn" id="prevPage">上一页</button>
                <span class="pagination-info" id="pageInfo"></span>
                <button class="pagination-btn" id="nextPage">下一页</button>
            </div>
        </div>`;

    revealAll('.panel', content);

    async function load() {
        const wrap = $('#tableWrap');
        wrap.innerHTML = '<div class="loading"><span class="loader"></span>加载中…</div>';

        try {
            const query = new URLSearchParams();
            if (module.search && state.keyword) query.set(module.search.param, state.keyword);
            if (module.paginated) { query.set('page', state.page); query.set('size', state.size); }
            const suffix = query.toString() ? '?' + query.toString() : '';
            const data = await api('GET', module.endpoint + suffix);

            const rows = Array.isArray(data) ? data : (data && data.records) || [];
            const total = Array.isArray(data) ? data.length : (data && data.total) || rows.length;
            $('#countHint').textContent = `共 ${total} 条`;

            if (!rows.length) {
                wrap.innerHTML = '<div class="empty"><i class="fa-regular fa-folder-open"></i>暂无数据</div>';
                $('#pagination').style.display = 'none';
                return;
            }

            let html = '<table class="songs-table"><thead><tr>';
            module.columns.forEach((col) => {
                const cls = (col.type === 'center' || col.type === 'index') ? ' class="col-center"' : '';
                const style = col.width ? ` style="width:${col.width}px"` : '';
                html += `<th${cls}${style}>${esc(col.label)}</th>`;
            });
            html += '<th class="col-op" style="width:180px">操作</th></tr></thead><tbody>';

            // 序号跨页连续：第 1 页 1..10，第 2 页 11..20
            const serialBase = module.paginated ? (state.page - 1) * state.size : 0;

            rows.forEach((row, index) => {
                html += `<tr class="song-row" data-index="${index}">`;
                module.columns.forEach((col) => {
                    const cls = (col.type === 'center' || col.type === 'index') ? ' class="col-center"' : '';
                    html += `<td${cls}>${cellHtml(row, col, serialBase + index + 1)}</td>`;
                });
                html += `<td class="col-op">
                    <button class="action-btn-small" data-act="edit">编辑</button>
                    <button class="action-btn-small danger-btn" data-act="del">删除</button>
                </td></tr>`;
            });
            html += '</tbody></table>';
            wrap.innerHTML = html;
            // 表格行淡入（no-motion 下为惰性，等于不生效）
            revealAll('#tableWrap tbody .song-row', wrap, 100, 'reveal-fade');

            $$('#tableWrap tbody tr').forEach((tr) => {
                const row = rows[Number(tr.dataset.index)];
                $('[data-act="edit"]', tr).addEventListener('click', () => openForm(module, row, load));
                $('[data-act="del"]', tr).addEventListener('click', () => removeRow(module, row, load));
            });

            // 分页
            const pager = $('#pagination');
            if (module.paginated && total > state.size) {
                const pages = Math.ceil(total / state.size);
                pager.style.display = 'flex';
                $('#pageInfo').textContent = `第 ${state.page} 页 / 共 ${pages} 页`;
                const prev = $('#prevPage'), next = $('#nextPage');
                prev.disabled = state.page <= 1;
                next.disabled = state.page >= pages;
                prev.onclick = () => { state.page--; load(); };
                next.onclick = () => { state.page++; load(); };
            } else {
                pager.style.display = 'none';
            }
        } catch (err) {
            wrap.innerHTML = `<div class="empty"><i class="fa-solid fa-triangle-exclamation"></i>${esc(err.message)}</div>`;
        }
    }

    $('#createBtn').addEventListener('click', () => openForm(module, null, load));
    $('#refreshTableBtn').addEventListener('click', load);

    const searchInput = $('#searchInput');
    if (searchInput) {
        let timer = null;
        searchInput.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                state.keyword = searchInput.value.trim();
                state.page = 1;
                load();
            }, 320);
        });
    }

    await load();
}

/* ======================== 六、通用表单弹窗 ============================== */

const idOf = (row) => (row ? val(row, 'id') : null);

// 当前弹窗的关闭函数。遮罩点击只注册一次全局监听，避免监听器不断累积
let currentModalClose = null;

/**
 * 打开弹窗。
 * @param {string} html    弹窗内容
 * @param {string} variant 追加到 .modal-container 上的类名，
 *                         例如 'form-modal'（表单弹窗：更宽 + 双列 + 头尾固定）
 */
function openModal(html, variant = '') {
    const mask = $('#modalMask');
    const box = $('#modalBox');
    box.className = 'modal-container' + (variant ? ' ' + variant : '');
    box.innerHTML = html;

    // 遮罩是常驻的（用 visibility 控制可见性），加 .show 就会显示。
    // 有动效时用 rAF 让浏览器先渲染一次「未显示」的状态，过渡才会生效；
    // 关闭动效时直接加类，省掉一帧。
    if (noMotion()) mask.classList.add('show');
    else requestAnimationFrame(() => mask.classList.add('show'));

    const close = () => {
        mask.classList.remove('show');
        currentModalClose = null;
        closeAllBodyMenus();      // 表单里的自画下拉菜单挂在 body 上，不跟着弹窗消失，得手动收
        // 有动效时等淡出动画走完再清空；关闭动效时立即清空
        setTimeout(() => {
            if (!currentModalClose) {
                $('#modalBox').innerHTML = '';
                box.className = 'modal-container';
            }
        }, noMotion() ? 0 : 340);
    };
    currentModalClose = close;
    return { close };
}

// 点击遮罩空白处关闭（全局只注册一次）
$('#modalMask').addEventListener('click', (e) => {
    if (e.target === $('#modalMask') && currentModalClose) currentModalClose();
});

/* ============ 动态下拉选项（选项来自接口，如「所属专辑」）============ */
// 缓存 60 秒：避免每开一次表单就打一次接口，又能及时看到新加的专辑
const _selectOptionsCache = {};

async function loadSelectOptions(field) {
    const cached = _selectOptionsCache[field.optionsUrl];
    if (cached && Date.now() - cached.time < 60000) return cached.list;

    const data = await api('GET', field.optionsUrl);
    const rows = Array.isArray(data) ? data : ((data && data.records) || []);
    const list = [['', field.optionsEmptyLabel || '未设置']]
        .concat(rows.map((r) => field.optionsMap ? field.optionsMap(r) : [String(r.id), String(r.name || r.id)])
            .filter((pair) => pair[0]));

    _selectOptionsCache[field.optionsUrl] = { list, time: Date.now() };
    return list;
}

async function openForm(module, row, afterSave) {
    const isEdit = !!row;

    // 带 optionsUrl 的字段：先把选项拉下来再渲染（拉取失败则只有「空」一项，不阻塞表单）
    for (const field of module.fields) {
        if (field.type === 'select' && field.optionsUrl) {
            try {
                field.options = await loadSelectOptions(field);
            } catch (err) {
                field.options = [['', field.optionsEmptyLabel || '未设置']];
            }
        }
    }

    let fieldsHtml = '';
    module.fields.forEach((field) => {
        const current = row ? val(row, field.key) : '';
        const required = isEdit ? field.required : (field.required || field.requiredOnCreate);
        const label = `${esc(field.label)}${required ? '<span class="req">*</span>' : ''}`;
        let control;

        if (field.type === 'file') {
            control = `<input type="file" id="f_${field.key}" accept="${esc(field.accept || '*/*')}">`;
            if (isEdit && current) {
                // 图片类附件（封面/头像）顺便把当前那张缩略显示出来，
                // 换之前先看得到旧的，不用翻路径猜。
                const isImage = String(field.accept || '').includes('image');
                control += isImage
                    ? `<div class="current-file">
                           <img class="current-thumb" src="${esc(assetSrc(current))}" alt=""
                                onerror="this.style.opacity=.25;this.title='图片不存在'">
                           <span>当前：${esc(current)}</span>
                       </div>`
                    : `<div class="tip">当前：${esc(current)}</div>`;
            }
        } else if (field.type === 'select') {
            control = `<select class="select" id="f_${field.key}">` +
                field.options.map(([value, text]) =>
                    `<option value="${esc(value)}" ${String(current ?? '') === String(value) ? 'selected' : ''}>${esc(text)}</option>`
                ).join('') + '</select>';
        } else if (field.type === 'number') {
            control = `<input class="input" type="number" step="${esc(field.step || 'any')}"
                        id="f_${field.key}" value="${current ?? ''}" placeholder="请输入${esc(field.label)}">`;
        } else if (field.type === 'password') {
            control = `<input class="input" type="text" id="f_${field.key}" autocomplete="new-password"
                        placeholder="${isEdit ? '留空则不修改' : '请输入密码'}">`;
        } else if (field.type === 'textarea') {
            control = `<textarea class="input textarea" id="f_${field.key}" rows="${field.rows || 6}"
                        placeholder="请输入${esc(field.label)}">${esc(current ?? '')}</textarea>`;
        } else {
            control = `<input class="input" type="text" id="f_${field.key}"
                        value="${esc(current ?? '')}" placeholder="请输入${esc(field.label)}">`;
        }

        // 文件类型和长路径字段占满整行，其余两列并排
        const fullClass = (field.full || field.type === 'file') ? ' full' : '';
        fieldsHtml += `<div class="form-item${fullClass}"><label for="f_${field.key}">${label}</label>
            ${control}${field.tip ? `<div class="tip">${esc(field.tip)}</div>` : ''}</div>`;
    });

    const modal = openModal(`
        <button class="close-btn" id="modalClose">&times;</button>
        <div class="modal-head">
            <h2 class="modal-title">${isEdit ? '编辑' : '新增'}${esc(module.title.replace('管理', ''))}</h2>
        </div>
        <form id="modalForm" class="modal-form">
            <div class="modal-body">
                <div class="form-grid">${fieldsHtml}</div>
                <div class="form-error" id="formError"></div>
            </div>
            <div class="modal-foot">
                <button type="button" class="btn" id="cancelBtn">取消</button>
                <button type="submit" class="btn btn-primary" id="saveBtn">
                    <i class="fa-solid fa-check"></i> 保存</button>
            </div>
        </form>`, 'form-modal');

    $('#modalClose').addEventListener('click', modal.close);
    $('#cancelBtn').addEventListener('click', modal.close);

    // 表单里的原生 select 升级成自画下拉（视觉与整站一致，原生 select 只负责存值）
    module.fields.forEach((field) => {
        if (field.type !== 'select') return;
        const el = $('#f_' + field.key);
        if (el) enhanceFormSelect(el);
    });

    $('#modalForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorBox = $('#formError');
        const saveBtn = $('#saveBtn');
        errorBox.textContent = '';

        const values = {};
        const files = {};

        for (const field of module.fields) {
            const el = $('#f_' + field.key);
            if (!el) continue;
            const required = isEdit ? field.required : (field.required || field.requiredOnCreate);

            if (field.type === 'file') {
                if (el.files && el.files[0]) files[field.key] = el.files[0];
                else if (!isEdit && required) { errorBox.textContent = `请选择${field.label}`; return; }
                continue;
            }

            const value = el.value.trim();
            if (required && !value) { errorBox.textContent = `请填写${field.label}`; el.focus(); return; }

            if (field.key === 'password') {
                if (value && value.length < 6) { errorBox.textContent = '密码至少 6 位'; return; }
                if (!value) {
                    if (isEdit) continue;              // 编辑时留空 = 不修改
                    errorBox.textContent = '请填写密码'; return;
                }
            }

            if (field.type === 'number' && value !== '') values[field.key] = Number(value);
            // alwaysSend：空值也要提交（用于「清除关联」这类场景）
            else if (value !== '' || field.alwaysSend) values[field.key] = value;
        }

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 保存中…';

        try {
            if (module.upload) {
                const form = new FormData();
                Object.entries(values).forEach(([k, v]) => form.append(k, v));
                Object.entries(files).forEach(([k, f]) => form.append(k, f));
                if (isEdit) await api('PUT', module.upload.update(idOf(row)), form);
                else await api('POST', module.upload.create, form);
            } else if (module.key === 'users' && !isEdit) {
                await api('POST', '/users/register', values);
            } else if (isEdit) {
                values.id = idOf(row);
                await api('PUT', module.endpoint, values);
            } else {
                await api('POST', module.endpoint, values);
            }
            toast((isEdit ? '修改' : '新增') + '成功');
            modal.close();
            if (afterSave) setTimeout(afterSave, noMotion() ? 0 : 280);
        } catch (err) {
            errorBox.textContent = err.message;
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> 保存';
        }
    });

    const first = $('#modalForm input:not([type=file]), #modalForm select');
    if (first) first.focus();
}

function removeRow(module, row, reload) {
    const label = val(row, 'musicName') || val(row, 'name') || val(row, 'albumName') || val(row, 'account') || idOf(row);

    const modal = openModal(`
        <button class="close-btn" id="modalClose">&times;</button>
        <h2 class="modal-title">确认删除</h2>
        <p style="text-align:center;color:rgba(255,255,255,.8);line-height:1.9;font-size:14px">
            确定要删除 <b style="color:var(--c-primary)">${esc(label)}</b> 吗？<br>
            <span style="font-size:13px;color:rgba(255,255,255,.45)">此操作不可撤销。</span>
        </p>
        <div class="form-error" id="formError"></div>
        <div class="modal-foot">
            <button class="btn" id="cancelBtn">取消</button>
            <button class="btn danger-btn" id="okBtn"><i class="fa-solid fa-trash"></i> 确认删除</button>
        </div>`);

    $('#modalClose').addEventListener('click', modal.close);
    $('#cancelBtn').addEventListener('click', modal.close);

    $('#okBtn').addEventListener('click', async () => {
        try {
            // module.remove 可以省略；省略时按 REST 惯例用 {endpoint}/{id}
            const removeUrl = module.remove
                ? module.remove(idOf(row))
                : `${module.endpoint}/${idOf(row)}`;
            await api('DELETE', removeUrl);
            toast('已删除');
            modal.close();
            setTimeout(reload, noMotion() ? 0 : 280);
        } catch (err) {
            $('#formError').textContent = err.message;
        }
    });
}

/* ======================== 七、榜单 / 热门 配置 ========================== */

/* ======================== 选歌下拉（自画，带搜索）========================
 * 为什么不用原生 <select>：
 *   最长的一个下拉要塞 69 首歌。原生 <select> 展开后的弹出层是浏览器
 *   单独绘制的一个内部文档 —— 高度、滚动条样式、毛玻璃全都控制不了，
 *   列表一铺就占满半屏，滚动条还是系统默认的白条。
 * 所以这里自己画一个：
 *   · 高度可控（约 8 行），不再铺满整屏
 *   · 滚动条是页面自己的，可以做成细的深色玻璃条
 *   · 菜单真毛玻璃（backdrop-filter 生效）
 *   · 多一个搜索框：69 首里按歌名或歌手过滤，比一行行滚快得多
 * 关键设计：每个下拉里仍保留一个隐藏的原生 <select>，只用来"存值"。
 *   它照样带 class="select" 和 data-pos / data-chart，
 *   所以保存配置的逻辑完全不用改。
 * ====================================================================== */

const songText = (song) => `${val(song, 'musicName')} — ${val(song, 'singerName')}`;

function closeAllPickers() {
    document.querySelectorAll('.pick.open').forEach((p) => p.classList.remove('open'));
}

function initPickers(root) {
    root.querySelectorAll('.pick').forEach((pick) => {
        const store = pick.querySelector('.pick-store');
        const btn = pick.querySelector('.pick-btn');
        const label = pick.querySelector('.pick-label');
        const search = pick.querySelector('.pick-search');
        const list = pick.querySelector('.pick-list');
        const empty = pick.querySelector('.pick-empty');
        const opts = Array.from(list.querySelectorAll('.pick-opt'));

        const syncOn = () => opts.forEach((o) => o.classList.toggle('on', o.dataset.value === store.value));

        btn.addEventListener('click', () => {
            const wasOpen = pick.classList.contains('open');
            closeAllPickers();
            if (wasOpen) return;
            pick.classList.add('open');
            // 下方空间不够就往上展开，免得菜单被内容区底边裁掉
            const box = pick.getBoundingClientRect();
            pick.classList.toggle('up', box.bottom + 300 > window.innerHeight);
            search.value = '';
            opts.forEach((o) => { o.hidden = false; });
            if (empty) empty.hidden = true;
            search.focus();
            // 把当前选中项滚到可见位置，省得每次都要自己找
            const cur = list.querySelector('.pick-opt.on');
            if (cur) list.scrollTop = Math.max(0, cur.offsetTop - list.clientHeight / 2);
        });

        search.addEventListener('input', () => {
            const q = search.value.trim().toLowerCase();
            let shown = 0;
            opts.forEach((o) => {
                const hit = !q || o.textContent.toLowerCase().includes(q);
                o.hidden = !hit;
                if (hit) shown++;
            });
            if (empty) empty.hidden = shown > 0;
            list.scrollTop = 0;
        });

        opts.forEach((o) => o.addEventListener('click', () => {
            store.value = o.dataset.value;
            label.textContent = o.textContent;
            syncOn();
            closeAllPickers();
        }));

        syncOn();
    });

    // 点击下拉以外的任何地方 / 按 Esc 都关掉：只绑一次，避免重复渲染后叠加监听
    if (!initPickers.bound) {
        initPickers.bound = true;
        document.addEventListener('click', (e) => {
            if (!e.target.closest || !e.target.closest('.pick')) closeAllPickers();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeAllPickers();
        });
    }
}

/* ==========================================================================
   表单下拉的自画升级：把 openForm 渲染的原生 <select> 换成自画下拉
   （复用十三节 .pick 的玻璃菜单 / 搜索 / 悬停高亮视觉）。
   与选歌下拉的两点不同：
   1. 菜单直接挂在 body 上、position:fixed —— 表单弹窗的 .modal-body 是
      滚动容器、.modal-container 带 transform（fixed 的包含块会被它劫持），
      菜单放弹窗里无论绝对还是固定定位都会错位/被裁，挂 body 最稳。
   2. 原生 select 仍留在原地（.pick-store 隐藏）只负责存值，保存逻辑不用改。
   ========================================================================== */
const _bodyPickMenus = [];                       // { wrap, menu, close }

function closeAllBodyMenus() {
    _bodyPickMenus.forEach((i) => i.close());
}

function enhanceFormSelect(select) {
    if (!select || select.dataset.pickReady) return;
    select.dataset.pickReady = '1';

    // 清理：表单已关闭的旧菜单（弹窗 innerHTML 清空后 wrap 已不在文档里）
    for (let i = _bodyPickMenus.length - 1; i >= 0; i--) {
        if (!document.body.contains(_bodyPickMenus[i].wrap)) {
            _bodyPickMenus[i].menu.remove();
            _bodyPickMenus.splice(i, 1);
        }
    }

    const options = [...select.options].map((o) => ({ value: o.value, text: o.textContent }));
    const wrap = document.createElement('div');
    wrap.className = 'pick pick-fixed';
    wrap.innerHTML = `
        <button type="button" class="pick-btn">
            <span class="pick-label"></span>
            <i class="fa-solid fa-chevron-down pick-caret"></i>
        </button>`;
    select.classList.add('pick-store');           // .pick-store = display:none !important
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);

    const btn = wrap.querySelector('.pick-btn');
    const label = wrap.querySelector('.pick-label');
    const sync = () => {
        const c = select.options[select.selectedIndex];
        label.textContent = c ? c.textContent : '';
    };
    sync();

    const menu = document.createElement('div');
    menu.className = 'pick-menu body-menu';
    menu.innerHTML = `
        <div class="pick-search-wrap">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input class="pick-search" type="text" placeholder="搜索…" autocomplete="off">
        </div>
        <div class="pick-list">
            ${options.map((o) =>
                `<button type="button" class="pick-opt${o.value === select.value ? ' on' : ''}" data-value="${esc(o.value)}">${esc(o.text)}</button>`).join('')}
        </div>`;
    document.body.appendChild(menu);

    const list = menu.querySelector('.pick-list');
    const search = menu.querySelector('.pick-search');
    let isOpen = false;

    const close = () => {
        if (!isOpen) return;
        isOpen = false;
        menu.classList.remove('show');
    };

    const openMenu = () => {
        closeAllPickers();                        // 收起其它自画下拉（选歌那种）
        closeAllBodyMenus();
        isOpen = true;
        menu.classList.add('show');

        /* ---- 定位 ----
           宽度不再死锁成按钮宽度（那样长专辑名会被省略号切掉），改成
           「按钮宽度当下限、内容自适应、最多 480px / 不超出视口」；
           位置做视口钳制：右侧放不下往左收，上下都放不下时取空间大的
           一侧并限制高度，让列表内部滚动。 */
        const r = btn.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const GAP = 8;
        const PAD = 12;

        menu.style.minWidth = Math.round(r.width) + 'px';
        menu.style.maxWidth = Math.min(vw - PAD * 2, 480) + 'px';
        menu.style.maxHeight = (vh - PAD * 2) + 'px';

        const mw = menu.offsetWidth;
        const mh = menu.offsetHeight;

        // 水平：默认与按钮左对齐，右边溢出就往左挪
        let left = Math.min(r.left, vw - mw - PAD);
        menu.style.left = Math.max(PAD, Math.round(left)) + 'px';

        // 垂直：优先向下展开；下方空间不足且上方更宽裕时向上
        const spaceBelow = vh - r.bottom - GAP - PAD;
        const spaceAbove = r.top - GAP - PAD;
        if (mh <= spaceBelow || spaceBelow >= spaceAbove) {
            menu.style.top = Math.round(r.bottom + GAP) + 'px';
        } else {
            menu.style.top = Math.max(PAD, Math.round(r.top - GAP - mh)) + 'px';
        }

        search.value = '';
        [...list.children].forEach((o) => { o.hidden = false; });
        const cur = list.querySelector('.pick-opt.on');
        if (cur) list.scrollTop = Math.max(0, cur.offsetTop - list.clientHeight / 2);
        search.focus();                           // 放在定位之后：菜单已就位，focus 不会再引发滚动
    };

    btn.addEventListener('click', () => (isOpen ? close() : openMenu()));

    search.addEventListener('input', () => {
        const q = search.value.trim().toLowerCase();
        [...list.children].forEach((o) => {
            o.hidden = !!q && !o.textContent.toLowerCase().includes(q);
        });
        list.scrollTop = 0;
    });

    list.addEventListener('click', (e) => {
        const opt = e.target.closest('.pick-opt');
        if (!opt) return;
        select.value = opt.dataset.value;         // 原生 select 存值，提交逻辑照旧
        sync();
        // 高亮要跟着迁移，否则关掉再打开，勾还停在最初那一项
        [...list.children].forEach((o) => o.classList.toggle('on', o === opt));
        close();
    });

    _bodyPickMenus.push({ wrap, menu, close });

    // 全局关闭：点外面 / Esc / 缩放（只绑一次；滚动单独绑，见下）
    if (!enhanceFormSelect.bound) {
        enhanceFormSelect.bound = true;
        document.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.pick') && !e.target.closest('.body-menu')) closeAllBodyMenus();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeAllBodyMenus();
        });
        window.addEventListener('resize', closeAllBodyMenus);
        // 滚动时收起，避免菜单和按钮脱节。
        // 注意排除菜单自己的内部滚动（.pick-list），否则在列表里滚动会被立刻关掉
        window.addEventListener('scroll', (e) => {
            if (!e.target.closest || !e.target.closest('.pick-list')) closeAllBodyMenus();
        }, true);
    }
}

async function renderChartsModule(module) {
    const content = $('#content');
    content.innerHTML = `<div class="page-title"><i class="fa-solid ${module.icon}"></i>
        <h3>${esc(module.title)}</h3></div>
        <div class="panel"><div class="loading"><span class="loader"></span>加载中…</div></div>`;

    const isHot = module.key === 'hotSongs';

    try {
        const musicData = await api('GET', '/music?size=500');
        const songs = Array.isArray(musicData) ? musicData : (musicData && musicData.records) || [];

        // 隐藏的原生 select：只存值，供保存逻辑读取
        const optionsHtml = (selectedId) => {
            let html = '<option value="">— 未选择 —</option>';
            songs.forEach((song) => {
                const id = val(song, 'id');
                html += `<option value="${id}" ${Number(selectedId) === Number(id) ? 'selected' : ''}>
                    ${esc(songText(song))}</option>`;
            });
            return html;
        };

        // 自画的下拉：按钮 + 搜索框 + 选项列表
        const pickerHtml = (selectedId, storeAttrs) => {
            const sel = songs.find((song) => Number(val(song, 'id')) === Number(selectedId));
            const optHtml = songs
                .map((song) => `<button type="button" class="pick-opt" data-value="${val(song, 'id')}">${esc(songText(song))}</button>`)
                .join('');
            return `<div class="pick">
                <select class="select pick-store" style="display:none" ${storeAttrs}>${optionsHtml(selectedId)}</select>
                <button type="button" class="pick-btn">
                    <span class="pick-label">${sel ? esc(songText(sel)) : '— 未选择 —'}</span>
                    <i class="fa-solid fa-chevron-down pick-caret"></i>
                </button>
                <div class="pick-menu">
                    <div class="pick-search-wrap">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input class="pick-search" type="text" placeholder="搜索歌名或歌手…" autocomplete="off">
                    </div>
                    <div class="pick-list">
                        <button type="button" class="pick-opt" data-value="">— 未选择 —</button>
                        ${optHtml}
                    </div>
                    <div class="pick-empty" hidden>没有匹配的歌曲</div>
                </div>
            </div>`;
        };

        const config = await api('GET', module.endpoint);
        const rows = Array.isArray(config) ? config : [];

        let blocksHtml = '';
        if (isHot) {
            for (let chart = 0; chart < 5; chart++) {
                let rowsHtml = '';
                for (let pos = 0; pos < 3; pos++) {
                    const found = rows.find((r) => Number(val(r, 'chartIndex')) === chart
                        && Number(val(r, 'position')) === pos);
                    rowsHtml += `<div class="row"><span class="pos">${pos + 1}</span>
                        ${pickerHtml(found ? val(found, 'id') : '', `data-chart="${chart}" data-pos="${pos}"`)}</div>`;
                }
                blocksHtml += `<div class="chart-block">
                    <h4><span class="rank-no">${chart + 1}</span>${esc(RANK_NAMES[chart] || '榜单' + (chart + 1))}</h4>
                    ${rowsHtml}</div>`;
            }
        } else {
            for (let pos = 0; pos < 12; pos++) {
                const found = rows.find((r) => Number(val(r, 'position')) === pos);
                blocksHtml += `<div class="chart-block compact">
                    <h4><span class="rank-no">${pos + 1}</span></h4>
                    ${pickerHtml(found ? val(found, 'id') : '', `data-pos="${pos}"`)}</div>`;
            }
        }

        content.innerHTML = `
            <div class="page-title"><i class="fa-solid ${module.icon}"></i>
                <h3>${esc(module.title)}</h3>
                <span class="sub">共 ${songs.length} 首歌可选</span></div>
            <div class="panel">
                <div class="panel-head">
                    <h3>${isHot ? '5 个榜单 × 每榜 3 个位置' : '首页热门 12 个位置'}</h3>
                    <button class="btn btn-primary" id="saveConfig">
                        <i class="fa-solid fa-floppy-disk"></i> 保存配置</button>
                </div>
                <div class="chart-grid">${blocksHtml}</div>
                <p class="hint" style="margin-top:14px">
                    ${isHot ? '保存时按「榜单 + 位置」逐条更新。' : '保存时按位置逐条更新。'}
                </p>
            </div>`;

        revealAll('.chart-block', content);
        initPickers(content);      // 自画的下拉要绑事件（点击展开 / 搜索过滤 / 选中回填）
        revealAll('.panel', content);

        $('#saveConfig').addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const payload = [];
            if (isHot) {
                $$('#content select[data-chart]').forEach((sel) => {
                    if (sel.value) payload.push({
                        musicId: Number(sel.value),
                        chartIndex: Number(sel.dataset.chart),
                        position: Number(sel.dataset.pos),
                    });
                });
            } else {
                $$('#content select[data-pos]').forEach((sel) => {
                    if (sel.value) payload.push({ musicId: Number(sel.value), position: Number(sel.dataset.pos) });
                });
            }

            if (!payload.length) { toast('请至少选择一个位置', 'err'); return; }

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 保存中…';
            try {
                await api('PUT', module.endpoint, payload);
                toast(`已保存 ${payload.length} 项配置`);
            } catch (err) {
                toast(err.message, 'err');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> 保存配置';
            }
        });
    } catch (err) {
        content.innerHTML = `<div class="page-title"><i class="fa-solid ${module.icon}"></i>
            <h3>${esc(module.title)}</h3></div>
            <div class="panel"><div class="empty">
            <i class="fa-solid fa-triangle-exclamation"></i>${esc(err.message)}</div></div>`;
    }
}

/* ======================== 八、概览 & 统计 =============================== */

async function renderDashboard() {
    const content = $('#content');
    const cards = [
        { key: 'music', label: '歌曲总数', icon: 'fa-music', unit: '首' },
        { key: 'singers', label: '歌手数', icon: 'fa-microphone-lines', unit: '位' },
        { key: 'albums', label: '专辑数', icon: 'fa-compact-disc', unit: '张' },
        { key: 'users', label: '注册用户', icon: 'fa-users', unit: '人' },
        { key: 'purchases', label: '购买量', icon: 'fa-cart-shopping', unit: '张' },
        { key: 'favorites', label: '收藏总数', icon: 'fa-heart', unit: '条' },
    ];

    content.innerHTML = `
        <div class="page-title"><i class="fa-solid fa-gauge-high"></i>
            <h3>概览</h3><span class="sub">数据来自实时接口</span></div>
        <div class="stat-grid">
            ${cards.map((c) => `<div class="stat-card" id="card-${c.key}">
                <i class="fa-solid ${c.icon}"></i>
                <div class="label">${c.label}</div>
                <div class="value">—</div></div>`).join('')}
        </div>
        <div class="panel" style="margin-top:20px">
            <div class="panel-head"><h3>快捷入口</h3></div>
            <div class="toolbar">
                <a class="btn" href="./"><i class="fa-solid fa-house"></i> 打开前台</a>
            </div>
        </div>`;

    revealAll('.stat-card', content);
    revealAll('.panel', content);

    const jobs = [
        ['music', '/music?size=1', (d) => d && d.total],
        ['singers', '/singers', (d) => (Array.isArray(d) ? d.length : 0)],
        ['albums', '/albums', (d) => (Array.isArray(d) ? d.length : 0)],
        ['users', '/users', (d) => (Array.isArray(d) ? d.length : 0)],
        ['purchases', '/purchases/stats', (d) => Array.isArray(d)
            ? d.reduce((s, r) => s + Number(val(r, 'totalQuantity') || 0), 0) : 0],
        ['favorites', '/stats/singer-favorites', (d) => Array.isArray(d)
            ? d.reduce((s, r) => s + Number(val(r, 'count') || 0), 0) : 0],
    ];

    await Promise.all(jobs.map(async ([key, path, pick]) => {
        const card = $('#card-' + key);
        if (!card) return;
        try {
            const value = pick(await api('GET', path));
            const unit = cards.find((c) => c.key === key).unit;
            $('.value', card).innerHTML = `${value ?? '-'}<small>${unit}</small>`;
        } catch (err) {
            $('.value', card).innerHTML = '<small style="color:var(--c-primary)">读取失败</small>';
        }
    }));
}

/* 数据统计：两幅柱状图（ECharts）
   配色 / 圆角 / 描边 / 发光全部对齐前台「个人设置 → 专辑购买统计」那个图表：
   半透明红玻璃渐变 + 1.5px 红描边 + 柔和外发光，而不是实心亮红。 */
async function renderStats() {
    const content = $('#content');
    content.innerHTML = `
        <div class="page-title"><i class="fa-solid fa-chart-column"></i>
            <h3>数据统计</h3><span class="sub">ECharts 图表</span></div>
        <div class="panel">
            <div class="panel-head"><h3>各歌手收藏量</h3>
                <span class="hint">/stats/singer-favorites</span></div>
            <div class="chart-box" id="chartA"></div>
        </div>
        <div class="panel">
            <div class="panel-head"><h3>各专辑购买量</h3>
                <span class="hint">/stats/album-purchases</span></div>
            <div class="chart-box" id="chartB"></div>
        </div>`;

    revealAll('.panel', content);

    // 长名字截短，免得 X 轴标签挤成一团（个人设置里也是这么处理的）
    const shorten = (name) => {
        const n = String(name ?? '');
        if (n === 'The 1st Album XOXO (KISS&HUG)') return 'XOXO';
        if (n === 'Jay / Turn Of A Page') return 'Jay';
        return n.length > 6 ? n.slice(0, 5) + '…' : n;
    };

    async function draw(id, path, nameKey, valueKey, unit) {
        const dom = document.getElementById(id);
        try {
            const rows = await api('GET', path);
            if (!Array.isArray(rows) || !rows.length) {
                dom.innerHTML = '<div class="empty"><i class="fa-regular fa-chart-bar"></i>暂无数据</div>';
                return;
            }
            const top = rows.slice(0, 15);
            const names = top.map((row) => shorten(val(row, nameKey)));
            const values = top.map((row) => Number(val(row, valueKey) ?? 0));

            const chart = echarts.init(dom);
            chart.setOption({
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' },
                    formatter: (p) => `<b>${p[0].name}</b><br/>${unit}：${p[0].value}` },
                grid: { left: '2%', right: '3%', bottom: '6%', top: '15%', containLabel: true },
                xAxis: {
                    type: 'category', data: names,
                    axisLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, interval: 0 },
                    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
                    axisTick: { show: false },
                },
                yAxis: {
                    type: 'value', name: unit,
                    nameTextStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
                    axisLabel: { color: 'rgba(255,255,255,0.7)' },
                    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
                },
                series: [{
                    type: 'bar', data: values,
                    itemStyle: {
                        borderRadius: [8, 8, 0, 0],
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(255,120,120,0.25)' },
                            { offset: 0.5, color: 'rgba(228,57,60,0.15)' },
                            { offset: 1, color: 'rgba(228,57,60,0.06)' }]),
                        borderColor: 'rgba(255,100,100,0.5)', borderWidth: 1.5,
                        shadowBlur: 10, shadowColor: 'rgba(228,57,60,0.2)', shadowOffsetY: 2,
                    },
                    emphasis: { itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(228,57,60,0.4)' },
                            { offset: 1, color: 'rgba(228,57,60,0.15)' }]),
                        borderColor: 'rgba(255,130,130,0.75)', borderWidth: 2 } },
                    barMaxWidth: 50,
                    label: { show: true, position: 'top', color: 'rgba(255,255,255,0.55)', fontSize: 11 },
                }],
            });
            // 用 ResizeObserver 而不是 window.resize：
            // 侧栏折叠等情况下窗口尺寸没变、但容器变了，window.resize 抓不到。
            new ResizeObserver(() => chart.resize()).observe(dom);
        } catch (err) {
            dom.innerHTML = `<div class="empty"><i class="fa-solid fa-triangle-exclamation"></i>${esc(err.message)}</div>`;
        }
    }

    await draw('chartA', '/stats/singer-favorites', 'singer', 'count', '收藏数');
    await draw('chartB', '/stats/album-purchases', 'albumName', 'totalQuantity', '购买量（张）');
}

/* ======================== 九、导航与路由 ================================ */

let currentKey = 'dashboard';
const moduleByKey = (key) => MODULES.find((m) => m.key === key) || MODULES[0];

/** 生成侧栏导航项（每个管理模块一项） */
function buildNav() {
    const nav = $('#sideNav');
    // 清掉旧的导航项，保留里面的指示器元素
    $$('#sideNav .side-item').forEach((el) => el.remove());

    MODULES.forEach((m) => {
        const item = document.createElement('a');
        item.className = 'side-item';
        item.dataset.key = m.key;
        item.innerHTML = `<i class="fa-solid ${m.icon}"></i>${esc(m.title)}`;

        item.addEventListener('click', (e) => {
            e.preventDefault();
            openModule(m.key);
        });
        // 不再监听 mouseenter / mouseleave —— 侧栏指示器不跟随鼠标

        nav.appendChild(item);
    });
}

async function openModule(key) {
    const module = moduleByKey(key);
    currentKey = module.key;

    $$('#sideNav .side-item').forEach((item) => {
        item.classList.toggle('active', item.dataset.key === module.key);
    });
    updateSideIndicator($(`#sideNav .side-item[data-key="${module.key}"]`));
    if (location.hash !== '#/' + module.key) location.hash = '#/' + module.key;

    window.scrollTo({ top: 0, behavior: noMotion() ? 'auto' : 'smooth' });

    if (module.type === 'dashboard') await renderDashboard();
    else if (module.type === 'stats') await renderStats();
    else if (module.type === 'charts') await renderChartsModule(module);
    else await renderTable(module);
}

/* ======================== 登录状态 =====================================
 * 后台不再有自己的登录门（按需求整体移除）。
 *
 * 为什么：前台的登录状态已经能说明"当前是谁"，前台用管理员账号登录过，
 * 后台就直接可用 —— 再让管理员重输一次密码是多余的。
 * 这里只是复用前台的 localStorage 来显示"当前用户"，不做任何拦截。
 *
 * ⚠️ 安全性：这意味着 admin.html 本身不再鉴权，谁打开这个网址都能用。
 *    前台只是"藏起了入口"（非管理员看不到按钮），那不是保护。
 *    需要真正的保护，得在后端给写接口加 token / 角色校验。
 */
function frontendUser() {
    try {
        const account = localStorage.getItem('currentUser');
        if (!account) return null;
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find((u) => u.account === account) || null;
    } catch (err) {
        return null;
    }
}

function showApp(user) {
    $('#who').innerHTML = user
        ? `<i class="fa-solid fa-user"></i> <b>${esc(user.name || user.account)}</b>`
        : '<i class="fa-solid fa-circle-info"></i> 前台未登录';
    buildNav();
    const key = (location.hash || '').replace('#/', '') || 'dashboard';
    openModule(key);          // openModule 内部会设置激活态与指示器位置
}

$('#logoutBtn').addEventListener('click', () => {
    // 后台没有自己的登录态，所以"退出登录"= 退出前台的登录并回到前台
    localStorage.removeItem('currentUser');
    location.href = './';
});

$('#reloadBtn').addEventListener('click', () => openModule(currentKey));

window.addEventListener('hashchange', () => {
    const key = (location.hash || '').replace('#/', '');
    if (key && key !== currentKey) openModule(key);
});

/* ======================== 启动 ========================================= */
(function init() {
    // 点击标志回到概览
    $('#logo').addEventListener('click', () => openModule('dashboard'));
    showApp(frontendUser());
})();
