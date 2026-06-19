const playlist = document.getElementById('playlist');
const clearBtn = document.getElementById('clearBtn');
const toast = document.getElementById('toast');

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

// 暴露全局函数给父窗口
window.addHistoryFromExternal = function(data) {
    // 如果当前显示的是“暂无播放历史”，先清空
    const emptyTips = playlist.querySelector('.empty-tips');
    if (emptyTips) {
        playlist.innerHTML = '';
    }

    // 检查是否已经存在相同歌曲
    const existingItems = playlist.querySelectorAll('.playlist-item');
    existingItems.forEach(item => {
        const name = item.querySelector('.song-name').textContent;
        const singer = item.querySelector('.song-singer').textContent;
        if (name === data.title && singer === data.singer) {
            item.remove(); // 先移除旧的，再加到最前面
        }
    });

    const newSongItem = document.createElement('li');
    newSongItem.className = 'playlist-item reveal active'; // 动态添加的直接显示，或者不加active让它触发一次
    
    newSongItem.innerHTML = `
        <button class="heart-btn"><i class="fa-solid fa-heart"></i></button>
        <div class="song-info">
            <div class="song-name-wrapper">
                <span class="song-name">${data.title}</span>
            </div>
            <span class="song-singer">${data.singer}</span>
        </div>
        <span class="song-duration">${data.duration}</span>
        <button class="play-btn" title="播放音乐"><i class="fa-solid fa-play"></i></button>
        <button class="delete-btn"><i class="fa-regular fa-trash-can"></i></button>
    `;

    playlist.insertBefore(newSongItem, playlist.firstChild);
    bindEvents(newSongItem);
    initHeartStatus(newSongItem.querySelector('.heart-btn'));
    
    // 保存到本地存储
    saveToLocalStorage();

    // 自动滚动到顶部
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
        modalBody.scrollTop = 0;
    }
};

window.addEventListener('DOMContentLoaded', initReveal);


function showToast(message) {
    // 优先使用父窗口的提示函数，确保提示框在屏幕中心
    if (window.parent && typeof window.parent.showPlayerToast === 'function') {
        window.parent.showPlayerToast(message);
        return;
    }

    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }
}

// 暴露给外部调用的函数
window.updatePlayingStatus = updatePlayingStatus;

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

// 初始化爱心状态
function initHeartStatus(targetBtn = null) {
    const saved = localStorage.getItem('yjay_favorites');
    if (!saved) return;
    
    const favorites = JSON.parse(saved);
    const btns = targetBtn ? [targetBtn] : document.querySelectorAll('.heart-btn');
    
    btns.forEach(btn => {
        const item = btn.closest('.playlist-item');
        const title = item.querySelector('.song-name').textContent.trim();
        const singer = item.querySelector('.song-singer').textContent.trim();
        const isFav = favorites.some(f => f.title === title && f.singer === singer);
        if (isFav) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function bindEvents(item) {
    const playBtn = item.querySelector('.play-btn');
    const heartBtn = item.querySelector('.heart-btn');
    const deleteBtn = item.querySelector('.delete-btn');

    playBtn?.addEventListener('click', function() {
        const songItem = this.closest('.playlist-item');
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
            playSong(this);
            setTimeout(() => updatePlayingStatus(), 50);
        }
    });
    
    heartBtn?.addEventListener('click', function() {
        this.classList.toggle('active');
        const songItem = this.closest('.playlist-item');
        const title = songItem.querySelector('.song-name').textContent;
        const singer = songItem.querySelector('.song-singer').textContent;
        const duration = songItem.querySelector('.song-duration').textContent;

        const isActive = this.classList.contains('active');
        if (window.parent && typeof window.parent.toggleFavorite === 'function') {
            window.parent.toggleFavorite(isActive, { title, singer, duration });
        }
        
        if (isActive) {
            showToast('已添加到收藏');
        } else {
            showToast('已取消收藏');
        }
    });
    
    deleteBtn?.addEventListener('click', function() {
        deleteHistory(this);
    });
}

// 播放歌曲函数
function playSong(btn) {
    const songItem = btn.closest('.playlist-item');
    const songName = songItem.querySelector('.song-name').textContent;
    const singerName = songItem.querySelector('.song-singer').textContent;
    const duration = songItem.querySelector('.song-duration').textContent;
    
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
    }
}

function deleteHistory(btn) {
    const item = btn.closest('.playlist-item');
    item.remove();
    
    // 如果删除后为空，显示提示
    if (playlist.children.length === 0) {
        playlist.innerHTML = '<div class="empty-tips" style="text-align: center; color: rgba(255,255,255,0.4); margin-top: 100px;">暂无播放历史</div>';
    }
    
    saveToLocalStorage();
    showToast('已从历史中移除');
}

// 暴露全局加载函数
window.loadFromLocalStorage = function() {
    const saved = localStorage.getItem('yjay_played');
    if (saved) {
        const history = JSON.parse(saved);
        if (history.length > 0) {
            playlist.innerHTML = '';
            history.forEach(data => {
                const li = document.createElement('li');
                li.className = 'playlist-item reveal active';
                li.innerHTML = `
                    <button class="heart-btn"><i class="fa-solid fa-heart"></i></button>
                    <div class="song-info">
                        <div class="song-name-wrapper">
                            <span class="song-name">${data.title}</span>
                        </div>
                        <span class="song-singer">${data.singer}</span>
                    </div>
                    <span class="song-duration">${data.duration}</span>
                    <button class="play-btn" title="播放音乐"><i class="fa-solid fa-play"></i></button>
                    <button class="delete-btn"><i class="fa-regular fa-trash-can"></i></button>
                `;
                playlist.appendChild(li);
                bindEvents(li);
                initHeartStatus(li.querySelector('.heart-btn'));
            });
            updatePlayingStatus();
            return;
        }
    }
    playlist.innerHTML = '<div class="empty-tips" style="text-align: center; color: rgba(255,255,255,0.4); margin-top: 100px;">暂无播放历史</div>';
};

// 保存到本地存储
function saveToLocalStorage() {
    const items = playlist.querySelectorAll('.playlist-item');
    const history = Array.from(items).map(item => ({
        title: item.querySelector('.song-name').textContent.trim(),
        singer: item.querySelector('.song-singer').textContent.trim(),
        duration: item.querySelector('.song-duration').textContent.trim()
    }));
    localStorage.setItem('yjay_played', JSON.stringify(history));
}

// 绑定初始项
window.loadFromLocalStorage();

// 监听清除按钮
if (clearBtn) {
    clearBtn.addEventListener('click', function() {
        if (playlist && (playlist.children.length === 0 || playlist.querySelector('.empty-tips'))) {
            showToast('历史记录已为空');
            return;
        }
        if (playlist) {
            playlist.innerHTML = '<div class="empty-tips" style="text-align: center; color: rgba(255,255,255,0.4); margin-top: 100px;">暂无播放历史</div>';
            saveToLocalStorage();
        }
        showToast('已清空播放历史');
    });
}
// 行滑动指示器
(function(){
    var wrap = document.getElementById('historyTableWrap'), ind = document.getElementById('historyTableIndicator');
    if(!wrap||!ind)return;
    wrap.addEventListener('mouseover',function(e){
        var row = e.target.closest('.playlist-item');
        if(!row)return;
        var wr=wrap.getBoundingClientRect(),rr=row.getBoundingClientRect();
        ind.style.opacity='1'; ind.style.top=(rr.top-wr.top)+'px'; ind.style.height=rr.height+'px';
    });
    wrap.addEventListener('mouseleave',function(){ind.style.opacity='0';});
})();
