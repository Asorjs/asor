import { directive } from "../directives";
import { evaluateInContext } from "../features/supportEvaluateExpression";
import { onDataChange } from "../features/supportSubscribers";
import { getData } from "../features/supportDataStore";
import { isFunction } from "../utils/types";

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