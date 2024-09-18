import { handleError } from "../utils/logger.js";
import { DATA_ATTRIBUTE_PREFIX, updateData2 } from "./supportDataStore.js";
import { requestIdleCallback } from "../utils/idle-callback.js";
import { isFunction } from "../utils/types.js";

const MUTATION_TYPES = { CHILD_LIST: 'childList', ATTRIBUTES: 'attributes' };
const callbacks = { elementAdded: new Set(), elementRemoved: new Set(), attributeChanged: new Set() };
let observer = null, isObserving = false, isBatchProcessing = false;

class MutationBatch {
    constructor() {
        this.addedNodes = new Set();
        this.removedNodes = new Set();
        this.changedAttributes = new Map();
    }

    add(mutation) {
        if (mutation.type === MUTATION_TYPES.CHILD_LIST) {
            mutation.addedNodes.forEach(node => node.nodeType === Node.ELEMENT_NODE && this.addedNodes.add(node));
            mutation.removedNodes.forEach(node => node.nodeType === Node.ELEMENT_NODE && this.removedNodes.add(node));
        } else if (mutation.type === MUTATION_TYPES.ATTRIBUTES && mutation.attributeName.startsWith(DATA_ATTRIBUTE_PREFIX)) {
            const newValue = mutation.target.getAttribute(mutation.attributeName);
            if (mutation.oldValue !== newValue) {
                this.changedAttributes.set(mutation.target, { attributeName: mutation.attributeName, oldValue: mutation.oldValue, newValue });
            }
        }
    }

    process(deadline) {
        const processBatch = (set, callback) => {
            for (const value of set) {
                if (deadline.timeRemaining() <= 0 && !deadline.didTimeout) return false;
                callback(value);
                set.delete(value);
            }
            return true;
        };

        const processAttributes = () => {
            for (const [node, { attributeName, oldValue, newValue }] of this.changedAttributes) {
                if (deadline.timeRemaining() <= 0 && !deadline.didTimeout) return false;
                callbacks.attributeChanged.forEach(callback => safeCallback(callback, node, attributeName, oldValue, newValue));
                safeCallback(() => updateData2(node));
                this.changedAttributes.delete(node);
            }
            return true;
        };

        return processBatch(this.addedNodes, node => callbacks.elementAdded.forEach(callback => safeCallback(callback, node))) &&
               processBatch(this.removedNodes, node => callbacks.elementRemoved.forEach(callback => safeCallback(callback, node))) &&
               processAttributes();
    }

    isEmpty() { return this.addedNodes.size === 0 && this.removedNodes.size === 0 && this.changedAttributes.size === 0; }
}

const currentBatch = new MutationBatch();

const processBatch = () => {
    if (isBatchProcessing) return;
    isBatchProcessing = true;
    const processBatchStep = (deadline) => {
        if (!currentBatch.process(deadline)) requestIdleCallback(processBatchStep);
        else isBatchProcessing = false;
    };
    requestIdleCallback(processBatchStep);
};

const handleMutations = (mutations) => {
    mutations.forEach(mutation => currentBatch.add(mutation));
    if (!currentBatch.isEmpty()) processBatch();
};

const safeCallback = (callback, ...args) => {
    try { callback(...args); }
    catch (error) { handleError(`Error in mutation observer callback:`, callback.toString(), error); }
};

export const startObservingMutations = () => {
    if (isObserving || !document) return;
    if (!observer) observer = new MutationObserver(handleMutations);
    observer.observe(document, { subtree: true, childList: true, attributes: true, attributeOldValue: true });
    isObserving = true;
};

export const stopObserving = () => {
    if (isObserving) {
        observer.disconnect();
        isObserving = false;
    }
};

const createCallbackHandler = (type) => (callback) => {
    if (isFunction(callback)) {
        callbacks[type].add(callback);
        return () => callbacks[type].delete(callback);
    }
    handleError(`Invalid callback provided to on${type.charAt(0).toUpperCase() + type.slice(1)}`);
};

export const onElementAdded = createCallbackHandler('elementAdded');
export const onElementRemoved = createCallbackHandler('elementRemoved');
export const onAttributeChanged = createCallbackHandler('attributeChanged');

export const mutateDom = (callback) => {
    const wasObserving = isObserving;
    if (wasObserving) stopObserving();
    try { callback(); }
    finally { if (wasObserving) startObservingMutations(); }
};

export const resetInitializationState = () => {
    currentBatch.addedNodes.clear();
    currentBatch.removedNodes.clear();
    currentBatch.changedAttributes.clear();
    isBatchProcessing = false;
};

export const finishInitialization = processBatch;