import { queueUpdate } from "./supportSubscribers";

const dataStore = new WeakMap();

export function setData(el, data) {
    dataStore.set(el, data);
    el.__asor_def = data;
}

export function getData(el) {
    while (el) {
        if (el.__asor_def) return el.__asor_def;
        el = el.parentElement;
    }
    return {};
}

export const delData = (el) => {
    dataStore.delete(el);
    delete el.__asor_def;
}

export function updateData(el, newData) {
    const data = getData(el);
    if (data) {
        Object.assign(data, newData);
        queueUpdate(el)
    }
}