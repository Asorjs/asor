import { getDirectiveValue } from "../directives";
import { warn } from "../utils/logger";

const targetCache = new WeakMap();

export function getTargetDirective(el) {
    if (targetCache.has(el)) return targetCache.get(el);

    const target = getDirectiveValue(el, "target");
    if (target) {
        const selector = target.expression?.trim();
        if (selector) {
            const element = document.querySelector(selector);
            if (element) {
                targetCache.set(el, element);
                return element;
            }
            warn(`Target element "${selector}" not found. Using original element.`);
        }
    }
    
    targetCache.set(el, el);
    return el;
}

export function removeTargetDirectiveIfNecessary(el) {
    const target = getDirectiveValue(el, "target");
    if (target?.modifiers.includes("once")) {
        el.removeAttribute(target.directive);
        targetCache.delete(el);
    }
}

export function clearTargetCache() {
    targetCache.clear();
}