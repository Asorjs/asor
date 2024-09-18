import { getDirectiveValue, ifElementHasAnyDirective, initDirectives } from "../directives.js";
import { findElementsWithAsorDirectives } from '../utils/dom.js';
import { handleError } from "../utils/logger.js";
import { isObject } from "../utils/types.js";
import { warn } from "../utils/logger.js";
import { setData, updateData } from "./supportDataStore.js";
import { evaluateInContext } from "./supportEvaluateExpression.js";

export async function createItemElement(templateContent, item, key, length, parentData, iteratorNames, el) {
    const template = document.createElement("template");
    template.innerHTML = templateContent.trim();
    const itemEl = template.content.firstElementChild || template.content.firstChild;

    if (!itemEl) {
        handleError("Invalid template in a-for directive", el);
        return null;
    }

    const itemData = {
        ...parentData,
        [iteratorNames.item]: item,
        [iteratorNames.key || "key"]: key,
        [iteratorNames.index || "index"]: key,
        length: length,
        parent: parentData
    };

    setData(itemEl, itemData);
    updateData(itemEl);

    // Check if the element should be displayed based on a-if directive
    const ifDirective = getDirectiveValue(itemEl, "if");
    if (ifDirective && !(await evaluateInContext(itemEl, ifDirective.expression, itemData))) return null;

    // Check if the element should be displayed based on a-show directive
    const showDirective = getDirectiveValue(itemEl, "show");
    if (showDirective) {
        itemEl.style.display = (await evaluateInContext(itemEl, showDirective.expression, itemData)) ? '' : 'none';
    }

    findElementsWithAsorDirectives(itemEl).forEach((childEl) => {
        if(ifElementHasAnyDirective(childEl))      
        initDirectives(childEl);
    });

    return itemEl;
}

export async function appendItems(el, items, parentData, templateContent, iteratorNames) {
    if (items == null) {
        warn('Items is null or undefined in appendItems');
        return;
    }

    const isArray = Array.isArray(items);
    const entries = isArray ? items : (isObject(items) ? Object.entries(items) : []);

    for (let index = 0; index < entries.length; index++) {
        const [key, value] = isArray ? [index, entries[index]] : entries[index];
        const itemEl = await createItemElement(templateContent, value, key, entries.length, parentData, iteratorNames, el);
        if (itemEl) el.appendChild(itemEl);
    }
}
