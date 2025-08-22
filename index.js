/**
 * SillyTavern - onSuccess 原始数据捕获插件 (事件驱动最终版)
 *
 * 核心思路：
 * 1. 完全采纳用户的正确思路：抛弃不稳定的定时器，使用可靠的事件驱动模型。
 * 2. 使用已被证明可以被 SillyTavern 成功加载的插件结构作为基础。
 * 3. 监听一个在应用初始化后期才会触发的关键事件：`CHARACTER_LOADED`。
 * 4. 当 `CHARACTER_LOADED` 事件被触发时，我们知道此时 `window.onSuccess` 必定已经准备就绪。
 * 5. 在该事件的处理函数中，执行一次性的“猴子补丁”操作，以拦截 `onSuccess` 的数据。
 */

// 保留此 import 以确保插件加载方式的正确性。
import { eventSource, event_types } from "../../../../script.js";

const DataCaptureEventDrivenPlugin = {
    // 添加一个标志位，确保我们的拦截逻辑只执行一次。
    isInitialized: false,

    /**
     * 插件的初始化入口。
     */
    init() {
        // 使用 jQuery(document).ready 是一个好习惯，确保 DOM 结构已加载。
        jQuery(() => {
            const PLUGIN_NAME = "[事件驱动数据捕获插件]";

            // 检查核心事件对象是否存在，以防万一。
            if (typeof eventSource !== 'undefined' && typeof event_types !== 'undefined') {
                console.log(`${PLUGIN_NAME} 初始化成功。正在监听 '角色加载完成' 事件...`);
                
                // 绑定我们的处理函数到 CHARACTER_LOADED 事件上。
                // 当角色加载完毕，应用准备就绪时，这个函数就会被调用。
                eventSource.on(event_types.CHARACTER_LOADED, this.onCharacterLoaded.bind(this));
            } else {
                console.error(`${PLUGIN_NAME} 错误：无法找到 eventSource 或 event_types 对象。插件无法工作。`);
            }
        });
    },

    /**
     * 当 'CHARACTER_LOADED' 事件触发时，此函数被调用。
     * 这是我们执行拦截操作的最佳时机。
     */
    onCharacterLoaded() {
        const PLUGIN_NAME = "[事件驱动数据捕获插件]";

        // 使用标志位，确保无论事件触发多少次，我们的核心逻辑只运行一次。
        if (this.isInitialized) {
            return;
        }
        this.isInitialized = true; // 设置标志位，防止重复执行

        console.log(`${PLUGIN_NAME} '角色加载完成' 事件已触发。开始拦截 'onSuccess' 函数...`);

        // 在这个时间点，我们可以100%确定 window.onSuccess 已经存在。
        if (typeof window.onSuccess === 'function') {
            // 1. 保存对原始 `onSuccess` 函数的引用
            const originalOnSuccess = window.onSuccess;

            // 2. 用我们自己的新函数来覆盖全局的 `window.onSuccess`
            window.onSuccess = async function(data) {
                // 3. 拦截成功！打印捕获到的原始 data 对象
                console.groupCollapsed(
                    `%c${PLUGIN_NAME} 成功捕获到 'onSuccess' 的原始数据！`,
                    "background-color: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
                );
                console.log("这是从 API 直接返回的、未经处理的原始数据对象:");
                console.log(data); // <--- 这里就是您要的最终数据！
                console.groupEnd();

                // 4. 调用原始函数，确保 SillyTavern 正常运行。
                return await originalOnSuccess.apply(this, arguments);
            };

            console.log(`${PLUGIN_NAME} 拦截器已成功应用。`);
        } else {
            console.error(`${PLUGIN_NAME} 错误：在 '角色加载完成' 后依然未能找到 'window.onSuccess' 函数。拦截失败。`);
        }
    }
};

// 运行插件
DataCaptureEventDrivenPlugin.init();
