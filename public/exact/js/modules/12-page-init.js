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

    // 说明：原「热门 / 排行 / 歌手 / 专辑」区块上的管理员「编辑 · 刷新」按钮
    //       以及它们打开的编辑弹窗已全部移除。这些内容的维护统一放到后台管理页
    //       （admin.html），入口在「个人设置」里，仅管理员可见。

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
        // 退出不再二次确认：直接退出 + toast 提示（performLogout 内部）
        setTimeout(performLogout, 320);
    });
    document.getElementById('changePasswordForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        changeCurrentUserPassword();
    });

    // 说明：前台原有的「编辑用户 / 添加·编辑音乐 / 用户管理 / 音乐管理」
    //       弹窗与事件绑定已全部移除，相关数据维护统一在 admin.html 后台管理页完成。

    document.getElementById('reportLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof window.showPlayerToast === 'function') {
            window.showPlayerToast('作者暂未制作听歌报告...');
        } else {
            alert('作者暂未制作听歌报告...');
        }
    });

});

const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginTips = document.getElementById('loginTips');
const registerTips = document.getElementById('registerTips');
const agreementCheck = document.getElementById('agreementCheck');
const registerAgreementCheck = document.getElementById('registerAgreementCheck');
const registerAgreementItem = document.getElementById('registerAgreementItem');

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
        // 协议未勾选：红框提示 1.5s，引导用户先看协议再注册
        if (registerAgreementCheck && !registerAgreementCheck.checked) {
            registerTips.textContent = '请先阅读并勾选《用户服务协议》和《隐私政策》！';
            registerTips.className = 'tips error';
            if (registerAgreementItem) {
                registerAgreementItem.classList.add('warn');
                setTimeout(() => registerAgreementItem.classList.remove('warn'), 1500);
            }
            return;
        }

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
            if (registerAgreementCheck) registerAgreementCheck.checked = false;
            if (registerForm) registerForm.reset();
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
            // 收藏统一走数据库：登录后把本地缓存里的收藏合并上传（后端幂等去重）
            if (typeof window.mergeLocalFavoritesToCloud === 'function') {
                window.mergeLocalFavoritesToCloud();
            }
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

// 登录/注册弹窗 - 仅点击右上角 X 才关闭，点击遮罩层不关闭
window.addEventListener('click', (e) => {
    // 点击遮罩层不关闭弹窗（已禁用）
    // 只有点击右上角 closeLoginBtn / closeRegisterBtn 才能关闭
});
