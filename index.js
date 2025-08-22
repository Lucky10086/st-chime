/**
 * 这是一个最终版的插件，旨在通过正确的方式捕获 onSuccess 函数处理后生成的最终消息对象。
 * 它通过监听正确的 `CHARACTER_MESSAGE_RENDERED` 事件，并使用收到的 `chat_id` 从主聊天上下文中获取数据。
 *
 * 假设：此插件的运行环境与您提供的“记忆插件”相同，可以访问到核心的全局变量
 * `eventSource`, `event_types`, 和 `getContext`。
 */
const FinalDataCapturePlugin = {

    /**
     * 这是我们的事件处理函数。
     * 当一条新消息被完全处理并准备好渲染时，该函数会被调用。
     * @param {number} chat_id - 这是新消息在 `getContext().chat` 数组中的索引。
     */
    logFinalMessageObject(chat_id) {
        try {
            // 检查 chat_id 是否有效
            if (chat_id === null || chat_id === undefined || typeof getContext !== 'function') {
                console.warn("[最终数据捕获插件] 收到的 chat_id 无效或无法访问 getContext()。");
                return;
            }

            // 使用全局的 getContext() 函数和收到的 chat_id 来获取完整的消息对象
            const chatContext = getContext();
            const messageObject = chatContext.chat[chat_id];

            if (!messageObject) {
                console.error(`[最终数据捕获插件] 错误：无法根据 chat_id ${chat_id} 找到消息对象。`);
                return;
            }

            // 打印我们成功捕获到的对象
            console.groupCollapsed(
                "%c[最终数据捕获插件] 成功捕获到最终消息对象！",
                "background-color: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
            );
            console.log("%c这个对象是 onSuccess(data) 处理完毕后，最终存入聊天状态的数据结构。", "font-style: italic;");
            console.log("--- 捕获到的最终消息对象 ---");
            console.log(messageObject); // <--- 这里就是包含了所有最终信息的数据！
            console.log("-------------------------------------");
            console.groupEnd();

        } catch (error) {
            console.error("[最终数据捕获插件] 在处理事件时发生错误:", error);
        }
    },

    /**
     * 插件的初始化入口。
     */
    init() {
        // 使用 jQuery(document).ready 确保 DOM 和核心脚本已加载完毕
        jQuery(async () => {
            // 检查核心对象是否在全局作用域中可用
            if (typeof eventSource !== 'undefined' && typeof event_types !== 'undefined') {
                console.log("[最终数据捕获插件] 核心事件系统已找到，正在绑定监听器...");

                // 监听正确的事件：CHARACTER_MESSAGE_RENDERED
                eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, this.logFinalMessageObject.bind(this));

                console.log("[最终数据捕获插件] 监听器已成功绑定到 CHARACTER_MESSAGE_RENDERED 事件。");
            } else {
                console.error("[最终数据捕获插件] 错误：无法在全局作用域中找到 eventSource 或 event_types 对象。插件无法工作。");
            }
        });
    }
};

// 运行插件
FinalDataCapturePlugin.init();
