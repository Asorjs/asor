import { getDirectiveValue } from "../directives.js";
import { handleError } from "../utils/logger.js";
import { mutateDom } from "./supportMutationObserver.js";

export function getSwapDirective(el) {
    return getDirectiveValue(el, "swap")?.expression || "innerHTML";
}

const swapFunctions = {
    innerHTML: (el, content) => { el.innerHTML = content; },
    outerHTML: (el, content) => { el.outerHTML = content; },
    beforebegin: (el, content) => { el.insertAdjacentHTML("beforebegin", content); },
    afterbegin: (el, content) => { el.insertAdjacentHTML("afterbegin", content); },
    beforeend: (el, content) => { el.insertAdjacentHTML("beforeend", content); },
    afterend: (el, content) => { el.insertAdjacentHTML("afterend", content); },
    replace: (el, content) => { el.replaceWith(...createNodesFromHTML(content)); },
    append: (el, content) => { el.append(...createNodesFromHTML(content)); },
    prepend: (el, content) => { el.prepend(...createNodesFromHTML(content)); }
};

export function applySwapMethod(el, content, swapMethod) {
    try {
        mutateDom(() =>  {
            const swapFunction = swapFunctions[swapMethod] || swapFunctions.innerHTML;
            swapFunction(el, content);
        })
    
    } catch (error) {
        handleError(`Error applying swap method "${swapMethod}":`, error);
    }
}

const createNodesFromHTML = (content) => {
    const temp = document.createElement('div');
    temp.innerHTML = content;
    return temp.childNodes;
};

export function isValidSwapMethod(method) {
    return method in swapFunctions;
}