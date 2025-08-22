// 导入与 Chime 插件完全相同的核心对象
import { eventSource, event_types } from "../../../../script.js";

/**
 * 这是一个极简的插件，其唯一目的是捕获并打印 MESSAGE_RECEIVED 事件的数据。
 */
const DataCapturePlugin = {

    /**
     * 这是我们的事件处理函数。
     * 当 MESSAGE_RECEIVED 事件触发时，它会自动被调用，并接收到包含所有回复内容的数据。
     * @param {any} data - 这就是我们梦寐以求的数据！
     */
    logMessageData(data) {
        console.groupCollapsed("%c[数据捕获插件] 成功捕获到新消息数据！", "background-color: #28a745; color: white; padding: 4px 8px; border-radius: 4px;");
        console.log("--- 捕获到的原始数据对象 (这就是 onSuccess 的 data) ---");
        console.log(data); // <--- 这里就是最终的数据！
        console.log("--------------------------------------------------");
        console.groupEnd();
    },

    /**
     * 插件的初始化入口。
     */
    init() {
        // 使用 jQuery(document).ready 来确保在 DOM 加载完毕后执行，
        // 此时 eventSource 和 event_types 肯定已经可用。
        jQuery(async () => {
            // 检查核心对象是否存在，以防万一
            if (typeof eventSource !== 'undefined' && typeof event_types !== 'undefined') {
                console.log("[数据捕获插件] 核心事件源已找到，正在绑定监听器...");

                // 绑定我们的处理函数到 MESSAGE_RECEIVED 事件上
                eventSource.on(event_types.MESSAGE_RECEIVED, this.logMessageData.bind(this));
            } else {
                console.error("[数据捕获插件] 错误：无法找到 eventSource 或 event_types 对象。插件无法工作。");
            }
        });
    }
};

// 运行插件
DataCapturePlugin.init();
