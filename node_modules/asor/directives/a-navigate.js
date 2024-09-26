import { directive } from "../directives.js";
import { NavigationManager } from "../features/supportNavigate.js";
import { ifConfirm } from "../utils/confirm.js";
import { handleError } from "../utils/logger.js";
import { setupIntersectObserver } from "../features/supportEvents.js";
import { listen } from "../utils/events.js";

let navigationManager;

directive("navigate", ({ el, directive }) => {
    if (!navigationManager) navigationManager = new NavigationManager();

    if (el.hasNavigateListener) return;
    el.hasNavigateListener = true;

    let isNavigating = false;

    const handleNavigation = async (e) => {
        if (isNavigating) return;

        isNavigating = true;
        if (e.type === "click") e.preventDefault();

        try {
            if (await ifConfirm(el)) await navigationManager.handleNavigate(e);
        } catch (err) {
            handleError("Navigation error:", err);
        } finally {
            isNavigating = false;
        }
    };

    listen(el, "click", handleNavigation);

    if (directive.hasModifier("lazy")) setupNavigationObserver(el, directive);
    else if (directive.hasModifier("hover")) setupNavigationLazy(el);
});

function setupNavigationObserver(el, directive) {
    const onIntersection = () => {
        const url = el.getAttribute("href");
        if (url) navigationManager.preloadView(url);
    };

    return setupIntersectObserver(el, onIntersection, {
        rootMargin: directive.getModifierValue('margin') || "90px",
        once: directive.hasModifier('once'),
    });
}

function setupNavigationLazy(el) {
    const handler = () => {
        const url = el.getAttribute("href");
        if (url) navigationManager.preloadView(url);
    };

    listen(el, "mouseenter", handler);
}