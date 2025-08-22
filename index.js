/**
 * SillyTavern - onSuccess 原始数据捕获插件 (最终版)
 *
 * 核心逻辑：
 * 1. SillyTavern 的核心函数 onSuccess 不是立即全局可用的。它需要等待页面文档加载完毕后才被赋值给 window.onSuccess。
 * 2. 本插件启动后，会使用一个定时器 (setInterval) 反复检查 `window.onSuccess` 是否已经存在。
 * 3. 一旦发现 `window.onSuccess` 存在，插件就会立刻停止检查，并执行“猴子补丁”(Monkey-Patching)操作。
 * 4. “猴子补丁”操作：
 *    a. 将原始的 `window.onSuccess` 函数保存到一个临时变量中。
 *    b. 用我们自己编写的一个新函数来替换掉 `window.onSuccess`。
 *    c. 我们这个新函数的功能是：首先，打印出它接收到的 `data` 参数（这正是我们的目标！）；然后，调用之前保存的那个原始函数，并将 `data` 原封不动地传给它，以保证 SillyTavern 的所有功能都正常运行。
 */
(function () {
    const PLUGIN_NAME = "[原始数据捕获插件]";
    const MAX_WAIT_TIME = 20000; // 最长等待20秒，如果还没找到就放弃
    const POLL_INTERVAL = 100;   // 每100毫秒检查一次

    let totalWaitTime = 0;

    // 使用 jQuery(document).ready 来确保至少 DOM 是加载完了的
    jQuery(document).ready(function() {
        console.log(`${PLUGIN_NAME} 插件已加载。开始等待 SillyTavern 核心函数 'onSuccess' 准备就绪...`);

        // 启动定时器，持续检查目标函数是否可用
        const readyCheckInterval = setInterval(() => {
            if (typeof window.onSuccess === 'function') {
                // 找到了！目标已准备就绪
                clearInterval(readyCheckInterval); // 停止检查
                console.log(`${PLUGIN_NAME} 成功找到 'window.onSuccess' 函数。准备执行拦截操作...`);
                applyInterceptor(); // 执行核心的拦截功能
            } else {
                // 还没找到，继续等待
                totalWaitTime += POLL_INTERVAL;
                if (totalWaitTime >= MAX_WAIT_TIME) {
                    clearInterval(readyCheckInterval); // 等待超时，停止检查
                    console.error(`${PLUGIN_NAME} 错误：等待超时！未能找到 'window.onSuccess' 函数。插件无法工作。请检查 SillyTavern 版本或是否有其他插件冲突。`);
                }
            }
        }, POLL_INTERVAL);
    });

    /**
     * 应用拦截器的核心函数
     */
    function applyInterceptor() {
        // 1. 将原始的 onSuccess 函数保存起来
        const originalOnSuccess = window.onSuccess;

        // 2. 用我们自己的异步函数覆盖全局的 onSuccess
        window.onSuccess = async function(data) {
            // 3. 拦截成功！在这里，我们终于拿到了梦寐以求的原始 data 对象
            console.groupCollapsed(
                `%c${PLUGIN_NAME} 成功拦截到 'onSuccess' 的原始数据！`,
                "background-color: #8E44AD; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
            );
            console.log("这是从 API 返回的、未经任何处理的原始数据对象:");
            console.log(data); // <--- 这里就是最终的数据！
            console.groupEnd();

            // 4. 【至关重要】调用原始的函数，并将参数原封不动地传过去。
            // 必须使用 await 并返回其结果，否则会破坏 SillyTavern 的正常流程。
            try {
                return await originalOnSuccess.apply(this, arguments);
            } catch (error) {
                console.error(`${PLUGIN_NAME} 在执行原始 onSuccess 函数时捕获到一个错误:`, error);
                // 将错误重新抛出，以便 SillyTavern 的其他部分可以处理它
                throw error;
            }
        };

        console.log(`${PLUGIN_NAME} 拦截器已成功应用。现在，每次 AI 回复时都将自动捕获其原始数据。`);
    }

})(); // 使用立即执行函数表达式，避免污染全局变量
