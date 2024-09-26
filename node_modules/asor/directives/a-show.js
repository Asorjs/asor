import { directive } from "../directives.js";
import { dispatch } from "../utils/events.js";
import { mutateDom, onAttributeChanged } from "../features/supportMutationObserver.js";
import { getDirectiveValue } from "../directives.js";
import { evaluateInContext } from "../features/supportEvaluateExpression.js";
import { DATA_ATTRIBUTE_PREFIX } from "../features/supportDataStore.js";
import { isUndefined } from "../utils/types.js";

directive("show", ({ el, directive }) => {
    const { expression, modifiers } = directive;

    const update = async () => {
        try {
            const visible = await evaluateInContext(el, expression);
            if (!isUndefined(visible)) updateVisibility(el, visible, modifiers.has('important'));

        } catch (error) {
            console.error(`Error updating visibility for element:`, el, error);
        }
    };

    update();
    
    const cleanup = onAttributeChanged((element, attributeName) => {
        if (element.contains(el) && attributeName.startsWith(DATA_ATTRIBUTE_PREFIX)) update();
    });

    return cleanup;
});

function updateVisibility(el, visible, isImportant) {
    const transitionDirective = getDirectiveValue(el, 'transition');
    if (transitionDirective) dispatch(el, 'asor:transition', { visible });
    else {
        mutateDom(() => {
            el.style.display = visible ? '' : 'none';
            if (isImportant) el.style.setProperty('display', el.style.display, 'important');
        });
    }
}