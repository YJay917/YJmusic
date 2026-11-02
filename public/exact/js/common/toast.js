/**
 * =============================================================================
 * 公共组件：轻提示 toast（js/common/toast.js）
 * -----------------------------------------------------------------------------
 * 用法：showToast('已收藏该歌曲')
 *
 * 行为：
 *   1. 页面在 iframe 里且父窗口有 showPlayerToast 时，委托给父窗口
 *      —— 提示永远出现在整个页面的正中，而不是被小 iframe 裁掉；
 *   2. 独立打开页面时，自动创建一个居中的黑色胶囊提示，2 秒后淡出；
 *   3. 连续调用只复用同一个节点并重置计时器，不会堆叠。
 *
 * 取代了原先 favorite/played/playerlist/musicnav/artistpage/albumpage
 * 六个页面各自实现的 showToast（逻辑几乎一样，重复维护）。
 * 样式见 css/toast.css。
 * =============================================================================
 */
(function () {
    var NODE_ID = 'yjayToast';
    var timer = null;

    function ensureNode() {
        var node = document.getElementById(NODE_ID);
        if (!node) {
            node = document.createElement('div');
            node.id = NODE_ID;
            node.className = 'yjay-toast';
            document.body.appendChild(node);
        }
        return node;
    }

    window.showToast = function (message) {
        // 1) 在 iframe 里：交给父窗口统一显示
        if (window.parent && window.parent !== window &&
            typeof window.parent.showPlayerToast === 'function') {
            window.parent.showPlayerToast(message);
            return;
        }
        // 2) 独立打开：本地渲染
        var node = ensureNode();
        node.textContent = message;
        node.classList.add('show');
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
            node.classList.remove('show');
            timer = null;
        }, 2000);
    };
})();
