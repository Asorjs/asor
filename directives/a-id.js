import { directive } from "../directives.js";
import { generateUniqueId } from "../utils/dom.js";
import { evaluateInContext } from "../features/supportEvaluateExpression.js";

directive("id", async ({ el, directive }) => {
    let names = await evaluateInContext(el, directive.expression?.trim());

    if (!Array.isArray(names)) {
        console.error('a-id directive requires an array expression.');
        return;
    }

    const uniqueIds = {};
    names.forEach((key) => uniqueIds[key] = generateUniqueId(key));
    el._asor_id = (key) => uniqueIds[key] || null;
});