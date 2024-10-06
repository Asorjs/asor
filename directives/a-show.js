import { directive } from "../directives.js";
import { dispatch } from "../utils/events.js";
import { getDirectiveValue } from "../directives.js";
import { evaluateInContext } from "../features/supportEvaluateExpression.js";
import { isUndefined } from "../utils/types.js";
import { onDataChange } from "../features/supportSubscribers.js";
import { findRootElement } from "../utils/dom.js";

directive("show", ({ el, directive }) => {
    const { expression, modifiers } = directive;

    const root = findRootElement(el);
    if (!root) {
        console.error("No se encontró un elemento raíz con a-def para la directiva a-show.");
        return;
    }

    const update = async () => {
        try {
            const visible = await evaluateInContext(el, expression);
            if (!isUndefined(visible))
                updateVisibility(el, visible, modifiers.has('important'));
        } catch (error) {
            console.error(`Error updating visibility for element:`, el, error);
        }
    };

    update();    

    const cleanup = onDataChange(root, () => update());
    return () => cleanup();
});

function updateVisibility(el, visible, isImportant) {
    const transitionDirective = getDirectiveValue(el, 'transition');
    if (transitionDirective) dispatch(el, 'asor:transition', { visible });
    else {
        el.style.display = visible ? '' : 'none';
        if (isImportant) el.style.setProperty('display', el.style.display, 'important');
    }
}