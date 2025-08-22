/**
 * 这是一个极简但极其稳健的 SillyTavern 插件，用于捕获最终的AI消息对象。
 *
 * 它解决了核心问题：插件脚本执行时，SillyTavern 的核心对象（如 eventSource）可能尚未初始化。
 *
 * 解决方案：我们不立即执行，而是使用一个轮询器（setInterval）来反复检查，
 * 直到所有需要的对象都已在全局作用域中定义，然后再绑定我们的事件监听器。
 */
(function () {
    const PLUGIN_NAME = "[最终数据捕获插件]";
    const MAX_WAIT_TIME = 15000; // 等待15秒，如果还没找到就放弃
    const POLL_INTERVAL = 100;   // 每100毫秒检查一次

    let totalWaitTime = 0;

    console.log(`${PLUGIN_NAME} 已加载，开始等待 SillyTavern 核心对象...`);

    // 启动轮询器
    const readyCheckInterval = setInterval(() => {
        // 检查所有我们需要的全局对象是否存在
        if (typeof window.eventSource !== 'undefined' &&
            typeof window.event_types !== 'undefined' &&
            typeof window.getContext === 'function') {

            // 找到了！
            clearInterval(readyCheckInterval); // 停止轮询
            console.log(`${PLUGIN_NAME} 成功找到核心对象，开始初始化。`);
            initializePlugin();

        } else {
            // 还没找到，继续等待
            totalWaitTime += POLL_INTERVAL;
            if (totalWaitTime >= MAX_WAIT_TIME) {
                clearInterval(readyCheckInterval); // 超时，停止轮询
                console.error(`${PLUGIN_NAME} 错误：等待超时。无法在全局作用域中找到 eventSource, event_types, 或 getContext。插件无法工作。`);
            }
        }
    }, POLL_INTERVAL);

    /**
     * 当所有核心对象都准备好后，执行这个函数
     */
    function initializePlugin() {
        // 监听正确的事件：CHARACTER_MESSAGE_RENDERED
        // 这个事件在消息被完全处理并准备好渲染时触发
        window.eventSource.on(window.event_types.CHARACTER_MESSAGE_RENDERED, (chat_id) => {
            try {
                // 使用全局的 getContext() 函数和收到的 chat_id 来获取完整的消息对象
                const chatContext = window.getContext();
                const messageObject = chatContext.chat[chat_id];

                if (!messageObject) {
                    console.error(`${PLUGIN_NAME} 错误：无法根据 chat_id ${chat_id} 找到消息对象。`);
                    return;
                }

                // 打印我们成功捕获到的对象
                console.groupCollapsed(
                    `%c${PLUGIN_NAME} 成功捕获到新消息对象！ (ID: ${chat_id})`,
                    "background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
                );
                console.log("%c这个对象是 onSuccess(data) 处理完毕后，最终存入聊天状态的数据结构。", "font-style: italic;");
                console.log("--- 捕获到的最终消息对象 ---");
                console.log(messageObject);
                console.log("-------------------------------------");
                console.groupEnd();

            } catch (error) {
                console.error(`${PLUGIN_NAME} 在处理事件时发生错误:`, error);
            }
        });

        console.log(`${PLUGIN_NAME} 初始化完成，已成功绑定到 CHARACTER_MESSAGE_RENDERED 事件。`);
    }

})(); // 使用立即执行函数表达式 (IIFE) 来避免污染全局作用域
