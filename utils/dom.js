import { handleError } from "./logger.js";

export const findAncestor = (el, condition) => {
    while (el && el !== document.body) {
        if (condition(el)) return el;
        el = el.parentElement;
    }
    return null;
};

export const getMetaContent = (name) => document.querySelector(`meta[name='${name}']`)?.getAttribute("content") || "";
export const getCsrfToken = () => document.querySelector('meta[name="csrf-token"], [data-csrf]')?.getAttribute("content") || handleError("No CSRF token detected");
export const findDefElement = (el) => findAncestor(el, (ele) => ele.hasAttribute('a-def')) || document.body;
export const findRootElement = (el) => findAncestor(el, (ele) => (ele.dataset && Object.keys(ele.dataset).length > 0 ) || ele.hasAttribute('a-def')) || document.body;
export const isAncestor = (ancestor, descendant) => descendant.closest(ancestor.tagName) === ancestor;
export const isForm = el => el.tagName === "FORM";
export const isInputFile = el => el.tagName === "INPUT" && el.type === "file";
export const removeElement = el => el?.remove();
export const removeClass = (el, className) => el.classList.remove(className);
export const getStyle = (target, prop) => window.getComputedStyle(target).getPropertyValue(prop);
export const closest = (el, selector) => el.closest?.(selector) || findAncestor(el, e => e.matches(selector));
export const generateUniqueId = (length = 8, prefix = 'asor-') =>`${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 2 + length)}`;
export const generateStateHash = (length = 36) => Math.random().toString(length).substring(2, 10);

export function findElementsWithAsorDirectives(root = document.body, prefixes = ["a-", "@", ":"]) {
    const elements = [];
    const iterator = document.createNodeIterator(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => Array.from(node.attributes).some((attr) => prefixes.some((prefix) => attr.name.startsWith(prefix))) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
      }
    );
    let currentNode;
    while ((currentNode = iterator.nextNode())) // Corregido
      elements.push(currentNode);
    return elements;
}