import { directive } from "../directives";
import { request } from "../request";
import { handleError } from "../utils/logger";
import { getRequestMethodFromDirective, getDefaultEventType, createEventHandler } from "../features/supportEvents";
import { listen } from "../utils/events";

directive("xhr", ({ el, directive, manager }) => {
    const url = directive.expression;
    const method = getRequestMethodFromDirective(directive);
    const defaultEvent = getDefaultEventType(el);

    const xhrHandler = async () => {
        if (el.__xhr_request_in_progress) return;
        el.__xhr_request_in_progress = true;

        try {
            await request().handleRequest(el, method, url);
        } catch (err) {
            handleError("XHR request failed:", err);
        } finally {
            el.__xhr_request_in_progress = false;
        }
    };

    let cleanup = () => {};

    if (!manager.hasDirective("on")) {
        const eventHandler = createEventHandler(el, xhrHandler, {
            preventDefault: true,
            stopPropagation: true,
        });
        cleanup = listen(el, defaultEvent, eventHandler);
    } else {
        el.__xhr_handler = xhrHandler;
    }

    return () => {
        cleanup();
        delete el.__xhr_handler;
        delete el.__xhr_request_in_progress;
    };
});