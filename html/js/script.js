// 系统配置
const CONFIG = {
    VALID_CODE: '2024SOFT',
    EXPIRE_HOURS: 24,
    STORAGE_KEY: 'auth_expires',
    FEEDBACK_EMAIL: 'support@example.com' // 修改为实际邮箱
};

// 初始化事件监听
function initEventListeners() {
    // 链接点击处理
    document.querySelectorAll('.hidden-link').forEach(link => {
        link.addEventListener('click', handleLinkClick);
    });

    // 复制按钮处理
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', handleCopyClick);
    });

    // 搜索功能
    document.querySelector('.search-box').addEventListener('input', handleSearch);

    // 反馈系统
    document.querySelector('.feedback-btn').addEventListener('click', toggleFeedback);
    document.querySelector('.feedback-close').addEventListener('click', toggleFeedback);
    document.getElementById('feedbackForm').addEventListener('submit', handleFeedbackSubmit);

    // 激活码弹窗
    document.querySelector('.auth-confirm').addEventListener('click', checkAuth);
    document.querySelector('.auth-cancel').addEventListener('click', closeAuthModal);
    document.getElementById('authCode').addEventListener('keypress', handleKeyPress);
}

// 检查授权状态
function checkAuthStatus() {
    try {
        const expires = localStorage.getItem(CONFIG.STORAGE_KEY);
        return expires && Date.now() < parseInt(expires);
    } catch (e) {
        return false;
    }
}

// 处理链接点击
function handleLinkClick(e) {
    if(checkAuthStatus()) {
        window.open(this.href, '_blank');
        return;
    }
    e.preventDefault();
    showAuthModal(() => window.open(this.href, '_blank'));
}

// 处理复制点击
function handleCopyClick() {
    if(checkAuthStatus()) {
        performCopy(this);
        return;
    }
    showAuthModal(() => performCopy(this));
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

// 激活码验证流程
let pendingAction = null;

function showAuthModal(callback) {
    pendingAction = callback;
    document.getElementById('authOverlay').style.display = 'block';
    document.getElementById('authModal').style.display = 'block';
    document.getElementById('authCode').focus();
}

function closeAuthModal() {
    document.getElementById('authOverlay').style.display = 'none';
    document.getElementById('authModal').style.display = 'none';
    pendingAction = null;
}

function checkAuth() {
    const inputCode = document.getElementById('authCode').value.trim();
    
    if(inputCode === CONFIG.VALID_CODE) {
        const expires = Date.now() + CONFIG.EXPIRE_HOURS * 3600000;
        localStorage.setItem(CONFIG.STORAGE_KEY, expires);
        closeAuthModal();
        pendingAction?.();
        startExpireTimer(expires);
    } else {
        alert('激活码错误，请重新输入');
        document.getElementById('authCode').value = '';
        document.getElementById('authCode').focus();
    }
}

// 过期计时器
function startExpireTimer(expires) {
    const timer = setInterval(() => {
        if(Date.now() > expires) {
            clearInterval(timer);
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            alert('激活状态已过期，请重新验证');
        }
    }, 60000);
}

// 搜索功能
function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.resource-card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(term) ? 'block' : 'none';
    });
}

// 反馈系统
function toggleFeedback() {
    const container = document.getElementById('feedback-container');
    container.style.display = container.style.display === 'block' ? 'none' : 'block';
}

function handleFeedbackSubmit(e) {
    e.preventDefault();
    
    const subject = document.getElementById('feedbackSubject').value;
    const content = document.getElementById('feedbackContent').value;
    const email = document.getElementById('feedbackEmail').value;
    
    const mailtoLink = `mailto:${CONFIG.FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        `反馈内容：\n${content}\n\n联系方式：${email || '未提供'}`
    )}`;
    
    window.location.href = mailtoLink;
    toggleFeedback();
    showToast('反馈已提交，请通过邮件客户端发送');
}

// Toast提示
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, duration);
}

// 通用事件处理
function handleKeyPress(e) {
    if(e.key === 'Enter') checkAuth();
}

// 初始化系统
window.addEventListener('load', () => {
    initEventListeners();
    if(checkAuthStatus()) {
        const expires = parseInt(localStorage.getItem(CONFIG.STORAGE_KEY));
        startExpireTimer(expires);
    }
    
    // 24小时删除提醒
    setTimeout(() => {
        if(confirm('根据使用协议，资源需在24小时内删除，是否立即清除本地数据？')) {
            localStorage.clear();
            sessionStorage.clear();
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
    }, 86400000);
});
