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
    // 旧 #playerToast 节点已删除，toast 统一走 js/common/toast.js
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
    if (lastPlayed && playerTitle && playerTotalTime && lastPlayed.title) {
        // 兼容旧数据：singer 缺失时，从播放列表 / 收藏夹里找回
        const savedPlaylist0 = JSON.parse(localStorage.getItem('yjay_playlist') || '[]');
        const savedFav0 = JSON.parse(localStorage.getItem('yjay_favorites') || '[]');
        const hint = savedPlaylist0.find(s => s.title === lastPlayed.title)
                  || savedFav0.find(f => f.title === lastPlayed.title) || {};
        if (!lastPlayed.singer) lastPlayed.singer = hint.singer || '';
        if (!lastPlayed.tag) lastPlayed.tag = hint.tag || 'HQ';
        // 找回后写回本地，避免下次再出现 undefined
        localStorage.setItem('yjay_last_played', JSON.stringify(lastPlayed));

        playerTitle.textContent = lastPlayed.singer
            ? `${lastPlayed.title} - ${lastPlayed.singer}`
            : (lastPlayed.title || '暂无歌曲 请手动添加~');
        playerTotalTime.textContent = lastPlayed.duration || '00:00';

        if (heartIcon) {
            heartIcon.style.display = 'inline-flex';

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
    const albumDetailModal = document.getElementById('albumDetailModal');

    const closeAllSideModals = (exceptModal = null) => {
        [
            { modal: playlistModal, btnId: 'myPlaylistBtn' },
            { modal: favoritesModal, btnId: 'myFavoritesBtn' },
            { modal: historyModal, btnId: 'playHistoryBtn' },
            { modal: singerModal, btnId: null },
            { modal: albumDetailModal, btnId: null }
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

    // 统一 toast：实现收敛到 js/common/toast.js（与 iframe 子页面同一套，
    // 样式见 css/toast.css 的 .yjay-toast）。这里保留 showPlayerToast
    // 这个名字作为别名，文件内十几个历史调用点不用改。
    window.showPlayerToast = function (message) {
        if (typeof window.showToast === 'function') {
            window.showToast(message);
        }
    };

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

        // 收藏以云端为准：页面加载后拉一次云端数据回写缓存，再重新校准红心
        if (typeof window.refreshFavoriteCache === 'function') {
            window.refreshFavoriteCache().then(() => initPlayerHeartStatus());
        }

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
        
        if (playerTitle) playerTitle.textContent = singer ? `${title} - ${singer}` : title;
        if (playerTotalTime && durationStr) playerTotalTime.textContent = durationStr;
        
        localStorage.setItem('yjay_last_played', JSON.stringify({
            title: title,
            singer: singer || '',
            duration: durationStr,
            tag: tag
        }));
        
        if (playerHeartIcon) playerHeartIcon.style.display = 'inline-flex';
        if (playerTag) playerTag.style.display = 'inline-block';

        if (shouldPlay) {
            const audioSrc = resolveMusicPath(title);
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
            playerHeartIcon.style.display = 'inline-flex';
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
        apiGet('/api/albums', '/albums')
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
                apiGet('/api/purchases?buyer=' + encodeURIComponent(buyer), '/purchases?buyer=' + encodeURIComponent(buyer))
                    .catch(function() { return []; })
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
                                    .catch(function() { return fetch('/api/purchases', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ albumName: name, buyerName: buyer, quantity: 1 }) }).then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); })
                                    .then(function() { showPlayerToast('已购买专辑：' + name); btn.innerHTML = '<i class="fas fa-check"></i> 已购买'; btn.disabled = true; })
                                    .catch(function() { showPlayerToast('购买失败，请重试'); });
                            });
                        });
                    });
            })
            .catch(function() { list.innerHTML = '<div style="width:100%;text-align:center;color:rgba(255,255,255,0.4);padding:40px;">加载失败</div>'; });
    }

    loadAlbums();

    /* ========================================================================
     * 专辑详情弹窗：点击专辑封面打开
     * 界面与歌手详情弹窗一致（html/albumpage.html 装在 iframe 里，
     * 外层 .modal-layer 会自动避让底部播放条）。
     * 专辑歌曲需要购买后才能查看：未购买时 iframe 内显示付费遮罩
     * （可在弹窗内直接购买），购买成功自动解锁歌曲列表。
     * ======================================================================== */
    (function initAlbumDetailModal() {
        var list = document.getElementById('albumList');
        var modal = document.getElementById('albumDetailModal');
        if (!list || !modal || list._albumDetailBound) return;
        list._albumDetailBound = true;

        var iframe = modal.querySelector('iframe');

        function openAlbumDetail(albumName, imgSrc) {
            var params = new URLSearchParams();
            params.set('album', albumName);
            if (imgSrc) params.set('img', imgSrc);
            iframe.src = 'html/albumpage.html?' + params.toString();
            closeAllSideModals(modal);
            modal.style.display = 'flex';
            setTimeout(function() { modal.classList.add('show'); }, 10);
            toggleBodyScroll(true);
        }

        // 事件委托：点的是封面图才打开
        list.addEventListener('click', function(e) {
            var cover = e.target.closest('.album-cover');
            if (!cover) return;
            var card = cover.closest('.album-card');
            if (!card) return;
            var nameEl = card.querySelector('.album-title');
            if (!nameEl) return;
            openAlbumDetail(nameEl.textContent, cover.getAttribute('src') || '');
        });

        // 关闭：右上角 × / 点击遮罩空白处
        function closeAlbumDetail() {
            modal.classList.remove('show');
            setTimeout(function() {
                modal.style.display = 'none';
                toggleBodyScroll(false);
            }, 300);
        }
        var closeBtn = document.getElementById('closeAlbumDetailBtn');
        if (closeBtn) closeBtn.addEventListener('click', closeAlbumDetail);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeAlbumDetail();
        });

        // 供搜索下拉等外部调用：按专辑名直接打开专辑详情弹窗
        window.openAlbumDetailByName = function(albumName, imgSrc) {
            if (!albumName) return;
            openAlbumDetail(albumName, imgSrc || '');
        };

        // 供 albumpage iframe 购买成功后调用：刷新卡片上的「已购买」状态
        window.markAlbumPurchased = function(albumName) {
            // 购买是 POST 出去的新数据，先清掉 purchases 的请求缓存再查
            if (typeof window.apiCacheInvalidate === 'function') window.apiCacheInvalidate('/purchases');
            var buyer = localStorage.getItem('currentUser') || '匿名用户';
            apiGet('/api/purchases?buyer=' + encodeURIComponent(buyer), '/purchases?buyer=' + encodeURIComponent(buyer))
                .catch(function() { return []; })
                .then(function(purchases) {
                    var boughtNames = (Array.isArray(purchases) ? purchases : [])
                        .map(function(p) { return p.albumName || p.album_name; });
                    list.querySelectorAll('.buy-btn').forEach(function(btn) {
                        if (boughtNames.indexOf(btn.getAttribute('data-album')) !== -1) {
                            btn.innerHTML = '<i class="fas fa-check"></i> 已购买';
                            btn.disabled = true;
                        }
                    });
                });
        };
    })();

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
