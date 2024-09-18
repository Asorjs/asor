import { mutateDom } from "../features/supportMutationObserver.js";
import { getStyle } from "./dom.js";

export function toggleState(el, directive, isTruthy, cachedDisplay = null) {
    mutateDom(() => {
        isTruthy = directive.hasModifier("remove") ? !isTruthy : isTruthy;
    
        if (directive.hasModifier("class")) {
            let classes = directive.expression.split(" ").filter(String);
    
            if (isTruthy) el.classList.add(...classes);
            else el.classList.remove(...classes);
        } else if (directive.hasModifier("attr")) {
            if (isTruthy) el.setAttribute(directive.expression, true);
            else el.removeAttribute(directive.expression);
        } else {
            let cache = cachedDisplay ?? getStyle(el, 'display');
            let display = ["inline", "block", "table", "flex", "grid", "inline-flex"].find((i) => directive.hasModifier(i)) || "inline-block";
    
            display = directive.hasModifier("remove") && !isTruthy ? cache : display;
            el.style.display = isTruthy ? display : "none";
        }
    });
}