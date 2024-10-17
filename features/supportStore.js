import { handleError } from "../utils/logger";
import { updateData } from "./supportDataStore";

let store = {};

export function createStore(initialState = {}) {
    store = new Proxy(initialState, {
        get(target, prop) {
            if (typeof target[prop] === "object" && target[prop] !== null)
                return new Proxy(target[prop], this);

            return target[prop];
        },
        set(target, prop, value) {
            target[prop] = value;
            triggerUpdate();
            return true;
        },
    });
  return store;
}

function triggerUpdate() {
    document.querySelectorAll("[a-def]").forEach((el) => {
        try {
            if (el && el.__asor_def) {
                el.__asor_def.$store = { ...store };
                updateData(el);
            }
        } catch (error) {
            handleError("Error updating element after store change:", error, el);
        }
    });
}

export const getStore = () => store;

export function updateStore(key, value) {
    if (typeof value === "object" && value !== null) {
        store[key] = { ...store[key], ...value };
    } else {
        store[key] = value;
    }

    triggerUpdate();
}

export const handleStore = (key, value) => {
    return value === undefined ? getStore()[key] : updateStore(key, value);
};
    
createStore();