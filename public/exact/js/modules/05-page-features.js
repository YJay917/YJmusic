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
 * 功能：点击添加按钮，将歌曲加入播放列表（播放列表由 iframe 承载）
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
/* =============================================================================
 * 收藏数据统一：数据库为唯一数据源，localStorage 仅作缓存
 * =============================================================================
 * refreshFavoriteCache()      登录用户：拉云端列表回写缓存并返回；失败/游客降级读缓存
 * mergeLocalFavoritesToCloud()登录成功时调用：把本地缓存里云端没有的收藏补传上去
 * （游客没有 userId，收藏只存本地，登录后会被自动合并到云端）
 * ============================================================================= */
window.refreshFavoriteCache = async function() {
    const localList = () => {
        try { return JSON.parse(localStorage.getItem('yjay_favorites') || '[]'); }
        catch (e) { return []; }
    };
    const currentUser = (typeof getCurrentUserRecord === 'function') ? getCurrentUserRecord() : null;
    if (!currentUser || !currentUser.id) return localList();   // 游客：本地即数据源

    try {
        const cloud = await apiRequest('/favorites/' + currentUser.id);
        if (!Array.isArray(cloud)) return localList();
        // 云端为准，回写缓存（换设备/清缓存后收藏自动恢复）
        const list = cloud.map(f => ({
            title: f.title || '',
            singer: f.singer || '',
            duration: f.duration || '00:00'
        })).filter(f => f.title);
        localStorage.setItem('yjay_favorites', JSON.stringify(list));
        return list;
    } catch (e) {
        return localList();   // 后端不可用：继续用缓存
    }
};

window.mergeLocalFavoritesToCloud = async function() {
    const currentUser = (typeof getCurrentUserRecord === 'function') ? getCurrentUserRecord() : null;
    if (!currentUser || !currentUser.id) return;

    let cloud = [];
    try {
        cloud = await apiRequest('/favorites/' + currentUser.id);
    } catch (e) { return; }   // 云端不可达就不动本地数据
    if (!Array.isArray(cloud)) return;

    const keyOf = (f) => (f.title || '') + '::' + (f.singer || '');
    const cloudKeys = new Set(cloud.map(keyOf));
    let local = [];
    try { local = JSON.parse(localStorage.getItem('yjay_favorites') || '[]'); } catch (e) { local = []; }

    // 本地有、云端没有 → 补传（后端 add 幂等，重复也不会插重）
    const toUpload = local.filter(f => f.title && !cloudKeys.has(keyOf(f)));
    await Promise.all(toUpload.map(f =>
        apiRequest('/favorites', {
            method: 'POST',
            body: JSON.stringify({ userId: currentUser.id, title: f.title, singer: f.singer, duration: f.duration || '00:00' })
        }).catch(() => {})
    ));

    // 统一用云端数据回写缓存
    await window.refreshFavoriteCache();
    if (toUpload.length) {
        if (typeof showPlayerToast === 'function') showPlayerToast(`已同步 ${toUpload.length} 首本地收藏到云端`);
    }
};

window.toggleFavorite = function(isAdding, data, skipRefresh = false) {
    const currentUser = getCurrentUserRecord();
    if (!currentUser || !currentUser.id) {
        // 游客：降级为本地收藏，登录后由 mergeLocalFavoritesToCloud 合并上云
        let favorites = [];
        try { favorites = JSON.parse(localStorage.getItem('yjay_favorites') || '[]'); } catch (e) { favorites = []; }
        if (isAdding) {
            const exists = favorites.some(f => f.title === data.title && f.singer === data.singer);
            if (!exists) favorites.unshift({ title: data.title, singer: data.singer, duration: data.duration || '00:00' });
        } else {
            favorites = favorites.filter(f => !(f.title === data.title && f.singer === data.singer));
        }
        localStorage.setItem('yjay_favorites', JSON.stringify(favorites));
        return;
    }

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
const rightArrow = document.getElementById('rightArrow');

if (carouselList && rightArrow) {
    const cards = carouselList.querySelectorAll('.recommendation-card');
    const firstCardWidth = 300;
    const otherCardWidth = 172;
    const gap = 12;

    let currentIndex = 0;
    const maxIndex = 2;   // 保持原逻辑：只在这 3 个位置之间切换

    function updateCarousel() {
        const offset = currentIndex === 0
            ? 0
            : firstCardWidth + gap + (currentIndex - 1) * (otherCardWidth + gap);

        const containerWidth = carouselList.parentElement.offsetWidth;
        const totalWidth = firstCardWidth + (cards.length - 1) * (otherCardWidth + gap);
        const maxOffset = Math.max(0, totalWidth - containerWidth);

        carouselList.style.transform = `translateX(-${Math.min(offset, maxOffset)}px)`;
    }

    rightArrow.addEventListener('click', () => {
        if (window.isModalOpen || document.body.classList.contains('modal-open')) return;
        currentIndex = currentIndex < maxIndex ? currentIndex + 1 : 0;
        updateCarousel();
    });

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
        return apiGet(url, fallback);
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

    // 接口必须走 /api 前缀：8080 由后端剥前缀，5173 由 Vite 代理转发。
    // 裸写 /singers 在 5173 上会被 Vite 的 SPA 兜底返回 index.html（状态 200），
    // r.json() 解析失败 → 走 catch → 歌手区块整块空白。
    tryFetch('/api/singers')
        .then(renderDB)
        .catch(function() {
            singerListContainer.innerHTML = '<div class="empty-tip">加载失败，请检查后端服务是否启动</div>';
        });
})();
