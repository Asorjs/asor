import { directive } from "../directives";
import { setupInputEvent, updateElement } from "../features/supportDataBinding";
import { handleError } from "../utils/logger";
import { evaluateInContext } from "../features/supportEvaluateExpression";
import { getData } from "../features/supportDataStore";
import { findAncestor } from "../utils/dom";
import { isUndefined } from "../utils/types";
import { onDataChange } from "../features/supportSubscribers";

directive("bind", ({ el, directive}) => {
    const bindType = directive.value || "text";
    const bindExpression = directive.expression;
    if (!bindExpression) {
        handleError("La expresión de binding está vacía", null, el);
        return;
    }

    const dataOwner = findAncestor(el, (ele) => ele.__asor_def);
    if (!dataOwner) {
        handleError("No se encontró un propietario de datos para la directiva a-bind", el);
        return;
    }

    let inputCleanup = null; // Will store the event listener's clearing function

    const update = async () => {
        try {
            const data = getData(dataOwner);
            const value = await evaluateInContext(el, bindExpression, { data });
            if (isUndefined(value)) return;
            updateElement(el, bindType, value);

            if (inputCleanup) inputCleanup();

            inputCleanup = setupInputEvent(el, bindExpression);
        } catch (error) {
            handleError("Error al actualizar el binding:", error, el);
        }
    };

    update();
    const cleanupDataChange = onDataChange(dataOwner, () => update());

    return () => {
        cleanupDataChange();
        if (inputCleanup) inputCleanup();
    };
});