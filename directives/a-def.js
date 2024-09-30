import { directive } from "../directives";
import { createDataProxy } from "../features/supportDataProxy";
import { setData, updateData, delData } from "../features/supportDataStore";
import { handleError } from "../utils/logger";
import { parseDataAttribute } from "../utils/parse";
import { hasComponent, executeComponentFunction} from "../features/supportComponents";
import { onDataChange } from "../features/supportSubscribers";
import { getStore } from "../features/supportStore";

directive("def",  ({ el, directive }) => {
    try {
        let expression = directive.expression;
        expression = expression === "" ? "{}" : expression;

        let rawData = hasComponent(expression) ? executeComponentFunction(expression, el) : parseDataAttribute(expression, el);

        if (!rawData) {
            handleError(`Failed to obtain data for a-def directive with expression: ${expression}`, { el });
            return;
        }
        
        const proxyData = createDataProxy(rawData, el);
        proxyData.$store = getStore(); // Add the store to the context

        setData(el, proxyData);
        updateData(el);

        const cleanup = onDataChange(el, () => updateData(el));

        return () => {
            cleanup();
            delData(el);
            el.removeAttribute("a-def");
        };

    } catch (err) {
        handleError("Error in a-def directive:", err, el);
    }
});