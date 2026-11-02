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
        let avatarPath = user.avatar || './头像/1.png';
        if (avatarPath && !avatarPath.startsWith('data:') && !avatarPath.startsWith('http') && !avatarPath.startsWith('/') && !avatarPath.startsWith('./')) {
            avatarPath = './' + avatarPath;
        }

        loginArea.innerHTML = `
            <div class="user-info">
                <div class="avatar-wrapper" style="background-image: url('${avatarPath}');"></div>
                <span class="user-name">${escapeHTML(username)}</span>
            </div>
        `;

        const playerHeartIcon = document.getElementById('playerHeartIcon');
        const playerTag = document.querySelector('.player-right .hq-tag');
        const isNoMusic = !playerTitle || playerTitle.textContent === '暂无歌曲 请手动添加~';

        if (playerHeartIcon) playerHeartIcon.style.display = isNoMusic ? 'none' : 'inline-flex';
        if (playerTag) playerTag.style.display = isNoMusic ? 'none' : 'inline-block';

        const avatarWrapper = loginArea.querySelector('.avatar-wrapper');
        if (avatarWrapper) {
            avatarWrapper.addEventListener('click', openSettingsModal);
        }
    } else {
        loginArea.innerHTML = '<button class="login-btn">登录</button>';
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
