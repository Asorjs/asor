import { directive } from "../directives.js";
import { getData } from "../features/supportDataStore.js";
import { evaluateInContext } from "../features/supportEvaluateExpression.js";
import { handleError } from "../utils/logger.js";

directive("init", ({ el, directive }) => {
    const expression = directive.expression?.trim();
    if (!expression) return;

    const data = el.__asor_def || getData(el);    
    if (!data) {
        handleError("No data found for a-init directive:", el);
        return;
    }
    
    const update = async () => await evaluateInContext(el, expression, { data, $el: el });

    update();
});