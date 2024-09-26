import { warn } from "./utils/logger.js";
import { dispatch } from "./utils/events.js";
import { initializeDirectives } from "./directives.js";
import { resetInitializationState, startObservingMutations, stopObserving } from './features/supportMutationObserver.js';
import { cleanupDataProxy } from './features/supportDataProxy.js';
import { DATA_ATTRIBUTE_PREFIX } from "./features/supportDataStore.js";
import { isFunction } from "./utils/types.js";

let initialized = false;

export function start(forceInit = false) {
    if (initialized && !forceInit) {
        warn("Asor is already initialized. Skipping re-initialization.");
        return;
    }

    stop();

    const initialize = () => {
        resetInitializationState();
        dispatch(document, "asor:init");
        dispatch(document, "asor:initializing");

        requestAnimationFrame(() => {
            startObservingMutations();
            initializeDirectives();
            initialized = true;
            dispatch(document, "asor:initialized");
        });
    };
    
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
    else initialize();
}

export function stop(callback = null) {
    if (!initialized) return;

    stopObserving();
    cleanupAllElements();
    
    if (window.asor) delete window.asor;
    if (callback && isFunction(callback)) callback();

    dispatch(document, "asor:stopped");
    initialized = false;
}

function cleanupAllElements() {
    document.querySelectorAll('*').forEach(el => {
        const dataAttributes = Array.from(el.attributes).filter(attr => attr.name.startsWith(DATA_ATTRIBUTE_PREFIX));
        dataAttributes.forEach(attr => el.removeAttribute(attr.name));
        cleanupDataProxy(el);
    });
}