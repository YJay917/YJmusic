/**
 * =============================================================================
 * 轮播模块：音质卡片轮播 + 首页英雄区 3D 轮播
 * 两套轮播共用同一套「自动播放 / 可见性 / 弹窗暂停」逻辑，仅切换算法不同。
 * =============================================================================
 */

/** 弹窗打开时所有轮播都要停 */
function isCarouselPaused() {
    return Boolean(window.isModalOpen) || document.body.classList.contains('modal-open');
}

/**
 * 通用自动播放控制器
 * 仅在「容器在视口内 + 页面在前台 + 没有弹窗」时才走马灯
 * @param {Element|null} container 视口监听的容器
 * @param {Function} tick 每次前进要做的事
 * @param {number} interval 间隔毫秒
 */
function createAutoPlay(container, tick, interval) {
    let timer = null;
    let isVisible = true;

    function stop() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    function start() {
        stop();
        if (isVisible && document.visibilityState === 'visible' && !isCarouselPaused()) {
            timer = setInterval(tick, interval);
        }
    }

    if (container) {
        new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
            if (isVisible) start();
            else stop();
        }, { threshold: 0.1 }).observe(container);

        container.addEventListener('mouseenter', stop);
        container.addEventListener('mouseleave', start);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') start();
        else stop();
    });

    return { start, stop };
}

/** 绑定左右切换按钮 */
function bindCarouselButtons(prevId, nextId, step) {
    const onClick = (offset) => (event) => {
        if (isCarouselPaused()) return;
        event.stopPropagation();
        step(offset);
    };
    document.getElementById(prevId)?.addEventListener('click', onClick(-1));
    document.getElementById(nextId)?.addEventListener('click', onClick(1));
}

/** 给节点打上 当前 / 下一个 / 上一个 三个类；其余节点按需隐藏 */
function applySlideClasses(nodes, currentIndex, hideOthers) {
    const total = nodes.length;
    nodes.forEach((node, index) => {
        const diff = (index - currentIndex + total) % total;
        node.classList.toggle('active', diff === 0);
        node.classList.toggle('next', diff === 1);
        node.classList.toggle('prev', diff === total - 1);
        if (hideOthers) node.classList.toggle('hidden', diff > 1 && diff < total - 1);
    });
}

/**
 * 音质卡片轮播（当前 / 右边 / 左边，其余隐藏）
 */
function initQualityCarousel() {
    const cards = document.querySelectorAll('.quality-card');
    const container = document.querySelector('.quality-cards');
    if (!cards.length || !container) return;

    const total = cards.length;
    let currentIndex = 0;

    function render() {
        applySlideClasses(cards, currentIndex, true);
    }

    function goTo(index) {
        currentIndex = (index + total) % total;
        render();
        autoPlay.start();
    }

    function step(offset) {
        if (isCarouselPaused()) return;
        goTo(currentIndex + offset);
    }

    const autoPlay = createAutoPlay(container, () => step(1), 3500);

    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            if (index !== currentIndex) goTo(index);
        });
    });

    bindCarouselButtons('qualityPrevBtn', 'qualityNextBtn', step);

    window.startQualityAutoPlay = autoPlay.start;
    window.stopQualityAutoPlay = autoPlay.stop;

    render();
    autoPlay.start();
}

/**
 * 首页英雄区 3D 轮播（当前 / 下一张 / 上一张）
 */
function initHero3DCarousel() {
    const items = document.querySelectorAll('.carousel-3d-item');
    const indicators = document.querySelectorAll('.carousel-3d-indicators .indicator');
    const container = document.querySelector('.carousel-3d-container');
    if (!items.length) return;

    const total = items.length;
    let currentIndex = 0;
    let isTransitioning = false;

    function render() {
        applySlideClasses(items, currentIndex, false);
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
        });
    }

    function goTo(index) {
        if (isTransitioning) return;   // 500ms 过渡期内忽略新指令，避免连点错位
        isTransitioning = true;
        currentIndex = (index + total) % total;
        render();
        setTimeout(() => { isTransitioning = false; }, 500);
        autoPlay.start();
    }

    function step(offset) {
        if (isCarouselPaused()) return;
        goTo(currentIndex + offset);
    }

    const autoPlay = createAutoPlay(container, () => step(1), 5000);

    bindCarouselButtons('heroPrevBtn', 'heroNextBtn', step);

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            if (isCarouselPaused()) return;
            const slideTo = Number(indicator.dataset.slideTo);
            goTo(Number.isNaN(slideTo) ? index : slideTo);
        });
    });

    window.startHero3DAutoPlay = autoPlay.start;
    window.stopHero3DAutoPlay = autoPlay.stop;

    render();
    autoPlay.start();
}
