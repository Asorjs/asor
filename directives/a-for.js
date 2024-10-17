import { directive } from "../directives";
import { handleError, warn } from "../utils/logger";
import { parseForExpression } from "../utils/parse";
import { evaluateInContext } from "../features/supportEvaluateExpression";
import { appendItems } from "../features/supportBucleFor";
import { isNumber, isUndefined } from "../utils/types";
import { findAncestor } from "../utils/dom";
import { onDataChange } from "../features/supportSubscribers";

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