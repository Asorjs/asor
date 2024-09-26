import { directive } from "../directives.js";
import { evaluateInContext } from "../features/supportEvaluateExpression.js";
import { onDataChange } from "../features/supportSubscribers.js";
import { getData } from "../features/supportDataStore.js";
import { isFunction } from "../utils/types.js";

directive("effect", ({ el, directive }) => {
    const expression = directive.expression;
    
    const runEffect = async () => {
        const data = el.__asor_def || getData(el);    
        if (!data) return;

        const effectResult = await evaluateInContext(el, expression, { data });
        if (isFunction(effectResult)) return await effectResult();
    };

    let cleanup;
    const executeEffect = async () => {
        if (cleanup) {
            cleanup();
            cleanup = null;
        }
        const newCleanup = await runEffect();
        if (isFunction(newCleanup)) cleanup = newCleanup;
    };

    executeEffect();
    return onDataChange(el, executeEffect);
});