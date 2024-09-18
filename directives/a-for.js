import { directive } from "../directives.js";
import { handleError } from "../utils/logger.js";
import { warn } from "../utils/logger.js";
import { parseForExpression } from "../utils/parse.js";
import { mutateDom, onAttributeChanged } from "../features/supportMutationObserver.js";
import { evaluateInContext } from "../features/supportEvaluateExpression.js";
import { DATA_ATTRIBUTE_PREFIX, getData } from "../features/supportDataStore.js";
import { appendItems } from "../features/supportBucleFor.js";
import { isUndefined } from "../utils/types.js";

directive("for", ({ el, directive }) => {
    const iteratorNames = parseForExpression(directive.expression);
    if (!iteratorNames) {
        handleError("Invalid expression for a-for directive", el);
        return;
    }

    const templateContent = el.innerHTML;
    el.innerHTML = "";
    
    const updateList = () => {
        mutateDom(async () => {
            const parentData = getData(el.parentElement);
            if (!parentData) {
                warn("No parent data found for a-for directive", el);
                return;
            }

            const items = await evaluateInContext(el.parentElement, iteratorNames.items, parentData);
            if (isUndefined(items)) {
                warn(`${iteratorNames.items} is not defined`, el);
                return;
            }

            el.innerHTML = "";
            await appendItems(el, items, parentData, templateContent, iteratorNames);
        });
    };

    updateList();

    const cleanup = onAttributeChanged((element, attributeName) => {
        if (element === el.parentElement && attributeName.startsWith(DATA_ATTRIBUTE_PREFIX)) updateList();
    });
 
    return () => cleanup();
});