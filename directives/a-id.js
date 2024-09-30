import { directive } from "../directives.js";
import { generateUniqueId } from "../utils/dom.js";
import { evaluateInContext } from "../features/supportEvaluateExpression.js";

directive("id", async ({ el, directive }) => {
    const names = await evaluateInContext(el, directive.expression?.trim());

    if (!Array.isArray(names)) {
        console.error('a-id directive requires an array expression.');
        return;
    }

    if (!el._asor_ids) el._asor_ids = {};
    names.forEach((key) => {
        if (!el._asor_ids[key]) el._asor_ids[key] = generateUniqueId(key);   
    });
});