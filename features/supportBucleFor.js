import { getDirectiveValue, ifElementHasAnyDirective, initDirectives } from "../directives";
import { findElementsWithAsorDirectives } from '../utils/dom';
import { handleError, warn } from "../utils/logger";
import { setData, updateData } from "./supportDataStore";
import { evaluateInContext } from "./supportEvaluateExpression";

export async function createItemElement(templateContent, item, key, length, parentData, iteratorNames, el) {
    const template = document.createElement("template");

    template.innerHTML = templateContent.trim();
    let itemEl = template.content.firstElementChild || template.content.firstChild;

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

    // Verificar la directiva a-if
    const ifDirective = getDirectiveValue(itemEl, "if");
    if (ifDirective && !(await evaluateInContext(itemEl, ifDirective.expression, itemData))) return null;

    // Verificar la directiva a-show
    const showDirective = getDirectiveValue(itemEl, "show");
    if (showDirective)
        itemEl.style.display = (await evaluateInContext(itemEl, showDirective.expression, itemData)) ? '' : 'none';

    // Inicializar las directivas dentro del nuevo elemento
    findElementsWithAsorDirectives(itemEl).forEach((childEl) => {
        if (ifElementHasAnyDirective(childEl))
            initDirectives(childEl);
    });

    return itemEl;
}

export async function appendItems(el, items, parentData, templateContent, iteratorNames) {
    if (items == null) {
        warn("Items is null or undefined in appendItems");
        return;
    }

    const isArray = Array.isArray(items);
    const entries = isArray ? items : Object.entries(items);
    const fragment = document.createDocumentFragment();

    // Remove previously generated items
    const generatedItems = el.parentElement.querySelectorAll('[data-asor-generated="true"]');
    generatedItems.forEach(itemEl => itemEl.remove());

    // Create and append new items to the fragment
    for (const [index, entry] of entries.entries()) {
        const key = isArray ? index : entry[0];
        const value = isArray ? entry : entry[1];
        const itemEl = await createItemElement(templateContent, value, key, entries.length, parentData, iteratorNames, el);
        if (itemEl) {
            itemEl.setAttribute('data-asor-generated', 'true');
            fragment.appendChild(itemEl);
        }
    }

    // Verify if the parent element exists before inserting
    el.parentElement.insertBefore(fragment, el.nextSibling);
}