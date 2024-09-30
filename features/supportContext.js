import { getData } from "./supportDataStore.js";
import { findDefElement, generateUniqueId } from "../utils/dom.js";
import { dispatch } from "../utils/events.js";
import { getStore } from "./supportStore.js";

const SAFE_FUNCTIONS = {
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURIComponent,
    decodeURIComponent,
    encodeURI,
    decodeURI
};

export const DEFAULT_CONTEXT_KEYS = ['$el', '$event', '$data', '$refs', '$root', '$dispatch', '$persist', '$store', '$id'];

export function prepareContext(el, context = {}) {
    const root = findDefElement(el);
    const data = getData(el) || getData(root) || {};
    const refs = root._asor_refs || {};

    const specialContext = {
        $el: el,
        $event: context.$event || {},
        $refs: refs,
        $root: {
            ...root,
            dataset: root ? { ...root.dataset } : {}
        },
        $dispatch: (eventName, detail) => dispatch(el, eventName, detail),
        $persist: (value) => ({ __isPersist: true, initialValue: value }),
        $store: getStore(),
        $id: (key) => (el._asor_id) ? el._asor_id : `${key}-${generateUniqueId(36, key)}`  
    };

    return {
        ...specialContext,
        $data: new Proxy(data, {
            get(target, prop) {
                if (prop in target) return target[prop];
                if (prop in specialContext) return specialContext[prop];
                if (prop in context) return context[prop];
                if (prop in SAFE_FUNCTIONS) return SAFE_FUNCTIONS[prop];
                return undefined;
            }
        }),
        ...SAFE_FUNCTIONS,
        ...context
    };
}

export const getContextKeys = () => [ ...DEFAULT_CONTEXT_KEYS, ...Object.keys(SAFE_FUNCTIONS) ];
export const extendContexts = (newContext) => Object.assign(SAFE_FUNCTIONS, newContext);
export const createContexts = (el, additionalContext = {}) => prepareContext(el, additionalContext);