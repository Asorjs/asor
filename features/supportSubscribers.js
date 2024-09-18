import { updateData } from "./supportDataStore.js";

const subscribers = new WeakMap();
const updateQueue = new Set();
let isProcessing = false;

export function onDataChange(el, callback) {
    if (!subscribers.has(el)) subscribers.set(el, new Set());

    subscribers.get(el).add(callback);
    return () => {
        const subs = subscribers.get(el);
        if (subs) {
            subs.delete(callback);
            if (subs.size === 0) subscribers.delete(el);
        }
    };
}

export function queueUpdate(el) {
    updateQueue.add(el);
    scheduleUpdate();
}

function scheduleUpdate() {
    if (!isProcessing) {
        isProcessing = true;
        queueMicrotask(() => flushUpdates());  
        isProcessing = false;
    }
}

function flushUpdates() {
    updateQueue.forEach(el => {
        updateData(el);
        const subs = subscribers.get(el);
        if (subs) subs.forEach(callback => callback());
    });

    updateQueue.clear();
    isProcessing = false;
}