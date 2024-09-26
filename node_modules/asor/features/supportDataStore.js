import { generateStateHash } from "../utils/dom.js";
import { handleError } from "../utils/logger.js";
import { isElement, isEqual, isObject } from "../utils/types.js";

const dataStore = new WeakMap();

export const DATA_ATTRIBUTE_PREFIX = 'data-a-';

const getDataAttribute = (el) => Array.from(el.attributes).find(attr => attr.name.startsWith(DATA_ATTRIBUTE_PREFIX))?.name || null;

export const setData = (el, data) => {
    if (!isElement(el)) {
        handleError("The element is not a valid HTML element", el);
        return null;
    }
    if (!isObject(data)) {
        handleError(`${data} must be a valid object`, el);
        return null;
    }
    if (!isEqual(dataStore.get(el), data)) {
        dataStore.set(el, data);
        el.__asor_def = data;
        setAttributeState(el);
    }
    return data;
};

export function getData(el) {
    while (el) {
        if (el.__asor_def) {
            return el.__asor_def;
        }
        el = el.parentElement;
    }
    return {};
}


export const delData = (el) => {
    dataStore.delete(el);
    const dataAttribute = getDataAttribute(el);
    if (dataAttribute) el.removeAttribute(dataAttribute);
    delete el.__asor_def;
}

export function updateData(target) {
    try {
        if (!dataStore.get(target)) return;
        setAttributeState(target);
    } catch (error) {
        handleError("Error updating data for element", target, error);
    }
}

export function updateData2(target) {
    try {      
        const storedData = dataStore.get(target);
        const currentData = target.__asor_def;
        
        if (ifStatusChanged(storedData, currentData)) dataStore.set(target, { ...currentData });
    } catch (error) {
        handleError("Error updating data for element", target, error);
    }
}

const ifStatusChanged = (oldState, currentState) => !isEqual(oldState, currentState);

function setAttributeState(target){
    try {
        const attributeUpdate = (() => {
            const newHash = generateStateHash();
            const current = getDataAttribute(target);
            if (current) target.removeAttribute(current);
            target.setAttribute(`${DATA_ATTRIBUTE_PREFIX}${newHash}`, "");
        });
           
       attributeUpdate()
    } catch (error) {
        handleError("Error serializing data for element", target, error);
    }
}