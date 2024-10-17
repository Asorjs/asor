import { updateData } from "./supportDataStore";

const subscribers = new WeakMap();
const updateQueue = new Set();
let isProcessing = false;

export function onDataChange(el, callback) {
    if (!subscribers.has(el)) subscribers.set(el, []);
    
    subscribers.get(el).push(callback);

    return () => {
        const callbacks = subscribers.get(el);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) callbacks.splice(index, 1);
           
            if (callbacks.length === 0) subscribers.delete(el);
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