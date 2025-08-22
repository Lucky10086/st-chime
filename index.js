/**
 * SillyTavern - 自动重生成不完整回复插件
 *
 * 核心思路：
 * 1. 使用事件驱动模型，监听 `CHARACTER_MESSAGE_RENDERED` 事件。
 * 2. 在事件触发后，调用 `globalThis.SillyTavern.getContext()` 获取最新消息。
 * 3. 通过一个可自定义的 `isMessageIncomplete` 函数来判断消息是否需要重生成。
 * 4. 如果需要，则调用全局的 `regenerateLastMessage()` 函数。
 */

// 按照标准插件格式，我们保留 import 语句
import { eventSource, event_types } from "../../../../script.js";

const AutoRegeneratePlugin = {

    /**
     * 插件初始化入口
     */
    init() {
        jQuery(() => {
            const PLUGIN_NAME = "[自动重生成插件]";

            if (typeof eventSource !== 'undefined' && typeof event_types !== 'undefined') {
                console.log(`${PLUGIN_NAME} 初始化成功，正在监听新消息...`);
                // 监听 AI 消息渲染完成事件
                eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, this.onMessageRendered.bind(this));
            } else {
                console.error(`${PLUGIN_NAME} 错误：核心事件系统未找到，插件无法工作。`);
            }
        });
    },

    /**
     * 当AI消息渲染完成时被调用
     */
    async onMessageRendered() {
        const PLUGIN_NAME = "[自动重生成插件]";
        
        try {
            // 使用您提供的正确方法获取上下文
            const context = globalThis.SillyTavern.getContext();
            
            // 获取聊天记录的最后一条消息
            const lastMessage = context.chat[context.chat.length - 1];

            // 确保最后一条消息存在并且是来自AI的
            if (!lastMessage || lastMessage.is_user) {
                return;
            }

            const messageText = lastMessage.mes;
            console.log(`${PLUGIN_NAME} 收到新消息，正在检查内容...`);
            
            // 使用我们的检查函数进行判断
            if (this.isMessageIncomplete(messageText)) {
                console.warn(`${PLUGIN_NAME} 检测到不完整的回复，将在1秒后触发自动重生成...`);
                console.warn(`不完整的回复内容: "${messageText}"`);

                // 等待一小段时间，避免操作过快
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 检查重新生成函数是否存在
                if (typeof regenerateLastMessage === 'function') {
                    regenerateLastMessage();
                } else {
                    console.error(`${PLUGIN_NAME} 错误：无法找到 'regenerateLastMessage' 函数。`);
                }
            } else {
                console.log(`${PLUGIN_NAME} 消息内容完整，无需操作。`);
            }

        } catch (error) {
            console.error(`${PLUGIN_NAME} 在处理消息时发生错误:`, error);
        }
    },

    /**
     * 【【【 在这里定义您的规则！ 】】】
      * @param {string} message - AI回复的文本内容。
     * @returns {boolean} - 如果消息不完整，返回 true；否则返回 false。
     */
    isMessageIncomplete(message) {
        // 定义您的正则表达式规则。
        // /<\/content>.*<\/tableEdit>/s 的含义是：
        // 1. 寻找 `</content>` 标签。
        // 2. `.*` 匹配中间的任何字符（包括换行符，因为有 `s` 标志）。
        // 3. 寻找 `</tableEdit>` 标签。
        const completenessPattern = /<\/game>.*<\/summary>/s;

        // 使用 .test() 方法进行检查。
        // 如果消息文本【不】包含这个模式，test() 会返回 false。
        // 我们用 `!` 将其反转，因此当消息不完整时，此函数返回 true。
        return !completenessPattern.test(message);
    }
};

// 启动插件
AutoRegeneratePluginFinal.init();
