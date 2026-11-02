// ======================== 个人设置 / 修改密码 / 退出登录 ========================
// 说明：本文件原含前台的「音乐管理」表格与添加/编辑音乐弹窗逻辑，
//       这些功能已统一迁到后台管理页（admin.html），前台相关代码已删除。

function renderSettingsModal() {
    const currentUser = getCurrentUserRecord();
    const avatarEl = document.getElementById('settingsAvatar');
    const nameEl = document.getElementById('settingsName');
    const accountEl = document.getElementById('settingsAccount');
    const roleEl = document.getElementById('settingsRole');

    if (!currentUser) return;

    let avatarPath = currentUser.avatar || './头像/1.png';
    if (avatarPath && !avatarPath.startsWith('data:') && !avatarPath.startsWith('http') && !avatarPath.startsWith('/') && !avatarPath.startsWith('./')) {
        avatarPath = './' + avatarPath;
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

    // 后台管理入口（原来挂在顶部导航栏上，谁都能看见、谁都能点）。
    // 现在放在个人设置里「名字下方」—— 也就是原来「用户管理 / 音乐管理」
    // 两个按钮所在的位置，并且只有管理员才显示。
    // 外层 #adminBtnsInline 由 renderAdminPanel() 置为 flex/none，
    // 这里再把链接本身置为 inline-flex（两处都设，任一处失效也藏得住）。
    // 注意：这只是"藏起入口"。真正的拦截在 admin.html 自己的登录门里 ——
    //      非管理员即使手动输入 admin.html 的网址，也会被要求用管理员账号登录。
    const adminEntryEl = document.getElementById('settingsAdminEntry');
    if (adminEntryEl) {
        adminEntryEl.style.display = currentUser.role === 'admin' ? 'inline-flex' : 'none';
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
    var input = e.target;
    var file = input.files && input.files[0];
    input.value = '';   // 清空，允许下次选择同一个文件也能触发 change
    if (!file) return;

    var currentUser = getCurrentUserRecord();
    if (!currentUser || !currentUser.id) { showPlayerToast('请先登录后再修改头像'); return; }
    if (!/^image\//.test(file.type || '')) { showPlayerToast('请选择图片文件'); return; }
    if (file.size > 5 * 1024 * 1024) { showPlayerToast('图片大小不能超过 5MB'); return; }

    var avatarEl = document.getElementById('settingsAvatar');

    // 先本地预览，体验更即时
    var reader = new FileReader();
    reader.onload = function() {
        if (avatarEl) avatarEl.style.backgroundImage = 'url(\'' + reader.result + '\')';
    };
    reader.readAsDataURL(file);

    // 重命名成唯一文件名再上传：Python 版后端对同名文件会直接复用旧图，
    // 不改名的话换一张同名图片头像会"看起来没变"
    var extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
    var ext = extMatch ? extMatch[1].toLowerCase() : 'png';
    var safeName = 'avatar_' + currentUser.id + '_' + Date.now() + '.' + ext;
    var renamed = new File([file], safeName, { type: file.type });

    try {
        var form = new FormData();
        form.append('file', renamed);
        var resp = await fetch('/api/users/' + currentUser.id + '/avatar', {
            method: 'POST',
            body: form
        });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        var updated = await resp.json();
        syncStoredUser(updated);

        var path = updated.avatar || './头像/1.png';
        if (path.indexOf('/') !== 0 && path.indexOf('./') !== 0) path = './' + path;
        path += (path.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();   // 破浏览器缓存
        if (avatarEl) avatarEl.style.backgroundImage = 'url(\'' + path + '\')';
        var ta = document.querySelector('.avatar-wrapper');
        if (ta) ta.style.backgroundImage = 'url(\'' + path + '\')';
        showPlayerToast('头像已更新');
    } catch (err) {
        showPlayerToast('头像上传失败，请重试');
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

    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.classList.remove('show');
        setTimeout(() => settingsModal.style.display = 'none', 300);
    }
    toggleBodyScroll(false);
    // 退出确认弹窗已删除：点退出直接生效，toast 告知结果
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
}

// 原 openLogoutModal（「是否退出登录？」确认弹窗）已删除：
// 退出不再二次确认，设置弹窗的退出按钮直接调 performLogout + toast。
