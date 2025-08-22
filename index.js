(function () {
    'use strict';

    // --- 插件配置 ---
    // 这些值将由 config.json 中的用户设置覆盖
    let maxFails = 4;
    let retryDelay = 5000;
    let requestTimeout = 160000;
    let targetApiUrl = "/api/generate";

    // --- 内部状态变量 ---
    let failCount = 0;
    let isHandlingFailure = false; // 防调用风暴的状态锁

    // --- SillyTavern 上下文 ---
    // 我们将在 onready 钩子中获取这些变量
    let stContext = null;

    // --- 核心函数 ---

    function log(level, message) {
        console[level](`[EnhancedAutoRetry] ${message}`);
    }

    function notify(title, message) {
        // SillyTavern 有内置的通知系统
        if (stContext && stContext.Toast) {
            stContext.Toast.info(message, title);
        } else {
            log('log', `[通知] ${title}: ${message}`);
        }
    }

    function clickRegenerate(callback) {
        // SillyTavern 中重新生成的按钮ID是 'send_regenerate'
        const btn = document.querySelector('#send_regenerate');
        if (btn && !btn.disabled) {
            setTimeout(() => {
                btn.click();
                log('log', '已点击 #send_regenerate 按钮');
                if (typeof callback === 'function') callback();
            }, retryDelay);
        } else {
            log('warn', '未找到或无法点击重新生成按钮 #send_regenerate');
            isHandlingFailure = false; // 解锁，因为无法进行下一步操作
            if (typeof callback === 'function') callback();
        }
    }

    function handleAutoRetry(reason = "未知错误") {
        if (isHandlingFailure) {
            log('log', `正在处理上一次失败，已忽略新的错误报告: "${reason}"`);
            return;
        }

        // --- 上锁！---
        isHandlingFailure = true;
        failCount++;

        log('warn', `原因: "${reason}"。这是第 ${failCount} 次失败。`);

        if (failCount >= maxFails) {
            log('error', `已达到最大失败次数 (${maxFails})。脚本已停止重试。`);
            notify('自动重试已停止', `已连续失败 ${failCount} 次，脚本已停止重试。`);
            // 可以在这里选择重置 failCount 或让用户手动重置
        } else {
            log('log', `准备进行下一次重试...`);
            notify(`自动重试 #${failCount}`, `原因: ${reason}。将在 ${retryDelay / 1000} 秒后重试。`);
            clickRegenerate();
        }
    }

    // --- 插件生命周期与监听器 ---

    SillyTavern.extension.hooks.on('before-fetch', (request) => {
        const url = new URL(request.url, window.location.origin);
        if (!url.pathname.includes(targetApiUrl)) {
            return request;
        }

        log('log', '检测到新的API请求，重置失败处理锁。');
        isHandlingFailure = false;

        // 为请求添加超时逻辑
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestTimeout);
        request.signal = controller.signal;

        request.context.enhancedAutoRetry = { timeoutId }; // 将timeoutId存入上下文，以便之后清除

        return request;
    });

    SillyTavern.extension.hooks.on('after-fetch', (request, response) => {
        const url = new URL(request.url, window.location.origin);
        if (!url.pathname.includes(targetApiUrl)) {
            return response;
        }
        
        const { timeoutId } = request.context.enhancedAutoRetry;
        clearTimeout(timeoutId);

        log('log', `拦截到API请求: ${url.pathname}, 状态码: ${response.status}`);
        if (!response.ok) {
            handleAutoRetry(`API响应状态码为 ${response.status}`);
        } else {
            if (failCount > 0) {
                log('log', 'API 请求成功，重置失败计数。');
                notify('重试成功', `API请求在第 ${failCount + 1} 次尝试后成功。`);
                failCount = 0;
            }
        }
        return response;
    });

    SillyTavern.extension.hooks.on('fetch-error', (request, error) => {
        const url = new URL(request.url, window.location.origin);
        if (!url.pathname.includes(targetApiUrl)) {
            return;
        }

        const { timeoutId } = request.context.enhancedAutoRetry;
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            handleAutoRetry(`请求超时 (超过 ${requestTimeout / 1000} 秒)`);
        } else {
            log('error', `Fetch 请求异常: ${error.message}`);
            handleAutoRetry('Fetch 请求异常');
        }
    });

    // 监听SillyTavern的事件来处理其他错误
    SillyTavern.extension.events.on('stream-stopped-error', () => handleAutoRetry('API流式传输错误'));
    SillyTavern.extension.events.on('generation-failed', () => handleAutoRetry('生成失败事件'));
    
    // 监听全局未捕获的错误
    window.addEventListener("error", () => handleAutoRetry('全局JS错误'));
    window.addEventListener("unhandledrejection", () => handleAutoRetry('Promise未处理异常'));

    // 插件加载完成后的初始化
    SillyTavern.extension.on('ready', (context) => {
        stContext = context;
        const settings = context.getSettings();

        // 从设置中加载用户配置
        maxFails = settings.max_fails || maxFails;
        retryDelay = settings.retry_delay || retryDelay;
        requestTimeout = settings.request_timeout || requestTimeout;
        targetApiUrl = settings.target_api_url || targetApiUrl;

        log('log', '✅ 插件已启用 (v1.0.0)');
        log('log', `配置 -> 最大失败: ${maxFails}, 延迟: ${retryDelay}ms, 超时: ${requestTimeout}ms`);
    });

})();
