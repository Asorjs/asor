import { directive } from "../directives";
import { evaluateInContext } from "../features/supportEvaluateExpression";

directive("if", ({ el, directive }) => {
    const { expression } = directive;
    const placeholder = document.createComment(`if: ${expression}`);
    let isConnected = false;

    const cleanup = () => {
        const shouldShow = evaluateInContext(el, expression);
        
        if (shouldShow && !isConnected && el.parentNode) {
            el.parentNode.insertBefore(placeholder, el.nextSibling);
            isConnected = true;
        } else if (!shouldShow && isConnected && el.parentNode) {
            el.parentNode.replaceChild(placeholder, el);
            isConnected = false;
        }
    };

    // Initial setup
    if (el.parentNode) el.parentNode.insertBefore(placeholder, el.nextSibling);

    return () => {
        cleanup();
        if (placeholder.parentNode) placeholder.remove();
        if (isConnected && el.parentNode) el.remove();
    };
});