const events = new Map();

export const listen = (target, eventName, handler, options = {}) => {
    let pooledHandlers = events.get(eventName);
    if (!pooledHandlers) {
        pooledHandlers = new Set();
        events.set(eventName, pooledHandlers);
    }
    pooledHandlers.add(handler);

    const abortController = new AbortController();
    target.addEventListener(eventName, handler, { ...options, signal: abortController.signal });

    return () => {
        abortController.abort();
        pooledHandlers.delete(handler);
        if (pooledHandlers.size === 0) events.delete(eventName);
    };
};

export const dispatch = (target, name, detail, options = {}) => {
    const event = new CustomEvent(name, {
        bubbles: true,
        cancelable: true,
        ...options,
        detail
    });
    event.__asor = { name, detail, receivedBy: [] };
    return target.dispatchEvent(event);
};

export const on = (eventName, callback) => listen(window, eventName, e => e.__asor && callback(e));

export const dispatchGlobal = (name, detail) => dispatch(window, name, detail);
export const dispatchSelf = (target, name, detail) => dispatch(target, name, detail, { bubbles: false });

export const clearAllListeners = () => {
    events.forEach(pooled => pooled.clear());
    events.clear();
};