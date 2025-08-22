/**
 * 这是一个通过“猴子补丁”技术捕获 script.js 中 onSuccess 函数数据的插件。
 * 它会直接拦截对 onSuccess 函数的调用，记录其参数，然后再执行原始函数。
 */
const OnSuccessInterceptorPlugin = {

    /**
     * 插件的初始化入口。
     */
    init() {
        // 使用 jQuery(document).ready 来确保在 DOM 加载完毕后执行，
        // 此时全局作用域中的 onSuccess 函数肯定已经定义好了。
        jQuery(() => {
            // 检查原始的 onSuccess 函数是否存在于全局作用域中
            if (typeof window.onSuccess === 'function') {
                console.log("[onSuccess 拦截插件] 发现原始 onSuccess 函数，准备进行包装...");

                // 1. 保存对原始函数的引用
                const originalOnSuccess = window.onSuccess;

                // 2. 用我们自己的异步函数覆盖全局的 onSuccess
                window.onSuccess = async function(data) {
                    // 3. 在这里，我们成功拦截到了 data！现在可以为所欲为。
                    console.groupCollapsed(
                        "%c[onSuccess 拦截插件] 成功拦截到 onSuccess(data) 的调用！",
                        "background-color: #9933cc; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
                    );
                    console.log("%c这个数据对象正是在 script.js 的 onSuccess(data) 函数被调用时传入的原始参数。", "font-style: italic;");
                    console.log("--- 捕获到的原始 data 对象 ---");
                    console.log(data); // <--- 这里就是您梦寐以求的 data 对象！
                    console.log("-------------------------------------");
                    console.groupEnd();

                    // 4. 执行原始的 onSuccess 函数，并将参数和 `this` 上下文原封不动地传给它。
                    //    使用 .apply(this, arguments) 是最稳妥的方式。
                    //    我们必须 `await` 并 `return` 它的结果，以确保不会破坏程序的异步流程。
                    try {
                        return await originalOnSuccess.apply(this, arguments);
                    } catch (error) {
                        console.error("[onSuccess 拦截插件] 在执行原始 onSuccess 函数时发生错误:", error);
                        // 即使原始函数出错，也要重新抛出错误，以便程序的其他部分能够捕获它。
                        throw error;
                    }
                };

                console.log("[onSuccess 拦截插件] 包装完成。现在将自动捕获所有生成的消息数据。");

            } else {
                console.error("[onSuccess 拦截插件] 错误：无法在全局作用域 (window) 中找到 onSuccess 函数。插件无法工作。");
            }
        });
    }
};

// 运行插件
OnSuccessInterceptorPlugin.init();
