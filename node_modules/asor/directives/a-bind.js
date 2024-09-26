import { directive } from "../directives.js";
import { setupInputEvent, updateElement } from "../features/supportDataBinding.js";
import { mutateDom, onAttributeChanged } from "../features/supportMutationObserver.js";
import { handleError } from "../utils/logger.js";
import { evaluateInContext } from "../features/supportEvaluateExpression.js";
import { DATA_ATTRIBUTE_PREFIX, getData } from "../features/supportDataStore.js";
import { isUndefined } from "../utils/types.js";

directive("bind", ({ el, directive }) => {    
    const bindType = directive.value || 'text';
    const bindExpression = directive.expression;

    if (!bindExpression) {
        handleError("Empty bind expression", null, el);
        return;
    }

    const update = async() => {
        const data = getData(el);
        const value = await evaluateInContext(el, bindExpression, { data });
        if (isUndefined(value)) return;
       
        mutateDom( async() => {
            updateElement(el, bindType, value);
            setupInputEvent(el, bindExpression );
        });
    }

    update();

    const cleanup = onAttributeChanged((element, attributeName) => {
        if (element.contains(el) && attributeName.startsWith(DATA_ATTRIBUTE_PREFIX)) update();
    });

    return () => cleanup;
});