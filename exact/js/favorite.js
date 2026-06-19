// 获取DOM元素
const playlist = document.getElementById('playlist');
const toast = document.getElementById('toast');
const refreshBtn = document.getElementById('refreshBtn');

// 显示提示框函数
function showToast(message) {
    // 优先使用父窗口的提示函数，确保提示框在屏幕中心
    if (window.parent && typeof window.parent.showPlayerToast === 'function') {
        window.parent.showPlayerToast(message);
        return;
    }
    
    // 备选方案：使用本地提示框
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// 处理刷新逻辑
if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
        this.classList.add('loading');
        
        // 模拟加载延迟
        setTimeout(() => {
            loadFromLocalStorage();
            this.classList.remove('loading');
            showToast('已刷新收藏列表');
        }, 500);
    });
}

// 保存到本地存储
function saveToLocalStorage() {
    const items = [];
    playlist.querySelectorAll('.playlist-item').forEach(item => {
        const heart = item.querySelector('.heart-btn');
        if (heart && heart.classList.contains('active')) {
            items.push({
                title: item.querySelector('.song-name').textContent.trim(),
                singer: item.querySelector('.song-singer').textContent.trim(),
                duration: item.querySelector('.song-duration').textContent.trim()
            });
        }
    });
    localStorage.setItem('yjay_favorites', JSON.stringify(items));
}

// 初始化 IntersectionObserver 用于入场动画
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

// 初始观察现有项
function initReveal() {
    document.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
    });
}

// 更新播放状态高亮
function updatePlayingStatus() {
    let playingTitle = "";
    let playingSinger = "";
    let isGlobalPaused = true;
    
    if (window.parent && window.parent.document) {
        const playerTitleEl = window.parent.document.getElementById('playerSongTitle');
        if (playerTitleEl && playerTitleEl.textContent !== '暂无歌曲 请手动添加~') {
            const fullTitle = playerTitleEl.textContent.trim();
            const parts = fullTitle.split(' - ');
            playingTitle = parts[0] || "";
            playingSinger = parts[1] || "";
        }

        if (window.parent.audio) {
            isGlobalPaused = window.parent.audio.paused;
        }
    }

    const items = document.querySelectorAll('.playlist-item');
    items.forEach(item => {
        const titleEl = item.querySelector('.song-name');
        const singerEl = item.querySelector('.song-singer');
        if (!titleEl || !singerEl) return;

        const title = titleEl.textContent.trim();
        const singer = singerEl.textContent.trim();

        const playIcon = item.querySelector('.play-btn i');
        if (title === playingTitle && singer === playingSinger) {
            if (playIcon) {
                playIcon.className = isGlobalPaused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
            }
        } else if (playIcon) {
            playIcon.className = 'fa-solid fa-play';
        }
    });
}

// 播放歌曲函数
function playSong(btn) {
    const songItem = btn.closest('.playlist-item');
    if (!songItem) return;

    const songName = songItem.querySelector('.song-name').textContent.trim();
    const singerName = songItem.querySelector('.song-singer').textContent.trim();
    const duration = songItem.querySelector('.song-duration').textContent.trim();
    
    // 检查是否是当前正在播放的歌曲
    if (songItem.classList.contains('playing')) {
        if (window.parent && typeof window.parent.toggleAudioPlay === 'function') {
            window.parent.toggleAudioPlay();
            return;
        }
    }

    // 随机生成音质标签
    const tags = ['HQ', '全景声', '臻品母带'];
    const randomTag = tags[Math.floor(Math.random() * tags.length)];
    
    // 调用父窗口的播放函数
    if (window.parent && typeof window.parent.playSingleSong === 'function') {
        window.parent.playSingleSong(songName, singerName, duration, randomTag);
        // 播放后立即更新本地高亮
        setTimeout(() => updatePlayingStatus(), 50);
    }
}

// 绑定爱心按钮事件
function bindHeartEvent(btn) {
    btn.addEventListener('click', function() {
        const songItem = this.closest('.playlist-item');
        if (!songItem) return;

        const title = songItem.querySelector('.song-name').textContent.trim();
        const singer = songItem.querySelector('.song-singer').textContent.trim();
        const duration = songItem.querySelector('.song-duration').textContent.trim();
        
        const isActive = this.classList.contains('active');
        
        if (window.parent && typeof window.parent.toggleFavorite === 'function') {
            window.parent.toggleFavorite(!isActive, {
                title: title,
                singer: singer,
                duration: duration
            }, true);
            
            if (isActive) {
                // 不再立即移除 DOM，只取消激活状态
                this.classList.remove('active');
                saveToLocalStorage();
                showToast('已取消收藏，刷新后将从列表移除');
            } else {
                this.classList.add('active');
                saveToLocalStorage();
                showToast('已收藏该歌曲');
            }
            
            if (typeof window.parent.updatePlayerHeartStatus === 'function') {
                window.parent.updatePlayerHeartStatus(!isActive, title, singer);
            }
        } else {
            if (isActive) {
                this.classList.remove('active');
                showToast('已取消收藏，刷新后将从列表移除');
            } else {
                this.classList.add('active');
                showToast('已收藏该歌曲');
            }
            saveToLocalStorage();
        }
    });
}

function bindDeleteEvent(btn) {
    btn.addEventListener('click', function() {
        const songItem = this.closest('.playlist-item');
        if (!songItem) return;

        const title = songItem.querySelector('.song-name').textContent.trim();
        const singer = songItem.querySelector('.song-singer').textContent.trim();
        const duration = songItem.querySelector('.song-duration').textContent.trim();

        // 模拟取消收藏的效果，因为在收藏列表中“删除”等同于“取消收藏”
        if (window.parent && typeof window.parent.toggleFavorite === 'function') {
            window.parent.toggleFavorite(false, {
                title: title,
                singer: singer,
                duration: duration
            }, true);
            
            // 立即移除
            songItem.remove();
            saveToLocalStorage();
            // 如果列表空了，显示暂无数据
            if (playlist.querySelectorAll('.playlist-item').length === 0) {
                playlist.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.4); margin-top: 100px;">暂无收藏歌曲</div>';
            }
            showToast('已从收藏中移除');
            
            if (typeof window.parent.updatePlayerHeartStatus === 'function') {
                window.parent.updatePlayerHeartStatus(false, title, singer);
            }
        } else {
            songItem.remove();
            saveToLocalStorage();
            showToast('已从收藏中移除');
        }
    });
}

// 播放按钮事件委托：播放或暂停切换
playlist.addEventListener('click', function(e) {
    var btn = e.target.closest('.play-btn');
    if (!btn) return;
    var songItem = btn.closest('.playlist-item');
    if (!songItem) return;

    // 检查是否为当前正在播放的歌曲
    var isCurrentlyPlaying = false;
    if (window.parent && window.parent.document) {
        var playerTitleEl = window.parent.document.getElementById('playerSongTitle');
        if (playerTitleEl) {
            var fullTitle = playerTitleEl.textContent.trim();
            var parts = fullTitle.split(' - ');
            var currentTitle = parts[0] || '';
            var currentSinger = parts[1] || '';
            var itemTitle = songItem.querySelector('.song-name').textContent.trim();
            var itemSinger = songItem.querySelector('.song-singer').textContent.trim();
            isCurrentlyPlaying = (itemTitle === currentTitle && itemSinger === currentSinger);
        }
    }

    if (isCurrentlyPlaying) {
        if (window.parent && window.parent.toggleAudioPlay) {
            window.parent.toggleAudioPlay();
        }
    } else {
        playSong(btn);
    }
});

// 修改 loadFromLocalStorage 以支持动画
function loadFromLocalStorage(noAnimation = false) {
    const saved = localStorage.getItem('yjay_favorites');
    
    if (saved !== null) {
        const items = JSON.parse(saved);
        if (items.length === 0) {
            playlist.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.4); margin-top: 100px;">暂无收藏歌曲</div>';
            return;
        }
        
        let htmlContent = '';
        items.forEach((data, index) => {
            const className = noAnimation ? 'playlist-item active' : `playlist-item reveal delay-${(index % 6) * 50 + 50}`;
            
            htmlContent += `
                <li class="${className}">
                    <button class="heart-btn active"><i class="fa-solid fa-heart"></i></button>
                    <div class="song-info">
                        <div class="song-name-wrapper">
                            <span class="song-name">${data.title}</span>
                        </div>
                        <span class="song-singer">${data.singer}</span>
                    </div>
                    <span class="song-duration">${data.duration}</span>
                    <button class="play-btn" title="播放音乐"><i class="fa-solid fa-play"></i></button>
                    <button class="delete-btn"><i class="fa-regular fa-trash-can"></i></button>
                </li>
            `;
        });
        
        playlist.innerHTML = htmlContent;
        
        // 重新绑定事件
        const itemElements = playlist.querySelectorAll('.playlist-item');
        itemElements.forEach(item => {
            if (!noAnimation) {
                revealObserver.observe(item);
            }
            bindHeartEvent(item.querySelector('.heart-btn'));
            bindDeleteEvent(item.querySelector('.delete-btn'));
        });
        updatePlayingStatus();
    } else {
        // 如果 localStorage 为空，显示暂无收藏
        playlist.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.4); margin-top: 100px;">暂无收藏歌曲</div>';
    }
}

function addFavoriteFromExternal(data) {
    const existingItems = playlist.querySelectorAll('.playlist-item');
    let exists = false;
    existingItems.forEach(item => {
        const nameEl = item.querySelector('.song-name');
        const singerEl = item.querySelector('.song-singer');
        if (!nameEl || !singerEl) return;

        const name = nameEl.textContent.trim();
        const singer = singerEl.textContent.trim();
        if (name === data.title.trim() && singer === data.singer.trim()) {
            exists = true;
            const heart = item.querySelector('.heart-btn');
            if (heart && !heart.classList.contains('active')) {
                heart.classList.add('active');
            }
        }
    });

    if (exists) {
        saveToLocalStorage();
        return;
    }

    // 如果之前显示的是"暂无收藏"，先清空
    if (playlist.querySelector('div')) {
        playlist.innerHTML = '';
    }

    const newSongItem = document.createElement('li');
    newSongItem.className = 'playlist-item reveal active';
    
    newSongItem.innerHTML = `
        <button class="heart-btn active"><i class="fa-solid fa-heart"></i></button>
        <div class="song-info">
            <div class="song-name-wrapper">
                <span class="song-name">${data.title}</span>
                <span class="playing-tag"><i class="fa-solid fa-volume-high"></i> 正在播放</span>
            </div>
            <span class="song-singer">${data.singer}</span>
        </div>
        <span class="song-duration">${data.duration}</span>
        <button class="play-btn" title="播放音乐"><i class="fa-solid fa-play"></i></button>
        <button class="delete-btn"><i class="fa-regular fa-trash-can"></i></button>
    `;

    playlist.insertBefore(newSongItem, playlist.firstChild);
    bindHeartEvent(newSongItem.querySelector('.heart-btn'));
    bindDeleteEvent(newSongItem.querySelector('.delete-btn'));
    
    saveToLocalStorage();
    showToast(`已收藏: ${data.title}`);
}

function removeFavoriteFromExternal(data) {
    const existingItems = playlist.querySelectorAll('.playlist-item');
    existingItems.forEach(item => {
        const nameEl = item.querySelector('.song-name');
        const singerEl = item.querySelector('.song-singer');
        if (!nameEl || !singerEl) return;

        const name = nameEl.textContent.trim();
        const singer = singerEl.textContent.trim();
        if (name === data.title.trim() && singer === data.singer.trim()) {
            item.remove();
        }
    });
    
    if (playlist.querySelectorAll('.playlist-item').length === 0) {
        playlist.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.4); margin-top: 100px;">暂无收藏歌曲</div>';
    }
    
    saveToLocalStorage();
    showToast(`已取消收藏: ${data.title}`);
}

// 暴露全局函数
window.loadFromLocalStorage = loadFromLocalStorage;
window.addFavoriteFromExternal = addFavoriteFromExternal;
window.removeFavoriteFromExternal = removeFavoriteFromExternal;
window.updatePlayingStatus = updatePlayingStatus;

// 页面加载初始化
window.addEventListener('DOMContentLoaded', () => {
    // 绑定初始项
    document.querySelectorAll('.playlist-item').forEach(item => {
        bindHeartEvent(item.querySelector('.heart-btn'));
        bindDeleteEvent(item.querySelector('.delete-btn'));
    });

    // 初始化
    loadFromLocalStorage(true);
    initReveal();
});

// 行滑动指示器
(function(){
    var wrap = document.getElementById('favTableWrap'), ind = document.getElementById('favTableIndicator');
    if(!wrap||!ind)return;
    wrap.addEventListener('mouseover',function(e){
        var row = e.target.closest('.playlist-item');
        if(!row)return;
        var wr=wrap.getBoundingClientRect(),rr=row.getBoundingClientRect();
        ind.style.opacity='1'; ind.style.top=(rr.top-wr.top)+'px'; ind.style.height=rr.height+'px';
    });
    wrap.addEventListener('mouseleave',function(){ind.style.opacity='0';});
})();
