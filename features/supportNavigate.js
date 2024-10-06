import { PBar } from "./supportProgressBar.js";
import { handleError } from "../utils/logger.js";
import { warn } from "../utils/logger.js";
import { dispatch } from "../utils/events.js";
import { isFunction } from "../utils/types.js";

const MAX_CACHE_SIZE = 50;

export class NavigationManager {
    constructor() {
        this.progressBar = new PBar({ delay: 250 });
        this.cache = new Map();
        this.scrollPositions = new Map();
        this.currentRequest = null;
        this.executedScripts = new Set();

        window.addEventListener("popstate", this.handlePopState.bind(this));
    }

    handleNavigate = async (event) => {
        if (this.shouldInterceptClick(event)) return;
        event.preventDefault();

        const url = event.currentTarget.href || event.currentTarget.getAttribute("href");
        if (!url) {
            handleError("No URL found for navigation.");
            return;
        }

        await this.navigate(url);
    }

    shouldInterceptClick = (event) => 
        event.which > 1 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;

    handlePopState = async () => {
        const url = window.location.href;
        const cacheKey = new URL(url, document.baseURI).href;

        if (this.cache.has(cacheKey)) {
            const response = this.cache.get(cacheKey);
            await this.renderView(response.html);
            // this.rehydrateBindings();
        } else {
            await this.navigate(url, { pushState: false });
        }
    }
    
    async navigate(url, options = { pushState: true }) {
        try {
            this.clearExecutedScripts();
            this.progressBar.show();
            this.saveScrollPosition();

            dispatch(document, "asor:navigating", { url });

            const response = await this.loadView(url);
            if (!response) return;

            const urlObject = new URL(url, document.baseURI);

            if (options.pushState) {
                await this.updateState("pushState", urlObject.href);
            } else {
                await this.updateState("replaceState", urlObject.href);
            }

            await this.renderView(response.html);
            this.restoreScrollPosition(url);
            this.animateTransition();

            dispatch(document, "asor:navigated", { url: urlObject.href });
        } catch (err) {
            handleError("Navigation error:", err);
        } finally {
            this.progressBar.hide();
        }
    }

    async loadView(url) {
        const fullUrl = new URL(url, document.baseURI).href;
        const cacheKey = fullUrl;

        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

        if (this.currentRequest) this.currentRequest.abort();

        const controller = new AbortController();
        this.currentRequest = controller;

        try {
            const response = await fetch(fullUrl, {
                method: "GET",
                headers: { "X-Requested-With": "XMLHttpRequest" },
                signal: controller.signal,
            });

            if (!response.ok) handleError(`Navigation to ${url} failed with state ${response.status}`);

            const html = await response.text();
            const result = { html };
            this.cache.set(cacheKey, result);
            this.trimCache();
            return result;
        } catch (err) {
            if (err.name === "AbortError") warn(`Solicitud a ${url} abortada`);
            else handleError(`Error while navigating to ${url}:`, err);
            throw err;
        } finally {
            if (this.currentRequest === controller) this.currentRequest = null;
        }
    }

    trimCache() {
        if (this.cache.size > MAX_CACHE_SIZE) {
            const keysToDelete = Array.from(this.cache.keys()).slice(0, this.cache.size - MAX_CACHE_SIZE);
            keysToDelete.forEach(key => this.cache.delete(key));
        }
    }

    saveScrollPosition() {
        const url = new URL(window.location.href);
        const key = url.href;

        this.scrollPositions.set(key, {
            x: window.scrollX,
            y: window.scrollY,
        });
    }

    restoreScrollPosition(url) {
        const urlObj = new URL(url);
        const key = urlObj.href;

        requestAnimationFrame(() => {
            const position = this.scrollPositions.get(key) || { x: 0, y: 0 };
            window.scrollTo(position.x, position.y);
        });
    }

    animateTransition() {
        document.body.style.opacity = "0";
        requestAnimationFrame(() => {
            document.body.style.transition = "opacity 0.3s";
            document.body.style.opacity = "1";
            setTimeout(() => { document.body.style.transition = ""; }, 300);
        });
    }

    async updateState(method, url) {
        try {
            history[method]({}, document.title, url);
        } catch (err) {
            if (err instanceof DOMException && err.name === "SecurityError") {
                handleError(`You cannot use asor:navigate with a link to a different root domain: ${url}`);
            }
        }
    }

    async renderView(html) {
        const parser = new DOMParser();
        const newDocument = parser.parseFromString(html, "text/html");

        document.title = newDocument.title;
        
        await this.updateHead(newDocument.head);
        await this.updateBody(newDocument.body);

        this.executeScripts(document.head);
        this.executeScripts(document.body);

        if (window.Asor && isFunction(window.Asor.start)) window.Asor.start(true);
    }

    async updateHead(newHead) {
        const currentHead = document.head;
        
        Array.from(currentHead.children).forEach(child => {
            if (!child.hasAttribute("data-persist")) child.remove();
        });

        Array.from(newHead.children).forEach(child => {
            if (!child.hasAttribute("data-persist")) currentHead.appendChild(child.cloneNode(true));
        });
    }

    async updateBody(newBody) {
        document.body.innerHTML = newBody.innerHTML;
    }

    executeScripts(container) {
        container.querySelectorAll("script").forEach(oldScript => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));

            if (oldScript.src) {
                if (!this.executedScripts.has(oldScript.src)) {
                    newScript.src = oldScript.src;
                    this.executedScripts.add(oldScript.src);
                }
            } else {
                newScript.textContent = oldScript.textContent;
                this.executedScripts.add(oldScript.textContent);
            }

            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    clearExecutedScripts() {
        this.executedScripts.clear();
    }

    async preloadView(url) {
        const fullUrl = new URL(url, document.baseURI).href;
        const cacheKey = fullUrl;

        if (this.cache.has(cacheKey)) return;

        try {
            const response = await fetch(fullUrl, {
                method: "GET",
                headers: { "X-Requested-With": "XMLHttpRequest" },
                signal: AbortSignal.timeout(10000), // 10 seconds of waiting time
            });

            if (!response.ok) handleError(`Precarga de ${url} falló con el estado ${response.status}`);

            const html = await response.text();
            this.cache.set(cacheKey, { html });
            this.trimCache();
        } catch (err) {
            handleError("Error en la precarga:", err);
        }
    }    
}