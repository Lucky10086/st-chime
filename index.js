/**
 * SillyTavern onSuccess Data Capture Plugin
 *
 * This plugin correctly intercepts the raw `data` object received by the core
 * `onSuccess(data)` function in SillyTavern's main script.
 *
 * How it works:
 * 1. The core `onSuccess` function is not immediately global. It is assigned to
 *    `window.onSuccess` inside a `$(document).ready()` block in script.js.
 * 2. This plugin waits until `window.onSuccess` has been defined.
 * 3. Once available, it "monkey-patches" the function: it saves the original
 *    function, then replaces `window.onSuccess` with a new function.
 * 4. This new function first logs the raw `data` object to the console (achieving our goal)
 *    and then calls the original `onSuccess` function with the same data, ensuring
 *    that SillyTavern continues to operate normally.
 */
(function () {
    const PLUGIN_NAME = "[onSuccess Data Capture Plugin]";
    const MAX_WAIT_TIME = 20000; // Wait a maximum of 20 seconds
    const POLL_INTERVAL = 100;   // Check every 100ms

    let totalWaitTime = 0;

    console.log(`${PLUGIN_NAME} Loaded. Waiting for 'window.onSuccess' to become available...`);

    // We must wait for the main script.js to finish its setup and assign onSuccess to the window.
    const readyCheckInterval = setInterval(() => {
        if (typeof window.onSuccess === 'function') {
            // Success! The function is now global.
            clearInterval(readyCheckInterval);
            patchOnSuccess();
        } else {
            // Not ready yet, check again later.
            totalWaitTime += POLL_INTERVAL;
            if (totalWaitTime >= MAX_WAIT_TIME) {
                clearInterval(readyCheckInterval);
                console.error(`${PLUGIN_NAME} Error: Timed out waiting for 'window.onSuccess'. The plugin will not run.`);
            }
        }
    }, POLL_INTERVAL);


    function patchOnSuccess() {
        console.log(`${PLUGIN_NAME} 'window.onSuccess' found. Applying interceptor.`);

        // 1. Store a reference to the original function
        const originalOnSuccess = window.onSuccess;

        // 2. Overwrite the global function with our new async wrapper function
        window.onSuccess = async function(data) {
            // 3. This is the moment! We have captured the raw data.
            console.groupCollapsed(
                `%c${PLUGIN_NAME} Intercepted raw 'onSuccess(data)' object!`,
                "background-color: #8E44AD; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
            );
            console.log("%cThis is the unprocessed data object directly from the API response.", "font-style: italic;");
            console.log(data); // <--- THIS IS YOUR DATA!
            console.groupEnd();

            // 4. CRITICAL: Call the original function with the original arguments and context.
            // We must 'await' and 'return' the result to not break SillyTavern's async flow.
            try {
                return await originalOnSuccess.apply(this, arguments);
            } catch (error) {
                console.error(`${PLUGIN_NAME} An error occurred while executing the original onSuccess function:`, error);
                // Re-throw the error so SillyTavern's own error handling can catch it.
                throw error;
            }
        };

        console.log(`${PLUGIN_NAME} Interceptor applied successfully. Ready to capture data.`);
    }
})();
