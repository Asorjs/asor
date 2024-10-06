
import { directive } from "../directives.js";
import { handleError, warn } from "../utils/logger.js";
import { parseForExpression } from "../utils/parse.js";
import { mutateDom, onAttributeChanged } from "../features/supportMutationObserver.js";
import { evaluateInContext } from "../features/supportEvaluateExpression.js";
import { DATA_ATTRIBUTE_PREFIX, getData } from "../features/supportDataStore.js";
import { isUndefined, isObject } from "../utils/types.js";

// Manejar el ciclo `a-for` directamente en <select> sin usar plantillas.
directive("for", ({ el, directive }) => {
    const parentEl = el.parentElement;
    const isSelect = parentEl.tagName.toLowerCase() === 'select';

    if (isSelect) {
        const iteratorNames = parseForExpression(directive.expression);
        if (!iteratorNames) {
            handleError("Invalid expression for a-for directive", el);
            return;
        }

        const updateSelectOptions = async () => {
            const parentData = getData(parentEl);
            if (!parentData) {
                warn("No parent data found for a-for directive", parentEl);
                return;
            }

            const items = await evaluateInContext(parentEl, iteratorNames.items, parentData);
            if (isUndefined(items)) {
                warn(`${iteratorNames.items} is not defined`, parentEl);
                return;
            }

            mutateDom(() => {
                // Limpiar las opciones existentes excepto la primera (el placeholder 'Choose a state')
                while (parentEl.options.length > 1) {
                    parentEl.remove(1);
                }

                // Agregar nuevas opciones basadas en los items
                const entries = Array.isArray(items) ? items : (isObject(items) ? Object.entries(items) : []);

                entries.forEach((entry, index) => {
                    const [key, value] = Array.isArray(items) ? [index, entry] : entry;
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;

                    // Añadir la opción generada al <select>
                    parentEl.appendChild(option);
                });
            });
        };

        // Llamar a la función para actualizar las opciones cuando cambien los datos
        updateSelectOptions();

        // Observar cambios en los datos para actualizar el <select>
        const cleanup = onAttributeChanged((element, attributeName) => {
            if (element === parentEl && attributeName.startsWith(DATA_ATTRIBUTE_PREFIX)) {
                updateSelectOptions();
            }
        });

        return () => cleanup();
    }
});
