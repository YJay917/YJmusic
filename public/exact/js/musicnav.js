// 获取DOM元素
const playBtn = document.getElementById('playBtn');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const progressBar = document.getElementById('progressBar');
const heartIcon = document.getElementById('heartIcon');
const toast = document.getElementById('toast');
const playIcon = playBtn ? playBtn.querySelector('i') : null;
const musicNoteIcon = document.getElementById('musicNoteIcon');

// 播放状态变量
let isPlaying = false;
let duration = 247; // 总时长：4分07秒 = 247秒
let currentSecond = 0;
let timer = null;

// 更新播放状态类
function updatePlaybackClass() {
    if (isPlaying) {
        document.body.classList.add('music-playing');
    } else {
        document.body.classList.remove('music-playing');
    }
}

// 切换播放模式
const volumeBtn = document.getElementById('volumeBtn');
const volumePanel = document.getElementById('volumePanel');
const volumeSlider = document.querySelector('.volume-slider');
const volumeProgress = document.getElementById('volumeProgress');
const volumeDot = document.getElementById('volumeDot');
const playModeBtn = document.getElementById('playModeBtn');
const hidePlayerBtn = document.getElementById('hidePlayerBtn');
const showPlayerBtn = document.getElementById('showPlayerBtn');
const playerBar = document.querySelector('.player-bar');

// 隐藏播放条
if (hidePlayerBtn && playerBar && showPlayerBtn) {
  hidePlayerBtn.addEventListener('click', () => {
    playerBar.classList.add('hidden');
    showPlayerBtn.classList.add('show');
    showToast('播放条已隐藏');
  });
}

// 显示播放条
if (showPlayerBtn && playerBar) {
  showPlayerBtn.addEventListener('click', () => {
    playerBar.classList.remove('hidden');
    showPlayerBtn.classList.remove('show');
  });
}

// 播放模式变量
let playMode = 0; // 0: 列表循环, 1: 随机播放
let playedRandomIndices = []; // 记录已随机播放过的索引，确保不重复

const playModes = [
  { icon: 'fa fa-refresh', text: '列表循环' },
  { icon: 'fa fa-random', text: '随机播放' }
];

// 模拟歌曲列表（用于随机播放演示，实际项目中可从 localStorage 或父窗口获取）
const mockSongs = [
    { title: '歌曲1', duration: 247 },
    { title: '歌曲2', duration: 180 },
    { title: '歌曲3', duration: 210 },
    { title: '歌曲4', duration: 255 },
    { title: '歌曲5', duration: 195 }
];
let currentMockIndex = 0;

// 切换播放模式
if (playModeBtn) {
  playModeBtn.addEventListener('click', () => {
    playMode = (playMode + 1) % playModes.length;
    const mode = playModes[playMode];
    playModeBtn.className = `${mode.icon} control-btn`;
    playModeBtn.title = mode.text;
    showToast(mode.text);
    
    // 切换到随机播放时重置已播放记录
    if (playMode === 1) {
        playedRandomIndices = [currentMockIndex];
    }
  });
}

// 显示提示弹窗函数
function showToast(message) {
  // 优先使用父窗口的提示函数，确保提示框在屏幕中心
  if (window.parent && typeof window.parent.showPlayerToast === 'function') {
      window.parent.showPlayerToast(message);
      return;
  }

  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
      toast.classList.remove('show');
  }, 2000);
}

// 爱心收藏交互
if (heartIcon) {
  heartIcon.addEventListener('click', function(e) {
      e.stopPropagation();
      if (this.classList.contains('active')) {
          showToast('已取消收藏');
          this.classList.remove('active');
      } else {
          showToast('已收藏该歌曲');
          this.classList.add('active');
      }
  });
}

// 播放/暂停切换
if (playBtn && playIcon) {
  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    
    // 更新播放/暂停图标并显示提示
    if (isPlaying) {
      playIcon.className = 'fa fa-pause';
      playBtn.style.paddingLeft = '0px'; // 暂停图标不需要微调
      playBtn.title = '暂停';
      showToast('开始播放音乐');
      updatePlaybackClass();
      startProgress();
    } else {
      playIcon.className = 'fa fa-play';
      playBtn.style.paddingLeft = '2px'; // 播放图标三角形视觉居中微调
      playBtn.title = '播放';
      showToast('已暂停该音乐');
      updatePlaybackClass();
      clearInterval(timer);
    }
  });
}

// 停止播放并重置进度
window.stopProgress = function() {
    clearInterval(timer);
    isPlaying = false;
    currentSecond = 0;
    
    // 强制重置 UI
    if (progressFill) progressFill.style.width = '0%';
    if (progressBar) progressBar.style.setProperty('--progress-pos', '0%');
    if (currentTimeEl) currentTimeEl.textContent = '00:00';
    
    updatePlaybackClass();
    if (playIcon) {
        playIcon.className = 'fa fa-play';
        playBtn.style.paddingLeft = '2px';
    }
    if (playBtn) playBtn.title = '播放';
};

// 模拟进度更新
function startProgress() {
  timer = setInterval(() => {
    // 检查弹窗状态：当前窗口或父窗口是否开启了弹窗
    const isParentModalOpen = window.parent && (window.parent.isModalOpen || (window.parent.document && window.parent.document.body.classList.contains('modal-open')));
    const isCurrentModalOpen = window.isModalOpen || document.body.classList.contains('modal-open');
    
    if (isParentModalOpen || isCurrentModalOpen) {
        return; // 如果有弹窗打开，暂停进度增加
    }

    currentSecond++;
    
    // 播放完成后处理
    if (currentSecond >= duration) {
      clearInterval(timer);
      currentSecond = 0;

      if (playMode === 1) {
          // 随机播放逻辑：确保不重复
          if (playedRandomIndices.length >= mockSongs.length) {
              playedRandomIndices = []; // 所有歌都放过了，重置
          }

          let nextIndex;
          do {
              nextIndex = Math.floor(Math.random() * mockSongs.length);
          } while (playedRandomIndices.includes(nextIndex) && mockSongs.length > 1);

          playedRandomIndices.push(nextIndex);
          currentMockIndex = nextIndex;
          
          const nextSong = mockSongs[nextIndex];
          duration = nextSong.duration;
          showToast(`随机播放: ${nextSong.title}`);
          
          // 更新 UI
          if (totalTimeEl) totalTimeEl.textContent = formatTime(duration);
          startProgress(); // 继续播放下一首
      } else {
          // 列表循环或单曲播放完成后的默认行为
          isPlaying = false;
          updatePlaybackClass();
          if (playIcon) playIcon.className = 'fa fa-play';
          if (playBtn) playBtn.title = '播放';
      }
    }
    
    updateProgress();
  }, 1000);
}

// 更新进度条和时间显示
function updateProgress() {
  if (progressFill) progressFill.style.width = `${(currentSecond / duration) * 100}%`;
  // 更新进度圆点位置
  if (progressBar) progressBar.style.setProperty('--progress-pos', `${(currentSecond / duration) * 100}%`);
  if (currentTimeEl) currentTimeEl.textContent = formatTime(currentSecond);
}

// 时间格式化：秒 -> 分:秒（两位数）
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}

// 点击进度条跳转播放位置
if (progressBar) {
  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    
    currentSecond = Math.floor(percent * duration);
    updateProgress();
    
    // 如果正在播放，继续播放；如果暂停，保持暂停
    if (isPlaying) {
      clearInterval(timer);
      startProgress();
    }
  });
}

// 音量面板切换
if (volumeBtn && volumePanel) {
  volumeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    volumePanel.classList.toggle('show');
  });
}

// 点击页面其他地方关闭音量面板
document.addEventListener('click', () => {
  if (volumePanel) volumePanel.classList.remove('show');
});

// 阻止音量面板内部点击冒泡
if (volumePanel) {
  volumePanel.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// 音量调节逻辑
function updateVolume(e) {
  if (!volumeSlider || !volumeProgress || !volumeDot || !volumeBtn) return;
  const rect = volumeSlider.getBoundingClientRect();
  let clientY = e.clientY;
  
  // 适配触摸事件
  if (e.touches) clientY = e.touches[0].clientY;

  let offset = rect.bottom - clientY;
  let percent = offset / rect.height;
  
  percent = Math.max(0, Math.min(1, percent));
  
  const displayPercent = Math.round(percent * 100);
  volumeProgress.style.height = `${displayPercent}%`;
  volumeDot.style.bottom = `${displayPercent}%`;
  
  // 更新音量图标
  if (displayPercent === 0) {
    volumeBtn.className = 'fa fa-volume-off control-btn';
  } else if (displayPercent < 50) {
    volumeBtn.className = 'fa fa-volume-down control-btn';
  } else {
    volumeBtn.className = 'fa fa-volume-up control-btn';
  }
}

// 音量滑动交互
let isDraggingVolume = false;

if (volumeSlider) {
  volumeSlider.addEventListener('mousedown', (e) => {
    isDraggingVolume = true;
    updateVolume(e);
  });

  document.addEventListener('mousemove', (e) => {
    if (isDraggingVolume) updateVolume(e);
  });

  document.addEventListener('mouseup', () => {
    isDraggingVolume = false;
  });
}