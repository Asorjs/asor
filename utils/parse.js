import { isObject, isString } from "./types";
import { evaluateExpression } from "../features/supportEvaluateExpression";
import { handleError } from "./logger";

export const parseDataAttribute = (dataAttr, el) => {
    if (isObject(dataAttr)) return dataAttr;
    if (!isString(dataAttr) || !dataAttr.trim()) return {};
  
    try {
        const result = evaluateExpression(el, `(${dataAttr})`, {});
        if (isObject(result)) return result;

        handleError(`Invalid data attribute: ${dataAttr}`, el, dataAttr);
    } catch (error) {
        handleError(`Error parsing data attribute: ${error.message}`, el, dataAttr);
        return {};
    }
};

export function parseForExpression(expression) {
    const match = expression.match(/([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/);
    if (!match) return null;

    const [, itemExp, itemsExp] = match;
    const parts = itemExp.replace(/^\(|\)$/g, '').split(',').map(s => s.trim());

    if (parts.length === 1)      return { item: parts[0], items: itemsExp.trim() };
    else if (parts.length === 2) return { item: parts[0], key: parts[1], items: itemsExp.trim() };
    else if (parts.length === 3) return { item: parts[0], key: parts[1], index: parts[2], items: itemsExp.trim() };

    return null;
}