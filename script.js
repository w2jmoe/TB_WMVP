// 时间环智能护腕功能脚本
// 作者：小杰 & 可可
// 功能：实时时间显示、屏幕交互效果

// 移动端检测和优化
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// 移动端优化设置
if (isMobile || isTouchDevice) {
    // 防止移动端缩放
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // 防止双击缩放
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // 设置视口
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
}

// 状态管理
const State = {
    MAIN: 'main',
    LISTENING: 'listening',
    GENERATING: 'generating',
    ORDER: 'order',
    PAYING: 'paying',
    DELIVERING: 'delivering',
    RESULT: 'result',
};
let state = State.MAIN;
let timer = null;
let holdTimer = null;
let orderType = 'balance'; // 节俭型: economy, 平衡型: balance, 享受型: luxury
let orderData = {
    economy: { name: '节俭汉堡', price: '¥12', color: '#6ec6ff' },
    balance: { name: '平衡汉堡', price: '¥18', color: '#ffb6c1' },
    luxury: { name: '享受汉堡', price: '¥36', color: 'gold' },
};
let address = '家';
let guideTipShown = false;

// 音乐播放与旋转控制
const bgMusic = document.getElementById('bgMusic');
const musicControl = document.getElementById('music-control');
const musicIcon = document.getElementById('music-icon');
const musicTip = document.getElementById('music-tip');
let musicUserPaused = true; // 初始为暂停

function render() {
    clearTimeout(timer);
    console.log('render切换到', state);
    switch (state) {
        case State.MAIN:
            renderMain(); break;
        case State.LISTENING:
            renderListening(); break;
        case State.GENERATING:
            renderGenerating(); break;
        case State.ORDER:
            renderOrder(); break;
        case State.PAYING:
            renderPaying(); break;
        case State.DELIVERING:
            renderDelivering(); break;
        case State.RESULT:
            renderResult(); break;
    }
}

function hideGuideTip() {
    const guideTip = document.getElementById('guide-tip');
    if (guideTip) {
        guideTip.classList.add('hide');
        setTimeout(() => {
            guideTip.remove();
        }, 600);
    }
    guideTipShown = true;
}

// 主界面
function renderMain() {
    console.log('renderMain被调用');
    const fg = document.getElementById('screen-foreground');
    fg.innerHTML = `
        <div class="screen-content main-tip">
            <div class="time-display" id="time-display"></div>
            <div class="date-display" id="date-display"></div>
        </div>
    `;
    updateTime();
    window._mainTimeInterval = setInterval(updateTime, 1000);
    // 0.1版事件绑定方式
    fg.onmousedown = fg.ontouchstart = (e) => {
        e.preventDefault();
        if (!guideTipShown) hideGuideTip();
        holdTimer = setTimeout(() => {
            state = State.LISTENING;
            render();
        }, 500);
    };
    fg.onmouseup = fg.onmouseleave = fg.ontouchend = (e) => {
        clearTimeout(holdTimer);
    };
}

function updateTime() {
    if (state !== State.MAIN) return;
    const now = new Date();
    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');
    if (timeDisplay) timeDisplay.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (dateDisplay) {
        const weekArr = ['日','一','二','三','四','五','六'];
        dateDisplay.textContent = `${now.getMonth() + 1}月${now.getDate()}日 星期${weekArr[now.getDay()]}`;
    }
}

// 聆听中
function renderListening() {
    const fg = document.getElementById('screen-foreground');
    fg.innerHTML = `
        <div class="screen-content listening-bg">
            <div class="listening-tip">小环正在聆听中...</div>
        </div>
    `;
    fg.onmouseup = fg.onmouseleave = fg.ontouchend = (e) => {
        state = State.GENERATING;
        render();
    };
    fg.onmousedown = fg.ontouchstart = null;
}

// 生成订单中
function renderGenerating() {
    const fg = document.getElementById('screen-foreground');
    fg.innerHTML = `
        <div class="screen-content listening-bg">
            <div class="generating-tip">正在生成订单，汉堡马上就来！✨(＞◡❛)</div>
        </div>
    `;
    timer = setTimeout(() => {
        state = State.ORDER;
        render();
    }, 2100);
    fg.onmousedown = fg.ontouchstart = null;
    fg.onmouseup = fg.onmouseleave = fg.ontouchend = null;
}

// 订单界面
function renderOrder() {
    const fg = document.getElementById('screen-foreground');
    const order = orderData[orderType];
    fg.innerHTML = `
        <div class="order-scale-wrap">
        <div class="screen-content listening-bg order-tip">
        <div class="order-inner">
            <div class="order-type-btns">
                <button class="order-type-btn${orderType==='economy'?' selected':''}" style="background:${orderData.economy.color}" data-type="economy">节俭</button>
                <button class="order-type-btn${orderType==='balance'?' selected':''}" style="background:${orderData.balance.color}" data-type="balance">平衡</button>
                <button class="order-type-btn${orderType==='luxury'?' selected':''}" style="background:${orderData.luxury.color}" data-type="luxury">享受</button>
            </div>
            <div class="order-info">
                <div>商品：${order.name}</div>
                <div>价格：${order.price}</div>
                <div>收货：
                    <select id="address-select">
                        <option value="家" ${address==='家'?'selected':''}>家</option>
                        <option value="公司" ${address==='公司'?'selected':''}>公司</option>
                        <option value="学校" ${address==='学校'?'selected':''}>学校</option>
                    </select>
                </div>
            </div>
            <button class="pay-btn" id="pay-btn">
                <img src="images/emoji 01.gif" alt="pay" style="width:24px;height:24px;vertical-align:middle;"> 下单付款
            </button>
        </div>
        </div>
        </div>
    `;
    document.querySelectorAll('.order-type-btn').forEach(btn => {
        btn.onclick = (e) => {
            orderType = btn.getAttribute('data-type');
            renderOrder();
        };
    });
    document.getElementById('address-select').onchange = (e) => {
        address = e.target.value;
    };
    document.getElementById('pay-btn').onclick = () => {
        state = State.PAYING;
        render();
    };
    fg.onmousedown = fg.ontouchstart = null;
    fg.onmouseup = fg.onmouseleave = fg.ontouchend = null;
}

// 支付（人脸识别）
function renderPaying() {
    const fg = document.getElementById('screen-foreground');
    const faces = [
        { name: '帅哥', img: 'images/人脸识别 01.jpg', tip: '让我看看，究竟是谁这么帅？ ╰(*°▽°*)╯🥤' },
        { name: '美女', img: 'images/人脸识别 02.jpg', tip: '天呐，你真的好美呀！ (๑>///<๑）🌸' }
    ];
    const face = faces[Math.floor(Math.random()*faces.length)];
    fg.innerHTML = `
        <div class="screen-content listening-bg paying-tip">
            <div style="color:#fff;font-size:1.05rem;margin-bottom:8px;">人脸识别中...</div>
            <div class="face-scan-wrap">
                <img src="${face.img}" alt="face" class="face-img">
                <div class="scan-bar"></div>
            </div>
            <div class="face-scan-tip" style="color:#fff;font-size:0.98rem;margin-top:8px;">${face.tip}</div>
        </div>
    `;
    // 启动扫描动画
    const scanBar = document.querySelector('.scan-bar');
    if (scanBar) {
        scanBar.classList.add('scan-animate');
    }
    timer = setTimeout(() => {
        state = State.DELIVERING;
        render();
    }, 1800);
    fg.onmousedown = fg.ontouchstart = null;
    fg.onmouseup = fg.onmouseleave = fg.ontouchend = null;
}

// 配送中+结果弹窗合并
function renderDelivering() {
    const fg = document.getElementById('screen-foreground');
    fg.innerHTML = `
        <div class="screen-content listening-bg delivering-tip">
            <div class="delivering-tip" style="color:#4fc3f7;margin-bottom:8px;">已下单，</br>送达时间约30分钟</div>
            <img src="images/emoji 01.gif" alt="emoji" style="width:38px;height:38px;margin:8px auto;display:block;">
            <div style="color:#fff;font-size:0.92rem;margin-top:8px;">+3min，已累计节省时间：</br>93天04小时23分钟</div>
        </div>
    `;
    timer = setTimeout(() => {
        state = State.MAIN;
        render();
    }, 3000);
    fg.onmousedown = fg.ontouchstart = null;
    fg.onmouseup = fg.onmouseleave = fg.ontouchend = null;
}

// 结果弹窗
function renderResult() {
    const fg = document.getElementById('screen-foreground');
    fg.innerHTML = `
        <div class="screen-content listening-bg result-tip" style="background:rgba(0,0,0,0.92);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <img src="images/emoji 01.gif" alt="emoji" style="width:36px;height:36px;"><br>
            <div class="result-tip" style="color:#fff;">+3min，已累计节省时间：93天04小时23分钟</div>
        </div>
    `;
    timer = setTimeout(() => {
        state = State.MAIN;
        render();
    }, 3000);
    fg.onmousedown = fg.ontouchstart = null;
    fg.onmouseup = fg.onmouseleave = fg.ontouchend = null;
}

// 初始化
render();

// 护腕悬停效果
function addWristbandHover() {
    const wristband = document.querySelector('.wristband-body');
    if (!wristband) return;
    wristband.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
        this.style.transition = 'transform 0.3s ease';
    });
    wristband.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('时间环智能护腕启动中... ✨');
    
    // 立即更新时间
    updateTime();
    
    // 每秒更新时间
    setInterval(updateTime, 1000);
    
    // 移除冲突的交互效果函数调用
    // addScreenInteraction(); // 已移除，避免与renderMain冲突
    addWristbandHover();
    
    // 自动播放音乐（有些浏览器需用户首次交互后才允许播放）
    tryPlayMusic();
    
    // 监听用户首次交互
    const resumeMusic = () => {
        tryPlayMusic();
        window.removeEventListener('click', resumeMusic);
        window.removeEventListener('touchstart', resumeMusic);
    };
    window.addEventListener('click', resumeMusic);
    window.addEventListener('touchstart', resumeMusic);
    
    console.log('时间环智能护腕启动完成！ 🚀');
});

// 添加键盘快捷键支持
document.addEventListener('keydown', function(event) {
    // 按空格键可以暂停/恢复屏幕动画
    if (event.code === 'Space') {
        event.preventDefault();
        const fg = document.getElementById('screen-foreground');
        const isPaused = fg.style.animationPlayState === 'paused';
        fg.style.animationPlayState = isPaused ? 'running' : 'paused';
        console.log(isPaused ? '屏幕动画已恢复' : '屏幕动画已暂停');
    }
    
    // 按R键刷新页面
    if (event.code === 'KeyR' && event.ctrlKey) {
        console.log('正在刷新时间环...');
    }
});

// 移动端屏幕方向变化监听
if (isMobile || isTouchDevice) {
    // 监听屏幕方向变化
    window.addEventListener('orientationchange', function() {
        // 延迟执行，等待屏幕旋转完成
        setTimeout(() => {
            // 重新计算视口高度
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            
            // 强制重新渲染
            if (state === State.MAIN) {
                updateTime();
            }
            
            console.log('屏幕方向已改变，已重新适配');
        }, 300);
    });
    
    // 监听窗口大小变化
    window.addEventListener('resize', function() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
    
    // 初始化视口高度
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// 移动端性能优化
if (isMobile || isTouchDevice) {
    // 减少重绘和回流
    const container = document.querySelector('.container');
    if (container) {
        container.style.willChange = 'transform';
    }
    
    // 优化触摸响应
    document.addEventListener('touchmove', function(e) {
        // 防止页面滚动
        if (e.target.closest('.screen-foreground')) {
            e.preventDefault();
        }
    }, { passive: false });
}

console.log('时间环移动端优化已加载完成！ 📱✨');

// 自动播放音乐（有些浏览器需用户首次交互后才允许播放）
function tryPlayMusic() {
    bgMusic.play().then(()=>{
        musicIcon.classList.remove('paused');
    }).catch(() => {
        // 自动播放被阻止，等待用户交互
    });
}

// 只允许用户点击冰淇淋按钮直接控制音乐
musicControl.onclick = function() {
    if (bgMusic.paused) {
        bgMusic.play();
        musicIcon.classList.remove('paused');
        musicUserPaused = false;
        if (musicTip) musicTip.style.display = 'none';
    } else {
        bgMusic.pause();
        musicIcon.classList.add('paused');
        musicUserPaused = true;
    }
}; 