// 获取DOM元素
const playlist = document.getElementById('playlist');

// 歌手列表 (后备使用)
const singers = ['余豪冉', '杨启飞', '万子扬','叶其弦','林建宇'];

// 歌曲库：包含真实存在的歌曲及其信息
const availableSongs = [
    { title: '特别的人', singer: '方大同', duration: '04:19' },
    { title: '蒲公英的约定', singer: '周杰伦', duration: '04:07' },
    { title: '爱错', singer: '王力宏', duration: '03:58' },
    { title: '达尔文', singer: '林俊杰', duration: '04:06' },
    { title: '心率 (Like a dream)', singer: '鹿晗', duration: '03:40' },
    { title: '唯一', singer: 'G.E.M. 邓紫棋', duration: '04:13' },
    { title: '孤独患者', singer: '陈奕迅', duration: '04:33' },
    { title: '我怀念的', singer: '孙燕姿', duration: '04:49' },
    { title: '咆哮 (Gowl)', singer: 'EXO', duration: '03:29' },
    { title: '起风了 (旧版)', singer: '买辣椒也用券', duration: '05:12' },
    { title: 'love story', singer: 'Taylor Swift', duration: '03:56' },
    { title: 'always online', singer: '林俊杰', duration: '03:45' },
    { title: '七里香', singer: '周杰伦', duration: '04:59' },
    { title: '偏爱', singer: '张芸京', duration: '03:32' },
    { title: '多远都要在一起', singer: 'G.E.M.邓紫棋', duration: '04:36' },
    { title: '海阔天空', singer: 'BEYOND', duration: '05:25' },
    { title: '天外来物', singer: '薛之谦', duration: '04:17' },
    { title: '富士山下', singer: '陈奕迅', duration: '04:18' },
    { title: '明日坐标', singer: '林俊杰', duration: '03:54' },
    { title: 'What a Day', singer: '蔡徐坤', duration: '02:50' },
    { title: '麦恩莉', singer: '方大同', duration: '03:52' },
    { title: '关键词', singer: '林俊杰', duration: '03:33' },
    { title: '一路向北', singer: '周杰伦', duration: '04:52' },
    { title: '等你下课', singer: '周杰伦', duration: '04:30' },
    { title: '可惜没如果', singer: '林俊杰', duration: '04:58' },
    { title: '我们的明天', singer: '鹿晗', duration: '03:48' },
    { title: '光年之外', singer: 'G.E.M.邓紫棋', duration: '03:55' },
    { title: '晴天', singer: '周杰伦', duration: '04:29' },
    { title: '夜曲', singer: '周杰伦', duration: '03:46' },
    { title: '搁浅', singer: '周杰伦', duration: '04:00' },
    { title: '安静', singer: '周杰伦', duration: '05:34' },
    { title: '明明就', singer: '周杰伦', duration: '04:20' },
    { title: '稻香', singer: '周杰伦', duration: '03:43' },
    { title: '最伟大的作品', singer: '周杰伦', duration: '04:04' },
    { title: '告白气球', singer: '周杰伦', duration: '03:35' },
    { title: '花海', singer: '周杰伦', duration: '04:24' },
    { title: '反方向的钟', singer: '周杰伦', duration: '04:17' },
    { title: '爱情废柴', singer: '周杰伦', duration: '04:46' },
    { title: '说好不哭', singer: '周杰伦', duration: '03:42' },
    { title: '说好的幸福呢', singer: '周杰伦', duration: '04:16' }
];

// 生成3-5分钟随机时长（格式：m:ss）
function getRandomDuration() {
    const minutes = Math.floor(Math.random() * 3) + 3;
    const seconds = Math.floor(Math.random() * 60);
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${minutes}:${formattedSeconds}`;
}

// 随机获取歌手名字
function getRandomSinger() {
    const randomIndex = Math.floor(Math.random() * singers.length);
    return singers[randomIndex];
}

// 保存到本地存储
function saveToLocalStorage() {
    const items = [];
    const allItems = playlist.querySelectorAll('.playlist-item');
    allItems.forEach((item, index) => {
        items.push({
            title: item.querySelector('.song-name').textContent.trim(),
            singer: item.querySelector('.song-singer').textContent.trim(),
            duration: item.querySelector('.song-duration').textContent.trim()
        });

        // 实时更新置顶按钮样式，不需要重新渲染整个列表
        const pinBtn = item.querySelector('.pin-song-btn');
        if (pinBtn) {
            if (index === 1) {
                pinBtn.style.color = '#b91c1c';
            } else {
                pinBtn.style.color = '';
            }
        }
    });
    localStorage.setItem('yjay_playlist', JSON.stringify(items));
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

// 从本地存储加载
function loadFromLocalStorage(noAnimation = false) {
    const saved = localStorage.getItem('yjay_playlist');

    if (saved !== null && saved !== '[]') {
        const items = JSON.parse(saved);
        let htmlContent = '';

        items.forEach((data, index) => {
            const className = noAnimation ? 'playlist-item active' : `playlist-item reveal delay-${(index % 6) * 50 + 50}`;
            const pinBtnStyle = index === 1 ? ' style="color: #b91c1c;"' : '';

            htmlContent += `
                <li class="${className}">
                    <button class="heart-btn"><i class="fa-solid fa-heart"></i></button>
                    <div class="song-info">
                        <div class="song-name-wrapper">
                            <span class="song-name">${data.title}</span>
                            <span class="playing-tag" style="display:none;">正在播放</span>
                        </div>
                        <span class="song-singer">${data.singer}</span>
                    </div>
                    <span class="song-duration">${data.duration}</span>
                    <button class="pin-song-btn" title="置顶"${pinBtnStyle}><i class="fa-solid fa-thumbtack"></i></button>
                    <button class="play-btn" title="播放音乐"><i class="fa-solid fa-play"></i></button>
                    <button class="delete-song-btn"><i class="fa-regular fa-trash-can"></i></button>
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
            bindDeleteEvent(item.querySelector('.delete-song-btn'));
            bindHeartEvent(item.querySelector('.heart-btn'));
            bindPinEvent(item.querySelector('.pin-song-btn'));
        });
    } else {
        playlist.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.4); margin-top: 100px;">播放列表为空</div>';
    }
    initHeartStatus();
    updatePlayingStatus();
}

window.addEventListener('DOMContentLoaded', initReveal);

// 添加歌曲函数
function addSong(manualData = null) {
    let songName, singerName, duration;

    if (manualData) {
        songName = manualData.title;
        singerName = manualData.singer;
        duration = manualData.duration;
    } else {
        // 手动输入 UI 已移除，仅支持外部调用
        return;
    }

    // 重复添加检测
    const items = Array.from(playlist.querySelectorAll('.playlist-item'));
    const isDuplicate = items.some(item => {
        const name = item.querySelector('.song-name').textContent.trim();
        const singer = item.querySelector('.song-singer').textContent.trim();
        return name === songName && singer === singerName;
    });

    if (isDuplicate) {
        showToast('歌单中已存在该歌曲');
        return;
    }

    const newSongItem = document.createElement('li');
        newSongItem.className = 'playlist-item';
        newSongItem.innerHTML = `
            <button class="heart-btn"><i class="fa-solid fa-heart"></i></button>
            <div class="song-info">
                <div class="song-name-wrapper">
                    <span class="song-name">${songName}</span>
                    <span class="playing-tag" style="display:none;">正在播放</span>
                </div>
                <span class="song-singer">${singerName}</span>
            </div>
            <span class="song-duration">${duration}</span>
        <button class="pin-song-btn" title="置顶"><i class="fa-solid fa-thumbtack"></i></button>
            <button class="play-btn" title="播放音乐"><i class="fa-solid fa-play"></i></button>
        <button class="delete-song-btn"><i class="fa-regular fa-trash-can"></i></button>
    `;

    const playingItem = playlist.querySelector('.playlist-item.playing');
    if (playingItem) {
        // 如果有正在播放的歌曲，插入到它下面
        playlist.insertBefore(newSongItem, playingItem.nextSibling);
    } else {
        // 如果没有正在播放的歌曲，插入到最顶端
        playlist.insertBefore(newSongItem, playlist.firstChild);
    }
    bindDeleteEvent(newSongItem.querySelector('.delete-song-btn'));
    bindHeartEvent(newSongItem.querySelector('.heart-btn'));
    bindPinEvent(newSongItem.querySelector('.pin-song-btn'));

    // 保存到本地
    saveToLocalStorage();
    updatePlayingStatus();

    // 添加后自动滚动到顶部
    const modalBody = document.querySelector('.modal-body');
    modalBody.scrollTop = 0;

    if (manualData) {
        showToast(`已将 ${songName} 添加到播放列表`);
    }
}

// 暴露全局函数给父窗口
window.addSongFromExternal = addSong;
window.loadFromLocalStorage = loadFromLocalStorage;
window.initHeartStatus = initHeartStatus;
window.updatePlayingStatus = updatePlayingStatus;

// 更新播放状态高亮
function updatePlayingStatus() {
    let playingTitle = "";
    let playingSinger = "";

    if (window.parent && window.parent.document) {
        const playerTitleEl = window.parent.document.getElementById('playerSongTitle');
        if (playerTitleEl && playerTitleEl.textContent !== '暂无歌曲 请手动添加~') {
            const fullTitle = playerTitleEl.textContent.trim();
            const parts = fullTitle.split(' - ');
            playingTitle = parts[0] || "";
            playingSinger = parts[1] || "";
        }
    }

    const items = document.querySelectorAll('.playlist-item');
    let matchedAny = false;
    let matchedItem = null;

    items.forEach(item => {
        const title = item.querySelector('.song-name').textContent.trim();
        const singer = item.querySelector('.song-singer').textContent.trim();
        const tag = item.querySelector('.playing-tag');

        if (title === playingTitle && singer === playingSinger && playingTitle) {
            item.classList.add('playing');
            if (tag) tag.style.display = 'inline-block';
            matchedAny = true;
            matchedItem = item;

            // 更新播放按钮图标和提示
            const playBtn = item.querySelector('.play-btn');
            const playIcon = playBtn ? playBtn.querySelector('i') : null;
            if (playIcon && window.parent && window.parent.audio) {
                if (window.parent.audio.paused) {
                    playIcon.className = 'fa-solid fa-play';
                    playBtn.title = '播放音乐';
                } else {
                    playIcon.className = 'fa-solid fa-pause';
                    playBtn.title = '暂停音乐';
                }
            }
        } else {
            item.classList.remove('playing');
            if (tag) tag.style.display = 'none';
            // 非播放行重置为播放图标
            const pb = item.querySelector('.play-btn i');
            if (pb) pb.className = 'fa-solid fa-play';
        }
    });

    // 匹配到的歌曲移到第一行
    if (matchedItem && matchedItem !== playlist.firstChild) {
        playlist.insertBefore(matchedItem, playlist.firstChild);
        saveToLocalStorage();
    }

    // 无匹配时默认第一首为正在播放
    if (!matchedAny && items.length > 0) {
        const firstItem = playlist.querySelector('.playlist-item');
        if (firstItem) {
            firstItem.classList.add('playing');
            const tag = firstItem.querySelector('.playing-tag');
            if (tag) tag.style.display = 'inline-block';
        }
    }
}

// 播放按钮点击：正在播放则暂停，否则播放该歌曲
playlist.addEventListener('click', (e) => {
    const btn = e.target.closest('.play-btn');
    if (!btn) return;

    const songItem = btn.closest('.playlist-item');
    if (songItem && songItem.classList.contains('playing')) {
        // 正在播放中，切换暂停/播放
        if (window.parent && window.parent.toggleAudioPlay) {
            window.parent.toggleAudioPlay();
            setTimeout(() => {
                if (window.parent.audio) {
                    showToast(window.parent.audio.paused ? '已暂停播放' : '正在播放音乐');
                }
            }, 50);
        }
    } else {
        // 播放该歌曲
        playSong(btn);
    }
});

// 初始化爱心状态
function initHeartStatus() {
    const saved = localStorage.getItem('yjay_favorites');
    if (saved) {
        const favorites = JSON.parse(saved);
        const heartBtns = document.querySelectorAll('.heart-btn');
        heartBtns.forEach(btn => {
            const songItem = btn.closest('.playlist-item');
            if (!songItem) return;
            const songName = songItem.querySelector('.song-name').textContent;
            const singerName = songItem.querySelector('.song-singer').textContent;
            const isFav = favorites.some(f => f.title === songName && f.singer === singerName);
            if (isFav) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

// 播放歌曲函数
function playSong(btn) {
    const songItem = btn.closest('.playlist-item');
    const songName = songItem.querySelector('.song-name').textContent;
    const singerName = songItem.querySelector('.song-singer').textContent;
    const duration = songItem.querySelector('.song-duration').textContent;

    // 随机生成音质标签
    const tags = ['HQ', '全景声', '臻品母带'];
    const randomTag = tags[Math.floor(Math.random() * tags.length)];

    // 调用父窗口的播放函数
    if (window.parent && typeof window.parent.playSingleSong === 'function') {
        window.parent.playSingleSong(songName, singerName, duration, randomTag);
        showToast(`正在播放: ${songName}`);
        // 播放后立即更新本地高亮
        setTimeout(() => updatePlayingStatus(), 50);
    }
}

// 置顶歌曲函数 (下一首播放逻辑：移动到列表最顶部)
function pinSong(btn) {
    const songItem = btn.closest('.playlist-item');
    const playlist = document.getElementById('playlist');
    const items = playlist.querySelectorAll('.playlist-item');

    if (items.length <= 1) return;

    // 检查该歌曲是否正在播放 (正在播放的歌曲现在位于列表末尾)
    let playingTitle = "";
    if (window.parent && window.parent.document) {
        const playerTitleEl = window.parent.document.getElementById('playerSongTitle');
        if (playerTitleEl && playerTitleEl.textContent !== '暂无歌曲 请手动添加~') {
            playingTitle = playerTitleEl.textContent.split(' - ')[0].trim();
        }
    }

    const currentItemTitle = songItem.querySelector('.song-name').textContent.trim();

    // 如果点击的是正在播放的歌曲，提醒用户
    if (playingTitle === currentItemTitle) {
        showToast('当前正在播放该歌曲');
        return;
    }

    // 将该项移动到合适的位置
    const firstItem = playlist.querySelector('.playlist-item');
    const isFirstPlaying = firstItem && firstItem.classList.contains('playing');

    if (isFirstPlaying) {
        // 如果第一首正在播放，则置顶到第二位（成为下一首播放）
        if (songItem !== firstItem.nextSibling) {
            playlist.insertBefore(songItem, firstItem.nextSibling);
        }
    } else {
        // 如果没有正在播放的歌曲（不应发生），则移到最顶端
        if (songItem !== playlist.firstChild) {
            playlist.insertBefore(songItem, playlist.firstChild);
        }
    }

    // 保存状态并显示提示
    saveToLocalStorage();
    showToast('该歌曲已置顶');
    updatePlayingStatus();

    // 自动滚动到顶部
    const modalBody = document.querySelector('.modal-body');
    modalBody.scrollTop = 0;
}

// 绑定置顶按钮事件
function bindPinEvent(pinBtn) {
    if (!pinBtn) return;
    pinBtn.addEventListener('click', function() {
        pinSong(this);
    });
}

// 删除歌曲函数
function deleteSong(btn) {
    const songItem = btn.closest('.playlist-item');
    const isPlaying = songItem.classList.contains('playing');
    const nextSongItem = songItem.nextElementSibling;

    songItem.remove();
    saveToLocalStorage();
    showToast('删除成功');

    // 如果删除的是正在播放的歌曲
    if (isPlaying) {
        // 如果存在下一首，则自动播放下一首（即上移后的歌曲）
        if (nextSongItem && nextSongItem.classList.contains('playlist-item')) {
            const nextPlayBtn = nextSongItem.querySelector('.play-btn');
            if (nextPlayBtn) {
                playSong(nextPlayBtn);
            }
        } else {
            // 如果没有下一首，停止播放器状态
            if (window.parent && typeof window.parent.stopGlobalMusic === 'function') {
                window.parent.stopGlobalMusic();
            }
        }
    }

    updatePlayingStatus();
}

// 显示提示框函数
function showToast(message) {
    // 优先使用父窗口的提示函数，确保提示框在屏幕中心
    if (window.parent && typeof window.parent.showPlayerToast === 'function') {
        window.parent.showPlayerToast(message);
        return;
    }

    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// 绑定删除按钮事件
function bindDeleteEvent(deleteBtn) {
    deleteBtn.addEventListener('click', function() {
        deleteSong(this);
    });
}

// 绑定收藏按钮事件
function bindHeartEvent(heartBtn) {
    heartBtn.addEventListener('click', function() {
        const songItem = this.closest('.playlist-item');
        const songName = songItem.querySelector('.song-name').textContent;
        const singerName = songItem.querySelector('.song-singer').textContent;
        const duration = songItem.querySelector('.song-duration').textContent;

        this.classList.toggle('active');
        const isActive = this.classList.contains('active');

        if (isActive) {
            showToast('已添加到收藏');
        } else {
            showToast('已取消收藏');
        }

        // 调用父窗口的 toggleFavorite 函数
        if (window.parent && typeof window.parent.toggleFavorite === 'function') {
            window.parent.toggleFavorite(isActive, {
                title: songName,
                singer: singerName,
                duration: duration
            });
        }
    });
}

// 播放全部歌曲函数
function playAllSongs() {
    const firstPlayBtn = playlist.querySelector('.play-btn');
    if (firstPlayBtn) {
        playSong(firstPlayBtn);
        // 移除这里的 showToast，因为 playSong 会触发父窗口 playSingleSong 的提示
    } else {
        showToast('列表中暂无歌曲');
    }
}

const playAllBtn = document.getElementById('playAllBtn');
if (playAllBtn) {
    playAllBtn.addEventListener('click', playAllSongs);
}

// 行滑动指示器
(function(){
    var wrap = document.getElementById('playlistTableWrap'), ind = document.getElementById('playlistTableIndicator');
    if(!wrap||!ind)return;
    wrap.addEventListener('mouseover',function(e){
        var row = e.target.closest('.playlist-item');
        if(!row)return;
        var wr=wrap.getBoundingClientRect(),rr=row.getBoundingClientRect();
        ind.style.opacity='1'; ind.style.top=(rr.top-wr.top)+'px'; ind.style.height=rr.height+'px';
    });
    wrap.addEventListener('mouseleave',function(){ind.style.opacity='0';});
})();

// 初始化
loadFromLocalStorage();

// 初始化已有列表项的置顶和删除事件
document.querySelectorAll('.playlist-item').forEach(item => {
    bindDeleteEvent(item.querySelector('.delete-song-btn'));
    bindHeartEvent(item.querySelector('.heart-btn'));
    bindPinEvent(item.querySelector('.pin-song-btn'));
});
