import { warn } from "./utils/logger";
import { clearAllListeners, dispatch } from "./utils/events";
import { mount } from "./directives";
import { isFunction } from "./utils/types";
import { destroyComponets } from "./features/supportComponents"

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

    const mountedComponents = getComponents();

    // Execute destroy on mounted components
    destroyComponets();
    
    clearAllListeners()
    if (window.asor) delete window.asor;
    if (callback && isFunction(callback)) callback();

    dispatch(document, "asor:stopped");
    initialized = false;
}