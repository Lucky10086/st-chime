/**
 * SillyTavern - 自动重生成不完整回复插件 (IIFE 最终修正版)
 *
 * 修正说明：
 * - 解决了 "Uncaught ReferenceError" 的问题。
 * - 使用了 "立即执行函数表达式" (IIFE) `(function(){ ... })();` 来创建一个安全的、
 *   自包含的作用域，确保插件对象在被调用前一定已经被定义。
 * - 移除了不再需要的 import 语句，以避免潜在的模块加载冲突。
 */

(function () {
    // 将所有代码包裹在这个自执行函数中，确保作用域和执行顺序的绝对安全。

    const PLUGIN_NAME = "[自动重生成插件]";

    const AutoRegeneratePlugin = {
        /**
         * 插件初始化入口
         */
        init() {
            // 我们不再需要 jQuery(document).ready，因为整个脚本会在DOM加载后执行。
            if (typeof eventSource !== 'undefined' && typeof event_types !== 'undefined') {
                console.log(`${PLUGIN_NAME} 初始化成功，正在监听新消息...`);
                eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, this.onMessageRendered.bind(this));
            } else {
                // 如果事件源还不存在，我们可以稍微等待一下
                setTimeout(() => {
                    if (typeof eventSource !== 'undefined' && typeof event_types !== 'undefined') {
                         console.log(`${PLUGIN_NAME} (延迟后) 初始化成功，正在监听新消息...`);
                         eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, this.onMessageRendered.bind(this));
                    } else {
                        console.error(`${PLUGIN_NAME} 错误：核心事件系统未找到，插件无法工作。`);
                    }
                }, 1000); // 等待1秒
            }
        },

        /**
         * 当AI消息渲染完成时被调用
         */
        async onMessageRendered() {
            try {
                // globalThis.SillyTavern.getContext() 是更现代和安全的写法
                const context = globalThis.SillyTavern.getContext();
                const lastMessage = context.chat[context.chat.length - 1];

                if (!lastMessage || lastMessage.is_user) {
                    return;
                }

                const messageText = lastMessage.mes;
                console.log(`${PLUGIN_NAME} 收到新消息，正在根据特定规则检查其完整性...`);
                
                if (this.isMessageIncomplete(messageText)) {
                    console.warn(`${PLUGIN_NAME} 检测到不完整的回复（未能匹配规则），将在1秒后触发自动重生成...`);
                    console.warn(`不完整的回复内容: "${messageText}"`);

                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    if (typeof regenerateLastMessage === 'function') {
                        regenerateLastMessage();
                    } else {
                        console.error(`${PLUGIN_NAME} 错误：无法找到 'regenerateLastMessage' 函数。`);
                    }
                } else {
                    console.log(`${PLUGIN_NAME} 消息内容完整，匹配成功。`);
                }

            } catch (error)
            {
                console.error(`${PLUGIN_NAME} 在处理消息时发生错误:`, error);
            }
        },

        /**
         * 【核心规则函数】
         * 检查消息是否不完整的核心函数。
         */
        isMessageIncomplete(message) {
            const completenessPattern = /<\/content>.*<\/tableEdit>/s;
            return !completenessPattern.test(message);
        }
    };

    // 在这个安全的沙盒环境中，我们现在可以毫无问题地调用 init 方法。
    AutoRegeneratePlugin.init();

})(); // 立即执行这个函数
