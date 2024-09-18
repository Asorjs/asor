import { showHtmlModal } from "./utils/modals.js";
import { getDirectiveValue } from "./directives.js";
import { dispatch } from "./utils/events.js";
import { collectData } from "./features/supportDataCollection.js";
import { updateDOM } from "./features/supportUpdateDom.js";
import { isForm } from "./utils/dom.js";
import { handleError } from "./utils/logger.js";

const cache = new Map();

export const request = () => new Request();

class Request {
    async handleRequest(el, method, url) {
        const options = this.buildRequestOptions(method, el);
        dispatch(document, "asor:before-request", { method, url, options });
        
        try {
            const response = await this.fetchData(method, url, options, el);
            if (!response) return;
            
            await this.handleResponse(response, el);
        } catch (error) {
            this.handlerError(error, el);
        } finally {
            dispatch(document, "asor:after-request", { method, url, options });
        }
    }

    buildRequestOptions(method, el) {
        const options = {
            method: method.toUpperCase(),
            headers: this.buildHeaders(el),
        };

        if (["POST", "PUT", "PATCH"].includes(options.method)) {
            const collectedData = collectData(el);
            options.body = this.prepareRequestBody(el, collectedData);
        }

        return options;
    }

    buildHeaders(el) {
        return {
            Accept: "text/html, application/xhtml+xml",
            "X-Requested-With": "XMLHttpRequest",
            "X-Current-URL": document.location.href,
            "X-Asor": "true",
            "Content-Type": this.getContentType(el)
        };
    }

    getContentType(el) {
        const collectedData = collectData(el);
        return (isForm(el) || collectedData.hasFiles())
            ? undefined
            : getDirectiveValue(el, "enctype")?.expression || "application/json";
    }

    prepareRequestBody(el, collectedData) {
        return (isForm(el) || collectedData.hasFiles())
            ? collectedData.get()
            : JSON.stringify(collectedData.toObject());
    }

    async fetchData(method, url, options, el) {
        dispatch(document, "asor:before-send", { method, url, options });
        dispatch(document, "asor:send", { method, url, options });

        const cacheKey = `${method}:${url}`;
        if (cache.has(cacheKey)) return cache.get(cacheKey);

        const response = await fetch(url, options);
        if (!response.ok) {
            this.handlerError(`HTTP error! status: ${response.status}`, el);
            return false;
        } 

        const responseText = await response.text();
        cache.set(cacheKey, responseText);
        
        return responseText;
    }

    async handleResponse(responseText, el) {
        dispatch(document, "asor:before-render", { response: responseText });

        const targetEl = this.getTargetDirective(el);
        await updateDOM(targetEl, responseText);

        dispatch(document, "asor:render", { html: responseText });
    }

    getTargetDirective(el) {
        const targetSelector = getDirectiveValue(el, "target")?.expression;
        return targetSelector ? document.querySelector(targetSelector) : el;
    }

    handlerError(error, el) {
        handleError("XHR request failed:", el, error);
        showHtmlModal(error.message);
    }
}