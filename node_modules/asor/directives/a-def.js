import { directive } from "../directives.js";
import { handleError } from "../utils/logger.js";

import { parseDataAttribute } from "../utils/parse.js";
import { createDataProxy } from "../features/supportDataProxy.js";
import { setData, delData, updateData } from "../features/supportDataStore.js";

directive("def", ({ el, directive }) => {
    try {
        let expression = directive.expression?.trim();
        expression = expression === '' ? '{}' : expression
       
        const rawData = parseDataAttribute(expression, el);
        const proxyData = createDataProxy(rawData, el);
        
        setData(el, proxyData);
        updateData(el);

        return () => delData(el);

    } catch (err) {
        handleError("Error in a-def directive:", err, el);
    }
});