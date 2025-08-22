// 导入 script.js 导出的所有内容，并将其命名为 MainScript
import * as MainScript from "../../../../script.js";

/**
 * 这是一个“函数补丁”插件。
 * 它直接访问从 script.js 导入的模块，并修改其内部的 updateTokens 函数，
 * 以便在不破坏其原有功能的情况下，拦截并打印出 prompts 参数。
 */
const FunctionPatcherPlugin = {

    /**
     * 插件的初始化入口。
     */
    init() {
        // 使用 jQuery(document).ready 确保在所有脚本都已加载和解析后执行
        jQuery(async () => {
            console.log("[函数补丁插件] 插件已启动，正在查找 updateTokens 函数...");

            // 打印出我们从 script.js 导入的所有东西，方便调试
            console.log("[函数补丁插件] 从 script.js 模块中导入的内容:", MainScript);

            // 检查 MainScript 对象中是否存在一个名为 'updateTokens' 的函数
            if (MainScript && typeof MainScript.updateTokens === 'function') {
                console.log("%c[函数补丁插件] 成功找到 updateTokens 函数！正在应用补丁...", "color: #007bff; font-weight: bold;");

                // 1. 保存原始的 updateTokens 函数的引用
                const originalUpdateTokens = MainScript.updateTokens;

                // 2. 用我们自己的新函数覆盖掉模块中的 updateTokens
                MainScript.updateTokens = function(prompts, type) {
                    
                    // --- 这是我们植入的核心逻辑 ---
                    // 3. 检查类型是否是我们想要的 'receive'
                    if (type === 'receive') {
                        console.groupCollapsed("%c[函数补丁插件] 成功拦截到 'receive' 数据！", "background-color: #28a745; color: white; padding: 4px 8px; border-radius: 4px;");
                        console.log("--- 捕获到的 prompts 原始内容 ---");
                        console.log(prompts); // <--- 这就是您最终想要的完整数据！
                        console.log("------------------------------------");
                        console.groupEnd();
                    }
                    
                    // 4. 调用原始的 updateTokens 函数，并把参数原封不动地传进去
                    //    这样可以确保计算 tokens、更新UI等原有功能完全不受影响
                    return originalUpdateTokens.apply(this, arguments);
                };

            } else {
                console.error("[函数补丁插件] 错误：在 script.js 模块中未找到名为 'updateTokens' 的导出函数。");
            }
        });
    }
};

// 运行插件
FunctionPatcherPlugin.init();
