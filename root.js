import { warn } from "./utils/logger.js";
import { clearAllListeners, dispatch } from "./utils/events.js";
import { mount } from "./directives.js";
import { isFunction } from "./utils/types.js";

let initialized = false;

export function start(forceInit = false) {
    if (initialized && !forceInit) {
        warn("Asor is already initialized. Skipping re-initialization.");
        return;
    }

    stop();

    const initialize = () => {
        dispatch(document, "asor:init");
        dispatch(document, "asor:initializing");

        requestAnimationFrame(() => {
            mount();
            initialized = true;
            dispatch(document, "asor:initialized");
        });
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
    else initialize();
}

export function stop(callback = null) {
    if (!initialized) return;

    clearAllListeners()
    if (window.asor) delete window.asor;
    if (callback && isFunction(callback)) callback();

    dispatch(document, "asor:stopped");
    initialized = false;
}