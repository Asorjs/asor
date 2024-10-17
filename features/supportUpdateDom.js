import { getDirectiveValue } from "../directives";
import { applySwapMethod, getSwapDirective } from "../features/supportSwapMethod";
import { getTargetDirective, removeTargetDirectiveIfNecessary } from "../features/supportTargets";
import { reinitializeDirectives } from "../directives";
import { findElementsWithAsorDirectives } from "../utils/dom";
import { dispatch } from "../utils/events";
import { delData, getData, setData } from "../features/supportDataStore";

const updateQueue = new Set();
let isUpdating = false;

export async function updateDOM(element, responseHTML) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(responseHTML, "text/html");

    const target = getTargetDirective(element);
    const swapMethod = getSwapDirective(target);
    const newContent = doc.body.innerHTML;

    const oldDOM = target.cloneNode(true);
    
    queueDomUpdate(target, () => {
        applySwapMethod(target, newContent, swapMethod);
        updateDirectivesAndState(oldDOM, target);
        applyTransition(target);
        removeTargetDirectiveIfNecessary(target);
    });
}

function updateDirectivesAndState(oldDOM, newDOM) {
    const oldElements = findElementsWithAsorDirectives(oldDOM);
    const newElements = findElementsWithAsorDirectives(newDOM);

    newElements.forEach(newEl => {
        const oldEl = oldElements.find(el => el.isEqualNode(newEl));
        if (oldEl) {
            const oldData = getData(oldEl);
            if (oldData) setData(newEl, oldData);
        }
    });

    reinitializeDirectives(newDOM, oldDOM);

    oldElements.forEach(oldEl => {
        if (!newElements.some(newEl => newEl.isEqualNode(oldEl))) cleanupElement(oldEl);
    });
}

function cleanupElement(el) {
    const data = getData(el);

    if (data && data.$refs) {
        Object.keys(data.$refs).forEach(refName => {
            if (data.$refs[refName] === el) delete data.$refs[refName];
        });
    }

    delData(el);
    Array.from(el.children).forEach(cleanupElement);
}

function applyTransition(el) {
    const transition = getDirectiveValue(el, "transition");
    if (!transition) return;

    dispatch(el, 'asor:transition', { visible: true });
}

export function queueDomUpdate(el, updateFn) {
    updateQueue.add({ el, updateFn });
    scheduleUpdate();
}

function scheduleUpdate() {
    if (!isUpdating) {
        isUpdating = true;
        requestAnimationFrame(flushDomUpdates);
    }
}

function flushDomUpdates() {
    for (const { el, updateFn } of updateQueue) {
        updateFn(el);
    }
    updateQueue.clear();
    isUpdating = false;
}