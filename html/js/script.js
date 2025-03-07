
// ================= 系统配置 =================
const CONFIG = {
    VALID_CODE: 'zhijiantv',
    EXPIRE_HOURS: 24,
    STORAGE_KEY: 'auth_expires'
};

// ================= 全局变量 =================
let pendingAction = null;

// ================= 反馈系统 =================
function initFeedback() {
    const feedbackBtn = document.querySelector('.feedback-btn');
    const feedbackModal = document.getElementById('feedbackModal');
    const feedbackOverlay = document.getElementById('feedbackOverlay');

    const toggleFeedback = () => {
        const isVisible = feedbackModal.style.display === 'block';
        feedbackModal.style.display = isVisible ? 'none' : 'block';
        feedbackOverlay.style.display = isVisible ? 'none' : 'block';
    };

    feedbackBtn.addEventListener('click', toggleFeedback);
    feedbackOverlay.addEventListener('click', toggleFeedback);
}

// ================= 激活码系统 =================
function initAuthSystem() {
    const authModal = document.getElementById('authModal');
    const authOverlay = document.getElementById('authOverlay');
    const authConfirm = document.querySelector('.auth-confirm');
    const authCancel = document.querySelector('.auth-cancel');

    // 显示激活码弹窗（改为全局可用）
    window.showAuthModal = function(callback) {
        pendingAction = callback;
        authModal.style.display = 'block';
        authOverlay.style.display = 'block';
        document.getElementById('authCode').focus();
    }

    // 关闭弹窗
    function closeAuthModal() {
        authModal.style.display = 'none';
        authOverlay.style.display = 'none';
        pendingAction = null;
    }

    // 验证激活码
    function checkAuth() {
        const inputCode = document.getElementById('authCode').value.trim();
        if (inputCode === CONFIG.VALID_CODE) {
            const expires = Date.now() + CONFIG.EXPIRE_HOURS * 3600000;
            localStorage.setItem(CONFIG.STORAGE_KEY, expires);
            closeAuthModal();
            if (pendingAction) pendingAction();
            startExpireTimer(expires);
        } else {
            alert('激活码错误，请重新输入');
            document.getElementById('authCode').value = '';
        }
    }

    // 绑定事件
    authConfirm.addEventListener('click', checkAuth);
    authCancel.addEventListener('click', closeAuthModal);
    document.getElementById('authCode').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAuth();
    });
}

// ================= 通用功能 =================
function checkAuthStatus() {
    try {
        const expires = localStorage.getItem(CONFIG.STORAGE_KEY);
        return expires && Date.now() < parseInt(expires);
    } catch (e) {
        return false;
    }
}

function startExpireTimer(expires) {
    const timer = setInterval(() => {
        if (Date.now() > expires) {
            clearInterval(timer);
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            alert('激活状态已过期，请重新验证');
        }
    }, 60000);
}

function initEvents() {
    // 链接点击处理（修复事件绑定）
    document.querySelectorAll('.hidden-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (checkAuthStatus()) {
                window.open(this.href, '_blank');
                return;
            }
            e.preventDefault();
            window.showAuthModal(() => window.open(this.href, '_blank'));
        });
    });

    // 复制按钮处理（修复事件绑定）
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (checkAuthStatus()) {
                performCopy(this);
                return;
            }
            window.showAuthModal(() => performCopy(this));
        });
    });

    // 搜索功能
    document.querySelector('.search-box').addEventListener('input', function(e) {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.resource-card').forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(term) ? 'block' : 'none';
        });
    });
}

// 执行复制操作
function performCopy(button) {
    const link = button.previousElementSibling.href;
    navigator.clipboard.writeText(link).then(() => {
        button.classList.add('copied');
        button.textContent = '已复制';
        setTimeout(() => {
            button.classList.remove('copied');
            button.textContent = '复制';
        }, 1500);
    }).catch(() => alert('复制失败，请手动选择链接'));
}

// ================= 初始化 =================
window.addEventListener('load', () => {
    initFeedback();
    initAuthSystem();
    initEvents();

    // 初始化过期检查
    if (checkAuthStatus()) {
        const expires = parseInt(localStorage.getItem(CONFIG.STORAGE_KEY));
        startExpireTimer(expires);
    }

    // 24小时数据清理提醒
    setTimeout(() => {
        if (confirm('根据使用协议，资源需在24小时内删除，是否立即清除本地数据？')) {
            localStorage.clear();
            sessionStorage.clear();
        }
    }, 86400000);
});
