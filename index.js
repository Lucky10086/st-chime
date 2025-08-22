// 导入与 Chime 插件完全相同的核心对象
import { eventSource, event_types } from "../../../../script.js";

/**
 * 这是一个插件，其目的是捕获并打印在 script.js 中 onSuccess 函数接收到的 `data` 对象。
 * 它通过监听 MESSAGE_RECEIVED 事件来实现，该事件正是由 onSuccess 触发并传递数据的。
 */
const DataCaptureForOnSuccessPlugin = {

    /**
     * 这是我们的事件处理函数。
     * 当 MESSAGE_RECEIVED 事件触发时（通常是在 onSuccess 函数内部），它会被调用。
     * @param {any} data - 这就是从 onSuccess 函数传递过来的数据对象。
     */
    logOnSuccessData(data) {
        console.groupCollapsed(
            "%c[onSuccess 数据捕获插件] 成功捕获到 onSuccess 的 data！",
            "background-color: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
        );
        console.log("%c这个数据对象正是在 script.js 的 onSuccess(data) 函数中接收和处理的那个。", "font-style: italic;");
        console.log("--- 捕获到的原始 data 对象 ---");
        console.log(data); // <--- 这里就是最终您想要的数据！
        console.log("-------------------------------------");
        console.groupEnd();
    },

    /**
     * 插件的初始化入口。
     */
    init() {
        // 使用 jQuery(document).ready 来确保在 DOM 加载完毕后执行，
        // 此时 eventSource 和 event_types 肯定已经可用。
        jQuery(async () => {
            // 检查核心对象是否存在
            if (typeof eventSource !== 'undefined' && typeof event_types !== 'undefined') {
                console.log("[onSuccess 数据捕获插件] 核心事件源已找到，正在绑定监听器...");

                // 绑定我们的处理函数到 MESSAGE_RECEIVED 事件上。
                // 这个事件携带了 onSuccess 函数的数据。
                eventSource.on(event_types.MESSAGE_RECEIVED, this.logOnSuccessData.bind(this));

                console.log("[onSuccess 数据捕获插件] 监听器已绑定v1。等待新消息...");
            } else {
                console.error("[onSuccess 数据捕获插件] 错误：无法找到 eventSource 或 event_types 对象。插件无法工作。");
            }
        });
    }
};

// 运行插件
DataCaptureForOnSuccessPlugin.init();
