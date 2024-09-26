import { directive, getDirectiveValue } from "../directives.js";
import { applySwapMethod } from "../features/supportSwapMethod.js";
import { onElementRemoved } from "../features/supportMutationObserver.js";
import { dispatch } from "../utils/events.js";

const RECONNECT_DELAY = 5000;

directive("stream", ({ el, directive }) => {
    const url = directive.expression;
    const swapMethod = getDirectiveValue(el, "swap")?.expression || "innerHTML";
    let eventSource = null;

    const connect = () => {
        eventSource = new EventSource(url);
        el._stream = eventSource;

        eventSource.onopen = () => dispatch(el, "stream:open");
        eventSource.onmessage = (event) => handleMessage(el, event, swapMethod);
        eventSource.onerror = (error) => handleError(el, error, connect);
    };

    const disconnect = () => {
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
    };

    connect();
    return onElementRemoved(el, () => disconnect);
});

function handleMessage(el, event, swapMethod) {
    applySwapMethod(el, event.data, swapMethod);
    dispatch(el, "stream:message", { data: event.data });
}

function handleError(el, error, reconnectCallback) {
    dispatch(el, "stream:error", { error });
    reconnectCallback();
    setTimeout(reconnectCallback, RECONNECT_DELAY);
}