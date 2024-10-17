import { warn } from "../utils/logger";
import { handleError } from "../utils/logger";
import { generateUniqueId } from "../utils/dom";
export const STORAGE_PREFIX = "asor_persist_";

export function $persist(initialValue) {
    const uniqueId = generateUniqueId(36, STORAGE_PREFIX);
    setPersistentValue()
    return {
        __isPersist: true,
        initialValue,
        uniqueId,
    };
}

export function getPersistentValue(key, defaultValue) {
    const storageKey = key.uniqueId || STORAGE_PREFIX + key;
    const storedValue = localStorage.getItem(storageKey);

    if (storedValue === null) return defaultValue;
    try {
        return JSON.parse(storedValue);
    } catch (e) {
        warn(`Error parsing stored value for key ${key}:`, e);
        return defaultValue;
    }
}

export function setPersistentValue(key, value) {
    const storageKey = key.uniqueId || STORAGE_PREFIX + key;
    try {
        localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (e) {
        handleError(`Error storing value for key ${key}:`, e);
    }
}
