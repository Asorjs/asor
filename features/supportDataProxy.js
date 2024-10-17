import { queueUpdate } from "./supportSubscribers";
import { isFunction, isObject } from "../utils/types";
import { getData } from "./supportDataStore";
import { getPersistentValue, setPersistentValue } from "./supportDataPersist";

const proxyCache = new WeakMap();

export function createDataProxy(data, el) {
    if (!data || !isObject(data)) data = {};
    if (proxyCache.has(data)) return proxyCache.get(data);

    const processedData = processData(data, el);
    const proxy = new Proxy(processedData, createProxyHandler(el));
    
    proxyCache.set(data, proxy);
    return proxy;
}

function createProxyHandler(el) {
    return {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver);

            if (value && value.__isPersist) return value.value; // Handling persistent properties
            if (isFunction(value) && !key.startsWith('__')) return handleFunction(value, el, receiver); // Function management
            
            return value;
        },
        set(target, key, value, receiver) {
            if (handlePersistentProperty(target, key, value, el)) return true;

            const oldValue = target[key];
            Reflect.set(target, key, value, receiver);
            if (oldValue !== value) queueUpdate(el);

            return true;
        }
    };
}

function handleFunction(func, el, proxy) {
    return function(...args) {
        const result = func.apply(proxy, args);
        queueUpdate(el);
        return result;
    };
}

function handlePersistentProperty(target, key, value, el) {
    if (target[key] && target[key].__isPersist) {
        const oldValue = target[key].value;
        target[key].value = value;
        setPersistentValue(key, value);

        if (oldValue !== value) queueUpdate(el);
        return true;
    }
    return false;
}

function processData(data, el) {
    const processedData = {};

    handleComputedProperties(data, processedData);
    handleEntries(data, processedData, el);

    return processedData;
}

function handleComputedProperties(data, processedData) {
    Object.keys(data).forEach((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(data, key);
        if (descriptor && typeof descriptor.get === "function") {
            Object.defineProperty(processedData, key, {
                get: descriptor.get.bind(processedData),
                enumerable: true,
                configurable: true
            });
        }
    });
}

function handleEntries(data, processedData, el) {
    Object.entries(data).forEach(([key, value]) => {
        if (value && value.__isPersist) {
            processedData[key] = initializePersistentProperty(key, value);
        } else if (isObject(value)) {
            processedData[key] = createDataProxy(value, el); // Recursion to handle nested objects
        } else if (isFunction(value)) {
            processedData[key] = value;
        } else if (!processedData[key]) {
            processedData[key] = value;
        }
    });
}

function initializePersistentProperty(key, value) {
    let persistentValue = getPersistentValue(key, value.initialValue);
    if (persistentValue === null || persistentValue === undefined) {
        persistentValue = value.initialValue;
    }
    setPersistentValue(key, persistentValue);
    return { __isPersist: true, value: persistentValue };
}

export function cleanupDataProxy(el) {
    const data = getData(el);
    if (data && proxyCache.has(data)) proxyCache.delete(data);
}