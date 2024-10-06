import { directive } from "../directives.js";
import { handleError, warn } from "../utils/logger.js";
import { parseForExpression } from "../utils/parse.js";
import { evaluateInContext } from "../features/supportEvaluateExpression.js";
import { appendItems } from "../features/supportBucleFor.js";
import { isNumber, isUndefined } from "../utils/types.js";
import { findAncestor } from "../utils/dom.js";
import { onDataChange } from "../features/supportSubscribers.js";

directive("for", ({ el, directive }) => {
    const iteratorNames = parseForExpression(directive.expression);
    if (!iteratorNames) {
      handleError("Invalid expression for a-for directive", el);
      return;
    }

    const templateContent = el.innerHTML;
    el.innerHTML = "";

    const dataOwner = findAncestor(el, (ele) => ele.__asor_def);
    if (!dataOwner) {
      handleError("No data owner found for a-for directive", el);
      return;
    }

    let isInitialized = false;
    const updateList = async () => {
        const parentData = dataOwner.__asor_def;
        let items = await evaluateInContext(el, iteratorNames.items, parentData);
        
        if (isNumber(items) ) {
            items = convertNumberToRange(items);
        }  

        if (isUndefined(items)) {
            warn(`${iteratorNames.items} is not defined`, el);
            return;
        }

        await appendItems(el, items, parentData, templateContent, iteratorNames);
        isInitialized = true;
    };

    updateList();
    const cleanup = onDataChange(dataOwner, () => {
      if (isInitialized) updateList();
    });

    return () => cleanup();
});
  
const convertNumberToRange = (items) => {
    const count = items;
    return Array.from({ length: count }, (_, i) => i + 1);
}