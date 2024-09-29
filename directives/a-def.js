import { directive } from "../directives.js";
import { handleError } from "../utils/logger.js";
import { parseDataAttribute } from "../utils/parse.js";
import { createDataProxy } from "../features/supportDataProxy.js";
import { setData, delData, updateData } from "../features/supportDataStore.js";
import { getStore } from "../features/supportStore.js";

directive("def", ({ el, directive }) => {
    try {
        let expression = directive.expression;
        expression = expression === '' ? '{}' : expression;
       
        const rawData = parseDataAttribute(expression, el);
        const proxyData = createDataProxy(rawData, el);
        
        // Add the store to the context
        proxyData.$store = getStore();

        setData(el, proxyData);
        updateData(el);

        return () => {
            delData(el);
            el.removeAttribute('a-def');
        };
    } catch (err) {
        handleError("Error in a-def directive:", err, el);
    }
});