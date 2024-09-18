import { directive } from "../directives.js";
import { parseTime } from "../utils/duration.js";
import { handleError } from "../utils/logger.js";
import { createEventHandler, setupIntersectObserver, setupOutsideEvent, keyCodeMap, MODIFIER_KEYS } from "../features/supportEvents.js";
import { listen } from "../utils/events.js";
import { evaluateInContext } from "../features/supportEvaluateExpression.js";

directive("on", ({ el, directive }) => {
    const { modifiers, expression, value } = directive;
    
    const eventNames = value ? value.split(',').map(e => e.trim()) : [];
    if (eventNames.length === 0) {
        handleError("No event specified for a-on directive in element: ", el);
        return;
    }

    const options = {
        preventDefault: modifiers?.has("prevent") || false,
        stopPropagation: modifiers?.has("stop") || false,
        once: modifiers?.has("once") || false,
        capture: modifiers?.has("capture") || false,
        passive: modifiers?.has("passive") || false,
        self: modifiers?.has("self") || false,
        window: modifiers?.has("window") || false,
        document: modifiers?.has("document") || false,
        outside: modifiers?.has("outside") || false,
        rootMargin: modifiers?.get("rootMargin")?.value,
        threshold: modifiers?.get("threshold")?.value,
        delay: parseTime(modifiers?.get("debounce")?.value || "0"),
        throttle: parseTime(modifiers?.get("throttle")?.value || "0"),
        keyModifiers: Array.from(modifiers?.keys() || []).filter(key => key in keyCodeMap || MODIFIER_KEYS.includes(key)),
    };

    try {
        const handler = async (event) => {                   
            const result = await evaluateInContext(el, expression, { $event: event , $el: el});
            return result;
        };

        const wrappedHandler = createEventHandler(el, handler, options);
        const cleanup = eventNames.map(event =>
            event === "intersect"
                ? setupIntersectObserver(el, wrappedHandler, options)
                : applyEventListener(el, event, wrappedHandler, options)
        );

        return () => cleanup.forEach(cleanup => cleanup());

    } catch (error) {
        handleError(`Error evaluating expression in a-on directive: ${error.message}`, el);
    }
});

function applyEventListener(el, event, handler, options) {
    if (options.window) return listen(window, event, handler, options);
    if (options.document) return listen(document, event, handler, options);
    if (options.outside && event === "click") return setupOutsideEvent(el, event, handler, options);
    return listen(el, event, handler, options);
}