(() => {
  // utils/types.js
  var isObject = (subject) => subject !== null && typeof subject === "object" && !Array.isArray(subject);
  var isFunction = (subject) => typeof subject === "function";
  var isArray = (subject) => Array.isArray(subject);
  var isString = (subject) => typeof subject === "string";
  var isNumber = (subject) => typeof subject === "number";
  var isUndefined = (subject) => subject === void 0;

  // utils/logger.js
  function warn(message, context = {}, ...args) {
    logMessage("Warning", message, context, ...args);
  }
  function handleError(error, context = {}) {
    const message = typeof error === "string" ? error : error.message || "Unknown error";
    const details = { message, ...context };
    setTimeout(() => logMessage("Error", message, details), 0);
  }
  function safeCall2(fn, options = {}, ...args) {
    const { el, expression, message = "", defaultValue = null, rethrow = false, onError } = options;
    try {
      return fn(...args);
    } catch (error) {
      const fullMessage = `${message}
${error.message}`;
      handleError(fullMessage, { el, expression });
      if (onError && isFunction(onError)) onError(error, { el, expression, message });
      if (rethrow) throw error;
      return defaultValue;
    }
  }
  function logMessage(type, message, context = {}, ...args) {
    const { el, expression, component } = context;
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const details = { message, el, expression, component, timestamp, additionalInfo: args };
    const color = type.toLowerCase() === "error" ? "#FF0000" : "#FFA500";
    console.groupCollapsed(`%c[Asor ${type}]: ${message}`, `color: ${color}; font-weight: bold;`);
    console.log(details);
    console.groupCollapsed("Stack Trace");
    console.trace();
    console.groupEnd();
  }

  // utils/events.js
  var events = /* @__PURE__ */ new Map();
  var listen = (target, eventName, handler, options = {}) => {
    let pooledHandlers = events.get(eventName);
    if (!pooledHandlers) {
      pooledHandlers = /* @__PURE__ */ new Set();
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
  var dispatch = (target, name, detail, options = {}) => {
    const event = new CustomEvent(name, {
      bubbles: true,
      cancelable: true,
      ...options,
      detail
    });
    event.__asor = { name, detail, receivedBy: [] };
    return target.dispatchEvent(event);
  };
  var on = (eventName, callback) => listen(window, eventName, (e) => e.__asor && callback(e));
  var dispatchGlobal = (name, detail) => dispatch(window, name, detail);
  var dispatchSelf = (target, name, detail) => dispatch(target, name, detail, { bubbles: false });
  var clearAllListeners = () => {
    events.forEach((pooled) => pooled.clear());
    events.clear();
  };

  // features/supportSubscribers.js
  var subscribers = /* @__PURE__ */ new WeakMap();
  var updateQueue = /* @__PURE__ */ new Set();
  var isProcessing = false;
  function onDataChange(el, callback) {
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
  function queueUpdate(el) {
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
    updateQueue.forEach((el) => {
      updateData(el);
      const subs = subscribers.get(el);
      if (subs) subs.forEach((callback) => callback());
    });
    updateQueue.clear();
    isProcessing = false;
  }

  // features/supportDataStore.js
  var dataStore = /* @__PURE__ */ new WeakMap();
  function setData(el, data) {
    dataStore.set(el, data);
    el.__asor_def = data;
  }
  function getData(el) {
    while (el) {
      if (el.__asor_def) return el.__asor_def;
      el = el.parentElement;
    }
    return {};
  }
  var delData = (el) => {
    dataStore.delete(el);
    delete el.__asor_def;
  };
  function updateData(el, newData) {
    const data = getData(el);
    if (data) {
      Object.assign(data, newData);
      queueUpdate(el);
    }
  }

  // utils/dom.js
  var findAncestor = (el, condition) => {
    while (el && el !== document.body) {
      if (condition(el)) return el;
      el = el.parentElement;
    }
    return null;
  };
  var getMetaContent = (name) => document.querySelector(`meta[name='${name}']`)?.getAttribute("content") || "";
  var findDefElement = (el) => findAncestor(el, (ele) => ele.hasAttribute("a-def")) || document.body;
  var findRootElement = (el) => findAncestor(el, (ele) => ele.dataset && Object.keys(ele.dataset).length > 0 || ele.hasAttribute("a-def")) || document.body;
  var isForm = (el) => el.tagName === "FORM";
  var getStyle = (target, prop) => window.getComputedStyle(target).getPropertyValue(prop);
  var generateUniqueId = (prefix = "asor-", length = 8) => `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 2 + length)}`;
  function findElementsWithAsorDirectives(root = document.body, prefixes = ["a-", "@", ":"]) {
    const elements = [];
    const iterator = document.createNodeIterator(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => Array.from(node.attributes).some((attr) => prefixes.some((prefix) => attr.name.startsWith(prefix))) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
      }
    );
    let currentNode;
    while (currentNode = iterator.nextNode())
      elements.push(currentNode);
    return elements;
  }

  // directives.js
  var directiveCache = /* @__PURE__ */ new WeakMap();
  var directiveHandlers = /* @__PURE__ */ new Map();
  var cacheRagex = /* @__PURE__ */ new Map();
  function getDirectiveRegex(prefixes) {
    const key = prefixes.join("|");
    if (!cacheRagex.has(key)) cacheRagex.set(key, new RegExp(`^(?:${key})([^\\s.:]+)(?:\\.[^\\s.:]+)*(?::[^\\s]+)?\\s*`));
    return cacheRagex.get(key);
  }
  var normalizeDirectiveName = (name) => {
    if (!name) throw new Error("Directive name is required");
    if (name.startsWith(":")) return `a-bind:${name.slice(1)}`;
    if (name.startsWith("@")) return `a-on:${name.slice(1)}`;
    return name.startsWith("a-") ? name : `a-${name}`;
  };
  var directive = (name, handler) => directiveHandlers.set(name, handler);
  var mount = (root = document.body) => findElementsWithAsorDirectives(root).forEach(initDirectives);
  function initDirectives(el) {
    if (!el) return handleError(`Undefined element: ${el}`);
    const manager = getDirectives(el);
    manager.directives.sort((a, b) => directiveOrderMap.get(a.name) - directiveOrderMap.get(b.name)).forEach((directive2) => {
      const handler = directiveHandlers.get(directive2.name);
      if (handler) handler({ el, directive: directive2, manager });
    });
  }
  var ifElementHasAnyDirective = (el) => {
    return Array.from(el.attributes).some(
      (attr) => attr.name.startsWith(":") || attr.name.startsWith("@") || attr.name.startsWith("a-")
    );
  };
  var getDirectives = (el) => {
    let manager = directiveCache.get(el);
    if (!manager) {
      const directives = extractDirectives(el);
      manager = {
        el,
        directives,
        hasDirective: (name) => directives.some((d) => d.name === name),
        getDirective: (name) => directives.find((d) => d.name === name),
        delDirective: (name) => manager.directives = manager.directives.filter((d) => d.name !== name)
      };
      directiveCache.set(el, manager);
    }
    return manager;
  };
  var directiveOrder = [
    "ref",
    "def",
    "id",
    "bind",
    "init",
    "confirm",
    "xhr",
    "on",
    "effect",
    "show",
    "navigate",
    "transition",
    "for",
    "if",
    "loading",
    "offline",
    "stream"
  ];
  var directiveOrderMap = new Map(directiveOrder.map((d, i) => [d, i]));
  var getDirectiveValue2 = (el, directiveName) => {
    const directive2 = getDirectives(el).getDirective(directiveName);
    return directive2 ? { ...directive2, name: directiveName } : null;
  };
  var extractDirectives = (el) => {
    if (!el?.attributes) {
      handleError("Invalid element in extractDirectives");
      return [];
    }
    const regex = getDirectiveRegex(["a-", "@", ":"]);
    return Array.from(el.attributes).filter((attr) => regex.test(attr.name)).map(({ name, value }) => createDirectiveObject(el, name, value));
  };
  var createDirectiveObject = (el, name, expression) => {
    const normalizedName = normalizeDirectiveName(name);
    const { directiveName, directiveValue } = parseDirectiveName(normalizedName);
    const modifiers = parseModifiers(name);
    return {
      el,
      name: directiveName,
      fullName: normalizedName,
      expression,
      value: directiveValue,
      modifiers,
      hasModifier: (modName) => modifiers.has(modName),
      getModifierValue: (modName) => modifiers.get(modName),
      getAllModifiers: () => Array.from(modifiers, ([name2, value]) => ({ name: name2, value })),
      hasModifiers: () => modifiers.size > 0,
      firstModifier: () => {
        const [name2, value] = modifiers.entries().next().value || [];
        return name2 ? { name: name2, value } : null;
      }
    };
  };
  var parseDirectiveName = (normalizedName) => {
    const regex = /^a-(?:(on):)?([^:.]+)(?::([^.]+))?/;
    const [, onPrefix, name, value] = normalizedName.match(regex) || [];
    return {
      directiveName: onPrefix || name,
      directiveValue: onPrefix ? name : value
    };
  };
  var parseModifiers = (name) => {
    const modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];
    return new Map(modifiers.map((mod) => {
      const [key, val] = mod.slice(1).split("-");
      return [key, val === void 0 ? true : val];
    }));
  };
  async function reinitializeDirectives(newDOM, oldDOM) {
    const newElements = findElementsWithAsorDirectives(newDOM);
    const oldElements = findElementsWithAsorDirectives(oldDOM);
    newElements.forEach((newEl) => {
      const oldEl = oldElements.find((el) => el.isEqualNode(newEl));
      if (!oldEl || !areDirectivesEqual(newEl, oldEl))
        initDirectives(newEl);
      else {
        const oldData = getData(oldEl);
        if (oldData) setData(newEl, oldData);
      }
    });
  }
  function areDirectivesEqual(el1, el2) {
    const directives1 = getDirectives(el1);
    const directives2 = getDirectives(el2);
    if (directives1.directives.length !== directives2.directives.length) return false;
    return directives1.directives.every((dir1, index) => {
      const dir2 = directives2.directives[index];
      return dir1.name === dir2.name && dir1.expression === dir2.expression;
    });
  }

  // features/supportStore.js
  var store = {};
  function createStore(initialState = {}) {
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
      }
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
  var getStore = () => store;
  function updateStore(key, value) {
    if (typeof value === "object" && value !== null) {
      store[key] = { ...store[key], ...value };
    } else {
      store[key] = value;
    }
    triggerUpdate();
  }
  var handleStore = (key, value) => {
    return value === void 0 ? getStore()[key] : updateStore(key, value);
  };
  createStore();

  // features/supportContext.js
  var SAFE_FUNCTIONS = {
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURIComponent,
    decodeURIComponent,
    encodeURI,
    decodeURI
  };
  function prepareContext(el, context = {}) {
    const root = findDefElement(el);
    const data = getData(el) || getData(root) || {};
    const refs = root._asor_refs || {};
    const specialContext = {
      $el: el,
      $event: context.$event || {},
      $refs: refs,
      $root: { ...root, dataset: root ? { ...root.dataset } : {} },
      $dispatch: (eventName, detail) => dispatch(el, eventName, detail),
      $persist: (value) => ({ __isPersist: true, initialValue: value }),
      $store: getStore(),
      $id: (key) => {
        const ids = el._asor_ids || (el._asor_ids = {});
        return ids[key] || (ids[key] = generateUniqueId(key));
      }
    };
    return {
      ...specialContext,
      $data: new Proxy(data, {
        get(target, prop) {
          if (prop in target) return target[prop];
          if (prop in specialContext) return specialContext[prop];
          if (prop in context) return context[prop];
          if (prop in SAFE_FUNCTIONS) return SAFE_FUNCTIONS[prop];
          return void 0;
        }
      }),
      ...SAFE_FUNCTIONS,
      ...context
    };
  }

  // features/supportComponents.js
  var components = /* @__PURE__ */ new Map();
  function registerComponent(name, componentFunction) {
    if (typeof componentFunction !== "function") {
      handleError(`Component "${name}" must be a function.`);
      return;
    }
    components.set(name, componentFunction);
  }
  function getComponent(name) {
    return components.get(name);
  }
  function hasComponent(name) {
    return components.has(name);
  }
  function getComponents() {
    return components.get();
  }
  var executeComponentFunction = (expression, el) => {
    const componentFunction = getComponent(expression);
    try {
      const context = prepareContext(el, {});
      return componentFunction(context);
    } catch (error) {
      handleError(`Error executing component: ${error.message}`, {
        el,
        expression
      });
      return null;
    }
  };

  // root.js
  var initialized = false;
  function start(forceInit = false) {
    if (initialized && !forceInit) {
      warn("Asor is already initialized. Skipping re-initialization.");
      return;
    }
    stop();
    const initialize = () => {
      dispatch(document, "asor:init");
      dispatch(document, "asor:initializing");
      requestAnimationFrame(() => {
        mount();
        initialized = true;
        dispatch(document, "asor:initialized");
      });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
    else initialize();
  }
  function stop(callback = null) {
    if (!initialized) return;
    const mountedComponents = getComponents();
    mountedComponents.forEach((componentInstance, el) => {
      if (componentInstance && isFunction(componentInstance.destroy)) {
        safeCall(() => componentInstance.destroy(), {
          el,
          expression: "destroy()",
          message: `Error executing destroy() for component.`
        });
      }
    });
    mountedComponents.clear();
    clearAllListeners();
    if (window.asor) delete window.asor;
    if (callback && isFunction(callback)) callback();
    dispatch(document, "asor:stopped");
    initialized = false;
  }

  // features/supportEvaluateExpression.js
  var expressionCache = /* @__PURE__ */ new Map();
  var MAX_CACHE_SIZE = 500;
  var createErrorOptions = (el, expression) => ({
    el,
    expression,
    rethrow: false,
    defaultValue: null,
    message: `Error evaluating expression: "${expression}"`
  });
  var createExpressionBody = (expression) => `
    with (__context) {
        with ($data) {
            return (${expression});
        }
    }
`;
  var wrapWithErrorHandling = (body) => `
    try {
        ${body}
    } catch (e) {
        if (e instanceof ReferenceError) return undefined;
        throw e;
    }
`;
  var buildFunction = (expression) => {
    const body = createExpressionBody(expression);
    const wrappedBody = wrapWithErrorHandling(body);
    return new Function("__context", wrappedBody);
  };
  var getCacheKey = (expression, context) => {
    const contextKeys = Object.keys(context).sort().join(",");
    return `${expression}::${contextKeys}`;
  };
  var addToCache = (key, value) => {
    if (expressionCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = expressionCache.keys().next().value;
      expressionCache.delete(oldestKey);
    }
    expressionCache.set(key, value);
  };
  function evaluateExpression(el, expression, context) {
    const errorOptions = createErrorOptions(el, expression);
    if (isFunction(expression)) return safeCall2(expression, errorOptions, context);
    if (!isString(expression)) {
      handleError(`Invalid expression type: ${typeof expression}. Expected string or function.`, el, expression);
      return null;
    }
    const fullContext = prepareContext(el, context);
    const cacheKey = getCacheKey(expression, fullContext);
    let compiledFn = expressionCache.get(cacheKey);
    if (!compiledFn) {
      compiledFn = buildFunction(expression);
      addToCache(cacheKey, compiledFn);
    }
    return safeCall2(() => compiledFn(fullContext), errorOptions);
  }
  var evaluateInContext = (el, expression, additionalContext = {}) => evaluateExpression(el, expression, additionalContext);

  // utils/debounce.js
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // utils/throttle.js
  function throttle(fn, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // features/supportSwapMethod.js
  function getSwapDirective(el) {
    return getDirectiveValue2(el, "swap")?.expression || "innerHTML";
  }
  var swapFunctions = {
    innerHTML: (el, content) => {
      el.innerHTML = content;
    },
    outerHTML: (el, content) => {
      el.outerHTML = content;
    },
    beforebegin: (el, content) => {
      el.insertAdjacentHTML("beforebegin", content);
    },
    afterbegin: (el, content) => {
      el.insertAdjacentHTML("afterbegin", content);
    },
    beforeend: (el, content) => {
      el.insertAdjacentHTML("beforeend", content);
    },
    afterend: (el, content) => {
      el.insertAdjacentHTML("afterend", content);
    },
    replace: (el, content) => {
      el.replaceWith(...createNodesFromHTML(content));
    },
    append: (el, content) => {
      el.append(...createNodesFromHTML(content));
    },
    prepend: (el, content) => {
      el.prepend(...createNodesFromHTML(content));
    }
  };
  function applySwapMethod(el, content, swapMethod) {
    try {
      const swapFunction = swapFunctions[swapMethod] || swapFunctions.innerHTML;
      swapFunction(el, content);
    } catch (error) {
      handleError(`Error applying swap method "${swapMethod}":`, error);
    }
  }
  var createNodesFromHTML = (content) => {
    const temp = document.createElement("div");
    temp.innerHTML = content;
    return temp.childNodes;
  };

  // features/supportTargets.js
  var targetCache = /* @__PURE__ */ new WeakMap();
  function getTargetDirective(el) {
    if (targetCache.has(el)) return targetCache.get(el);
    const target = getDirectiveValue2(el, "target");
    if (target) {
      const selector = target.expression?.trim();
      if (selector) {
        const element = document.querySelector(selector);
        if (element) {
          targetCache.set(el, element);
          return element;
        }
        warn(`Target element "${selector}" not found. Using original element.`);
      }
    }
    targetCache.set(el, el);
    return el;
  }
  function removeTargetDirectiveIfNecessary(el) {
    const target = getDirectiveValue2(el, "target");
    if (target?.modifiers.includes("once")) {
      el.removeAttribute(target.directive);
      targetCache.delete(el);
    }
  }

  // features/supportUpdateDom.js
  var updateQueue2 = /* @__PURE__ */ new Set();
  var isUpdating = false;
  async function updateDOM(element, responseHTML) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(responseHTML, "text/html");
    const target = getTargetDirective(element);
    const swapMethod = getSwapDirective(target);
    const newContent = doc.body.innerHTML;
    const oldDOM = target.cloneNode(true);
    queueDomUpdate(target, () => {
      applySwapMethod(target, newContent, swapMethod);
      updateDirectivesAndState(oldDOM, target);
      applyTransition(target);
      removeTargetDirectiveIfNecessary(target);
    });
  }
  function updateDirectivesAndState(oldDOM, newDOM) {
    const oldElements = findElementsWithAsorDirectives(oldDOM);
    const newElements = findElementsWithAsorDirectives(newDOM);
    newElements.forEach((newEl) => {
      const oldEl = oldElements.find((el) => el.isEqualNode(newEl));
      if (oldEl) {
        const oldData = getData(oldEl);
        if (oldData) setData(newEl, oldData);
      }
    });
    reinitializeDirectives(newDOM, oldDOM);
    oldElements.forEach((oldEl) => {
      if (!newElements.some((newEl) => newEl.isEqualNode(oldEl))) cleanupElement(oldEl);
    });
  }
  function cleanupElement(el) {
    const data = getData(el);
    if (data && data.$refs) {
      Object.keys(data.$refs).forEach((refName) => {
        if (data.$refs[refName] === el) delete data.$refs[refName];
      });
    }
    delData(el);
    Array.from(el.children).forEach(cleanupElement);
  }
  function applyTransition(el) {
    const transition = getDirectiveValue2(el, "transition");
    if (!transition) return;
    dispatch(el, "asor:transition", { visible: true });
  }
  function queueDomUpdate(el, updateFn) {
    updateQueue2.add({ el, updateFn });
    scheduleUpdate2();
  }
  function scheduleUpdate2() {
    if (!isUpdating) {
      isUpdating = true;
      requestAnimationFrame(flushDomUpdates);
    }
  }
  function flushDomUpdates() {
    for (const { el, updateFn } of updateQueue2) {
      updateFn(el);
    }
    updateQueue2.clear();
    isUpdating = false;
  }

  // directives/a-ref.js
  directive("ref", ({ el, directive: directive2 }) => {
    const refName = directive2.expression;
    if (!refName) return;
    const root = findRootElement(el);
    if (!root._asor_refs) root._asor_refs = {};
    root._asor_refs[refName] = el;
    if (root !== document.documentElement) {
      const rootData2 = getData(root) || {};
      rootData2.$refs = root._asor_refs;
      setData(root, rootData2);
    }
    return () => cleanup(rootData);
  });
  function cleanup(root) {
    const refName = getDirectiveValue(root, "ref")?.expression;
    if (refName) {
      delete root._asor_refs[refName];
      if (root !== document.documentElement) {
        const rootData2 = getData(root) || {};
        if (rootData2.$refs) {
          delete rootData2.$refs[refName];
          setData(root, rootData2);
        }
      }
    }
  }

  // features/supportDataPersist.js
  var STORAGE_PREFIX = "asor_persist_";
  function getPersistentValue(key, defaultValue) {
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
  function setPersistentValue(key, value) {
    const storageKey = key.uniqueId || STORAGE_PREFIX + key;
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (e) {
      handleError(`Error storing value for key ${key}:`, e);
    }
  }

  // features/supportDataProxy.js
  var proxyCache = /* @__PURE__ */ new WeakMap();
  function createDataProxy(data, el) {
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
        if (value && value.__isPersist) return value.value;
        if (isFunction(value) && !key.startsWith("__")) return handleFunction(value, el, receiver);
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
        processedData[key] = createDataProxy(value, el);
      } else if (isFunction(value)) {
        processedData[key] = value;
      } else if (!processedData[key]) {
        processedData[key] = value;
      }
    });
  }
  function initializePersistentProperty(key, value) {
    let persistentValue = getPersistentValue(key, value.initialValue);
    if (persistentValue === null || persistentValue === void 0) {
      persistentValue = value.initialValue;
    }
    setPersistentValue(key, persistentValue);
    return { __isPersist: true, value: persistentValue };
  }

  // utils/parse.js
  var parseDataAttribute = (dataAttr, el) => {
    if (isObject(dataAttr)) return dataAttr;
    if (!isString(dataAttr) || !dataAttr.trim()) return {};
    try {
      const result = evaluateExpression(el, `(${dataAttr})`, {});
      if (isObject(result)) return result;
      handleError(`Invalid data attribute: ${dataAttr}`, el, dataAttr);
    } catch (error) {
      handleError(`Error parsing data attribute: ${error.message}`, el, dataAttr);
      return {};
    }
  };
  function parseForExpression(expression) {
    const match = expression.match(/([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/);
    if (!match) return null;
    const [, itemExp, itemsExp] = match;
    const parts = itemExp.replace(/^\(|\)$/g, "").split(",").map((s) => s.trim());
    if (parts.length === 1) return { item: parts[0], items: itemsExp.trim() };
    else if (parts.length === 2) return { item: parts[0], key: parts[1], items: itemsExp.trim() };
    else if (parts.length === 3) return { item: parts[0], key: parts[1], index: parts[2], items: itemsExp.trim() };
    return null;
  }

  // directives/a-def.js
  directive("def", ({ el, directive: directive2 }) => {
    try {
      let expression = directive2.expression;
      expression = expression === "" ? "{}" : expression;
      let rawData = hasComponent(expression) ? executeComponentFunction(expression, el) : parseDataAttribute(expression, el);
      if (!rawData) {
        handleError(`Failed to obtain data for a-def directive with expression: ${expression}`, { el });
        return;
      }
      const proxyData = createDataProxy(rawData, el);
      proxyData.$store = getStore();
      setData(el, proxyData);
      updateData(el);
      const cleanup2 = onDataChange(el, () => updateData(el));
      return () => {
        cleanup2();
        delData(el);
        el.removeAttribute("a-def");
      };
    } catch (err) {
      handleError("Error in a-def directive:", err, el);
    }
  });

  // features/supportDataBinding.js
  var valueGetters = {
    text: (el) => el.textContent,
    html: (el) => el.innerHTML,
    value: (el) => el.value,
    checked: (el) => el.checked,
    selected: (el) => el.selected,
    class: (el) => el.className
  };
  var valueSetters = /* @__PURE__ */ new Map([
    ["text", (el, value) => el.textContent = value ?? ""],
    ["html", (el, value) => el.innerHTML = value ?? ""],
    ["value", (el, value) => {
      if (el.value !== value) el.value = value ?? "";
    }],
    ["checked", (el, value) => el.checked = !!value],
    ["disabled", (el, value) => el.disabled = !!value],
    ["readonly", (el, value) => el.readOnly = !!value],
    ["required", (el, value) => el.required = !!value],
    ["multiple", (el, value) => el.multiple = !!value],
    ["hidden", (el, value) => el.hidden = !!value],
    ["radio", (el, value) => el.checked = el.value == value],
    ["open", (el, value) => el.open = !!value],
    ["class", updateClasses],
    ["style", updateStyles],
    ["selected", updateSelectSelected],
    ["multipleSelect", updateMultipleSelect],
    ["contenteditable", (el, value) => {
      if (el.innerHTML !== value) el.innerHTML = value;
    }],
    ["number", (el, value) => {
      el.value = value === null || value === void 0 ? "" : Number(value);
    }]
  ]);
  function updateElement(el, bindType, value) {
    if (!el) return;
    const currentValue = getElementValue(el, bindType);
    if (Object.is(currentValue, value)) return;
    setElementValue(el, bindType, value);
  }
  function getElementValue(el, bindType) {
    return valueGetters[bindType]?.(el) ?? el.getAttribute(bindType);
  }
  function setElementValue(el, bindType, value) {
    (valueSetters.get(bindType) || ((el2, value2) => el2.setAttribute(bindType, value2 ?? "")))(el, value);
  }
  function updateClasses(el, value) {
    if (isString(value)) el.className = value;
    else if (isArray(value)) el.className = value.join(" ");
    else if (isObject(value)) {
      for (const [className, condition] of Object.entries(value)) {
        if (className.includes(" ")) {
          className.split(" ").forEach((singleClass) => {
            el.classList.toggle(singleClass.trim(), !!condition);
          });
        } else el.classList.toggle(className, !!condition);
      }
    }
  }
  function updateStyles(el, value) {
    if (isString(value))
      el.style.cssText = value;
    else if (isObject(value))
      Object.assign(el.style, value);
  }
  function handleTwoWayBindingInputUpdate(el, bindExpression, event) {
    const newValue = getTargetValue(el, event);
    const defElement = el.closest("[a-def]");
    if (!defElement) return;
    const data = getData(defElement);
    if (data) {
      updateData(defElement, { [bindExpression]: newValue });
    }
  }
  function getTargetValue(el, event) {
    if (el.tagName === "SELECT" && el.multiple)
      return Array.from(el.selectedOptions).map((option) => option.value);
    else if (el.type === "date" || el.type === "datetime-local")
      return el.valueAsDate;
    else if (el.type === "checkbox")
      return event.target.checked;
    else if (el.type === "file")
      return el.multiple ? Array.from(el.files) : el.files[0];
    else
      return event.target.value;
  }
  function updateSelectSelected(el, value) {
    const options = Array.from(el.options);
    if (isArray(value))
      options.forEach((option) => option.selected = value.includes(option.value));
    else {
      const toSelect = options.find((option) => option.value == value);
      if (toSelect) {
        toSelect.selected = true;
        el.value = toSelect.value;
      }
    }
  }
  function updateMultipleSelect(el, value) {
    if (!isArray(value)) value = [value];
    Array.from(el.options).forEach((option) => option.selected = value.includes(option.value));
  }
  function setupInputEvent(el, bindExpression) {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) {
      const eventType = el.type === "checkbox" || el.type === "radio" || el.type === "file" ? "change" : "input";
      return listen(el, eventType, (event) => handleTwoWayBindingInputUpdate(el, bindExpression, event));
    }
    return null;
  }

  // directives/a-bind.js
  directive("bind", ({ el, directive: directive2 }) => {
    const bindType = directive2.value || "text";
    const bindExpression = directive2.expression;
    if (!bindExpression) {
      handleError("La expresi\xF3n de binding est\xE1 vac\xEDa", null, el);
      return;
    }
    const dataOwner = findAncestor(el, (ele) => ele.__asor_def);
    if (!dataOwner) {
      handleError("No se encontr\xF3 un propietario de datos para la directiva a-bind", el);
      return;
    }
    let inputCleanup = null;
    const update = async () => {
      try {
        const data = getData(dataOwner);
        const value = await evaluateInContext(el, bindExpression, { data });
        if (isUndefined(value)) return;
        updateElement(el, bindType, value);
        if (inputCleanup) inputCleanup();
        inputCleanup = setupInputEvent(el, bindExpression);
      } catch (error) {
        handleError("Error al actualizar el binding:", error, el);
      }
    };
    update();
    const cleanupDataChange = onDataChange(dataOwner, () => update());
    return () => {
      cleanupDataChange();
      if (inputCleanup) inputCleanup();
    };
  });

  // directives/a-init.js
  directive("init", ({ el, directive: directive2 }) => {
    const expression = directive2.expression?.trim();
    if (!expression) return;
    const data = el.__asor_def || getData(el);
    if (!data) {
      handleError("No data found for a-init directive:", el);
      return;
    }
    const update = async () => await evaluateInContext(el, expression, { data, $el: el });
    update();
  });

  // directives/a-effect.js
  directive("effect", ({ el, directive: directive2 }) => {
    const expression = directive2.expression;
    const runEffect = async () => {
      const data = el.__asor_def || getData(el);
      if (!data) return;
      const effectResult = await evaluateInContext(el, expression, { data });
      if (isFunction(effectResult)) return await effectResult();
    };
    let cleanup2;
    const executeEffect = async () => {
      if (cleanup2) {
        cleanup2();
        cleanup2 = null;
      }
      const newCleanup = await runEffect();
      if (isFunction(newCleanup)) cleanup2 = newCleanup;
    };
    executeEffect();
    return onDataChange(el, executeEffect);
  });

  // directives/a-confirm.js
  directive("confirm", ({ el, directive: directive2 }) => {
    let message = directive2.expression;
    let shouldPrompt = directive2.hasModifier("prompt");
    message = message.replaceAll("\\n", "\n");
    if (message === "") message = "Are you sure?";
    const handle = (isConfirmed, action, instead) => {
      if (isConfirmed) action();
      else instead();
    };
    el.__confirm_action = (confirmAction, alternativeAction) => {
      if (shouldPrompt) {
        const [question, expected] = message.split("|");
        if (!expected) handleError("Directives: You must provide an expectation with @confirm.prompt.");
        const userInput = prompt(question);
        handle(userInput === expected, confirmAction, alternativeAction);
      } else handle(confirm(message), confirmAction, alternativeAction);
    };
  });

  // utils/modals.js
  function showHtmlModal(html) {
    let modal = document.getElementById("asor-error");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "asor-error";
      modal.style.cssText = `
            position: fixed;
            width: 100vw;
            height: 100vh;
            padding: 50px;
            background-color: rgba(0, 0, 0, 0.6);
            z-index: 200000;
        `;
      modal.addEventListener("click", () => hideHtmlModal(modal));
      modal.tabIndex = 0;
      document.body.prepend(modal);
      document.body.style.overflow = "hidden";
    }
    let iframe = document.createElement("iframe");
    iframe.style.cssText = `
        background-color: #17161A;
        border-radius: 5px;
        width: 100%;
        height: 100%;
    `;
    modal.innerHTML = "";
    modal.appendChild(iframe);
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();
    modal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hideHtmlModal(modal);
    });
    modal.focus();
  }
  function hideHtmlModal(modal) {
    modal.outerHTML = "";
    document.body.style.overflow = "visible";
  }

  // features/supportDataCollection.js
  function collectData(el) {
    return new DataCollection(el);
  }
  var DataCollection = class {
    constructor(el) {
      this.formData = new FormData();
      this.hasFile = false;
      this.errors = [];
      if (el.tagName === "FORM") this.serializeForm(el);
      else this.collectElementData(el);
      this.addDirectiveData(el);
    }
    collectElementData(el) {
      const handler = this.elementHandlers[el.tagName];
      if (handler) handler.call(this, el);
    }
    elementHandlers = {
      SELECT: this.handleSelect,
      TEXTAREA: this.handleTextArea,
      INPUT: this.handleInput,
      BUTTON: this.handleButton
    };
    handleSelect(select) {
      if (select.multiple)
        Array.from(select.selectedOptions).forEach((option) => {
          this.formData.append(select.name, option.value);
        });
      else this.formData.append(select.name, select.value);
    }
    handleTextArea(textarea) {
      this.formData.append(textarea.name, textarea.value);
    }
    handleInput(input) {
      const handlers = {
        checkbox: () => this.formData.append(input.name, input.checked),
        radio: () => {
          if (input.checked) this.formData.append(input.name, input.value);
        },
        file: () => {
          if (input.files.length > 0) {
            Array.from(input.files).forEach((file) => {
              this.formData.append(input.name, file);
            });
            this.hasFile = true;
          }
        },
        date: () => {
          const date = new Date(input.value);
          if (!isNaN(date.getTime())) this.formData.append(input.name, date.toISOString());
        },
        number: () => {
          const num = parseFloat(input.value);
          if (!isNaN(num)) this.formData.append(input.name, num);
        },
        default: () => this.formData.append(input.name, input.value)
      };
      (handlers[input.type] || handlers.default)();
    }
    handleButton(button) {
      if (button.name && (button.type === "submit" || button.type === "button"))
        this.formData.append(button.name, button.value || button.textContent);
    }
    addDirectiveData(el) {
      const dataDirective = getDirectiveValue2(el, "data");
      if (dataDirective)
        this.formData.append(dataDirective.value, dataDirective.expression);
      const addDirective = getDirectiveValue2(el, "add");
      if (addDirective)
        try {
          const addData = JSON.parse(addDirective.expression);
          Object.entries(addData).forEach(([key, value]) => {
            this.formData.append(key, value);
          });
        } catch (error) {
          handleError("Error parsing add directive:", error);
        }
    }
    serializeForm(form) {
      this.formData = new FormData(form);
      this.hasFile = Array.from(this.formData.values()).some((value) => value instanceof File);
    }
    toObject() {
      const obj = {};
      for (let [key, value] of this.formData.entries()) {
        if (obj[key]) {
          if (!Array.isArray(obj[key]))
            obj[key] = [obj[key]];
          obj[key].push(value);
        } else obj[key] = value;
      }
      return obj;
    }
    toJSON() {
      return JSON.stringify(this.toObject());
    }
    get() {
      return this.formData;
    }
    hasFiles() {
      return this.hasFile;
    }
    getErrors() {
      return this.errors;
    }
  };

  // request.js
  var cache = /* @__PURE__ */ new Map();
  var request = () => new Request();
  var Request = class {
    async handleRequest(el, method, url) {
      const options = this.buildRequestOptions(method, el);
      dispatch(document, "asor:before-request", { method, url, options });
      try {
        const response = await this.fetchData(method, url, options, el);
        if (!response) return;
        await this.handleResponse(response, el);
      } catch (error) {
        this.handlerError(error, el);
      } finally {
        dispatch(document, "asor:after-request", { method, url, options });
      }
    }
    buildRequestOptions(method, el) {
      const options = {
        method: method.toUpperCase(),
        headers: this.buildHeaders(el)
      };
      if (["POST", "PUT", "PATCH"].includes(options.method)) {
        const collectedData = collectData(el);
        options.body = this.prepareRequestBody(el, collectedData);
      }
      return options;
    }
    buildHeaders(el) {
      return {
        Accept: "text/html, application/xhtml+xml",
        "X-Requested-With": "XMLHttpRequest",
        "X-Current-URL": document.location.href,
        "X-Asor": "true",
        "Content-Type": this.getContentType(el)
      };
    }
    getContentType(el) {
      const collectedData = collectData(el);
      return isForm(el) || collectedData.hasFiles() ? void 0 : getDirectiveValue2(el, "enctype")?.expression || "application/json";
    }
    prepareRequestBody(el, collectedData) {
      return isForm(el) || collectedData.hasFiles() ? collectedData.get() : JSON.stringify(collectedData.toObject());
    }
    async fetchData(method, url, options, el) {
      dispatch(document, "asor:before-send", { method, url, options });
      dispatch(document, "asor:send", { method, url, options });
      const cacheKey = `${method}:${url}`;
      if (cache.has(cacheKey)) return cache.get(cacheKey);
      const response = await fetch(url, options);
      if (!response.ok) {
        this.handlerError(`HTTP error! status: ${response.status}`, el);
        return false;
      }
      const responseText = await response.text();
      cache.set(cacheKey, responseText);
      return responseText;
    }
    async handleResponse(responseText, el) {
      dispatch(document, "asor:before-render", { response: responseText });
      const targetEl = this.getTargetDirective(el);
      await updateDOM(targetEl, responseText);
      dispatch(document, "asor:render", { html: responseText });
    }
    getTargetDirective(el) {
      const targetSelector = getDirectiveValue2(el, "target")?.expression;
      return targetSelector ? document.querySelector(targetSelector) : el;
    }
    handlerError(error, el) {
      handleError("XHR request failed:", el, error);
      showHtmlModal(error.message);
    }
  };

  // utils/confirm.js
  async function ifConfirm(el) {
    const confirmDirective = getDirectiveValue2(el, "confirm");
    if (!confirmDirective?.expression) return true;
    return new Promise((resolve) => {
      if (isFunction(el.__confirm_action))
        el.__confirm_action(() => resolve(true), () => resolve(false));
      else
        resolve(true);
    });
  }

  // features/supportEvents.js
  var keyCodeMap = { enter: 13, tab: 9, delete: 46, esc: 27, space: 32, up: 38, down: 40, left: 37, right: 39, shift: 16, ctrl: 17, alt: 18, meta: 91 };
  var MODIFIER_KEYS = ["shift", "ctrl", "alt", "meta"];
  var HTTP_METHODS = ["get", "post", "put", "patch", "delete"];
  var handlerPool = /* @__PURE__ */ new WeakMap();
  var getRequestMethodFromDirective = (directive2) => HTTP_METHODS.includes(directive2.value?.toLowerCase()) ? directive2.value.toLowerCase() : "get";
  var EVENT_TYPE_MAP = {
    form: "submit",
    select: "change",
    textarea: "input",
    button: "click",
    input: {
      button: "click",
      submit: "click",
      reset: "click",
      checkbox: "change",
      radio: "change",
      file: "change",
      date: "change",
      time: "change",
      "datetime-local": "change"
    },
    default: "click"
  };
  function getDefaultEventType(el) {
    const tagName = el.tagName.toLowerCase();
    const type = (el.type || "").toLowerCase();
    if (tagName === "input") return EVENT_TYPE_MAP.input[type] || "input";
    return EVENT_TYPE_MAP[tagName] || (el.isContentEditable ? "input" : el.getAttribute("tabindex") !== null ? "focus" : EVENT_TYPE_MAP.default);
  }
  var createEventHandler = (el, handler, options = {}) => {
    const { preventDefault, stopPropagation, once, delay, throttleTime, passive, keyModifiers, self } = {
      preventDefault: false,
      stopPropagation: false,
      once: false,
      delay: 0,
      throttleTime: 0,
      passive: false,
      keyModifiers: [],
      self: false,
      ...options
    };
    const handlerKey = JSON.stringify({ preventDefault, stopPropagation, once, delay, throttleTime, passive, keyModifiers, self });
    if (!handlerPool.has(el)) handlerPool.set(el, /* @__PURE__ */ new Map());
    const elHandlers = handlerPool.get(el);
    if (!elHandlers.has(handlerKey)) {
      const pooledHandler = async (event) => {
        if (event.type === "intersect") return executeHandler(() => handler(event), delay, throttleTime);
        if (self && event.target !== el || isKeyEvent(event) && !checkKeyModifiers(event, keyModifiers)) return;
        if (preventDefault && !passive && isFunction(event.preventDefault)) event.preventDefault();
        if (stopPropagation && isFunction(event.stopPropagation)) event.stopPropagation();
        executeHandler(() => handleEvent(el, event, handler), delay, throttleTime);
        if (once) cleanupHandler(el, handlerKey);
      };
      elHandlers.set(handlerKey, pooledHandler);
    }
    return elHandlers.get(handlerKey);
  };
  var executeHandler = (handler, delay, throttleTime) => delay > 0 ? debounce(handler, delay)() : throttleTime > 0 ? throttle(handler, throttleTime)() : handler();
  var cleanupHandler = (el, handlerKey) => {
    const elHandlers = handlerPool.get(el);
    elHandlers.delete(handlerKey);
    if (elHandlers.size === 0) handlerPool.delete(el);
  };
  var handleEvent = async (el, event, handler) => {
    try {
      if (!await ifConfirm(el)) return;
      const result = isFunction(handler) ? await handler.call(el, event) : true;
      if (result !== false && el.__xhr_handler && !el.__xhr_request_in_progress)
        await el.__xhr_handler.call(el, event);
    } catch (err) {
      handleError("Error in event handler:", err, el);
    }
  };
  var isKeyEvent = (event) => event.type?.startsWith("key");
  var checkKeyModifiers = (event, keyModifiers) => keyModifiers.every((key) => MODIFIER_KEYS.includes(key) ? event[`${key}Key`] : event.keyCode === keyCodeMap[key]);
  var setupIntersectionObserver = (el, callback, options = {}) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          try {
            callback(entry, el);
            if (options.once) observer.unobserve(el);
            if (options.disconnect) observer.disconnect();
          } catch (err) {
            handleError("Error in IntersectionObserver callback:", err);
          }
        }
      });
    }, options);
    observer.observe(el);
    return () => observer.disconnect();
  };
  var setupOutsideEvent = (el, eventName, handler, options = {}) => listen(document, eventName, (event) => {
    if (!el.contains(event.target)) handler(event);
  }, options);
  var setupIntersectObserver = (el, handler, options) => {
    const { rootMargin = "0px", threshold = 0.1, once } = options;
    const callback = (entry, element) => {
      const event = { type: "intersect", detail: { entry, element }, target: element };
      if (dispatch(element, "intersect", event.detail)) handler.call(element, event);
    };
    return setupIntersectionObserver(el, callback, { rootMargin, threshold, once, disconnect: once });
  };

  // directives/a-xhr.js
  directive("xhr", ({ el, directive: directive2, manager }) => {
    const url = directive2.expression;
    const method = getRequestMethodFromDirective(directive2);
    const defaultEvent = getDefaultEventType(el);
    const xhrHandler = async () => {
      if (el.__xhr_request_in_progress) return;
      el.__xhr_request_in_progress = true;
      try {
        await request().handleRequest(el, method, url);
      } catch (err) {
        handleError("XHR request failed:", err);
      } finally {
        el.__xhr_request_in_progress = false;
      }
    };
    let cleanup2 = () => {
    };
    if (!manager.hasDirective("on")) {
      const eventHandler = createEventHandler(el, xhrHandler, {
        preventDefault: true,
        stopPropagation: true
      });
      cleanup2 = listen(el, defaultEvent, eventHandler);
    } else {
      el.__xhr_handler = xhrHandler;
    }
    return () => {
      cleanup2();
      delete el.__xhr_handler;
      delete el.__xhr_request_in_progress;
    };
  });

  // utils/duration.js
  function extractDuration(modifiers, defaultDuration) {
    if (!(modifiers instanceof Map)) return defaultDuration;
    for (const [, value] of modifiers) {
      const durationValue = isObject(value) ? value.value : value;
      if (isString(durationValue)) {
        const parsedDuration = parseTime(durationValue);
        if (parsedDuration !== null) return parsedDuration;
      }
    }
    return defaultDuration;
  }
  function parseTime(duration) {
    const durationRegex = /^(\d+)(ms|s)$/;
    if (isString(duration) && durationRegex.test(duration)) {
      const [, _duration, unit] = duration.match(durationRegex);
      return unit === "ms" ? Number(_duration) : Number(_duration) * 1e3;
    }
    return null;
  }

  // directives/a-on.js
  directive("on", ({ el, directive: directive2 }) => {
    const { modifiers, expression, value } = directive2;
    const eventNames = value ? value.split(",").map((e) => e.trim()) : [];
    if (eventNames.length === 0) {
      handleError("No event specified for a-on directive in element: ", el);
      return;
    }
    const options = {
      preventDefault: modifiers?.has("prevent") || false,
      stopPropagation: modifiers?.has("stop") || false,
      once: modifiers?.has("once") || false,
      capture: modifiers?.has("capture") || false,
      passive: modifiers?.has("passive") || false,
      self: modifiers?.has("self") || false,
      window: modifiers?.has("window") || false,
      document: modifiers?.has("document") || false,
      outside: modifiers?.has("outside") || false,
      rootMargin: modifiers?.get("rootMargin")?.value,
      threshold: modifiers?.get("threshold")?.value,
      delay: parseTime(modifiers?.get("debounce")?.value || "0"),
      throttle: parseTime(modifiers?.get("throttle")?.value || "0"),
      keyModifiers: Array.from(modifiers?.keys() || []).filter((key) => key in keyCodeMap || MODIFIER_KEYS.includes(key))
    };
    try {
      const handler = async (event) => {
        const result = await evaluateInContext(el, expression, { $event: event, $el: el });
        return result;
      };
      const wrappedHandler = createEventHandler(el, handler, options);
      const cleanup2 = eventNames.map(
        (event) => event === "intersect" ? setupIntersectObserver(el, wrappedHandler, options) : applyEventListener(el, event, wrappedHandler, options)
      );
      return () => cleanup2.forEach((cleanup3) => cleanup3());
    } catch (error) {
      handleError(`Error evaluating expression in a-on directive: ${error.message}`, el);
    }
  });
  function applyEventListener(el, event, handler, options) {
    if (options.window) return listen(window, event, handler, options);
    if (options.document) return listen(document, event, handler, options);
    if (options.outside && event === "click") return setupOutsideEvent(el, event, handler, options);
    return listen(el, event, handler, options);
  }

  // features/supportBucleFor.js
  async function createItemElement(templateContent, item, key, length, parentData, iteratorNames, el) {
    const template = document.createElement("template");
    template.innerHTML = templateContent.trim();
    let itemEl = template.content.firstElementChild || template.content.firstChild;
    if (!itemEl) {
      handleError("Invalid template in a-for directive", el);
      return null;
    }
    const itemData = {
      ...parentData,
      [iteratorNames.item]: item,
      [iteratorNames.key || "key"]: key,
      [iteratorNames.index || "index"]: key,
      length,
      parent: parentData
    };
    setData(itemEl, itemData);
    updateData(itemEl);
    const ifDirective = getDirectiveValue2(itemEl, "if");
    if (ifDirective && !await evaluateInContext(itemEl, ifDirective.expression, itemData)) return null;
    const showDirective = getDirectiveValue2(itemEl, "show");
    if (showDirective)
      itemEl.style.display = await evaluateInContext(itemEl, showDirective.expression, itemData) ? "" : "none";
    findElementsWithAsorDirectives(itemEl).forEach((childEl) => {
      if (ifElementHasAnyDirective(childEl))
        initDirectives(childEl);
    });
    return itemEl;
  }
  async function appendItems(el, items, parentData, templateContent, iteratorNames) {
    if (items == null) {
      warn("Items is null or undefined in appendItems");
      return;
    }
    const isArray2 = Array.isArray(items);
    const entries = isArray2 ? items : Object.entries(items);
    const fragment = document.createDocumentFragment();
    const generatedItems = el.parentElement.querySelectorAll('[data-asor-generated="true"]');
    generatedItems.forEach((itemEl) => itemEl.remove());
    for (const [index, entry] of entries.entries()) {
      const key = isArray2 ? index : entry[0];
      const value = isArray2 ? entry : entry[1];
      const itemEl = await createItemElement(templateContent, value, key, entries.length, parentData, iteratorNames, el);
      if (itemEl) {
        itemEl.setAttribute("data-asor-generated", "true");
        fragment.appendChild(itemEl);
      }
    }
    el.parentElement.insertBefore(fragment, el.nextSibling);
  }

  // directives/a-for.js
  directive("for", ({ el, directive: directive2 }) => {
    const iteratorNames = parseForExpression(directive2.expression);
    if (!iteratorNames) {
      handleError("Invalid expression for a-for directive", el);
      return;
    }
    const templateContent = el.innerHTML;
    el.innerHTML = "";
    const dataOwner = findAncestor(el, (ele) => ele.__asor_def);
    if (!dataOwner) {
      handleError("No data owner found for a-for directive", el);
      return;
    }
    let isInitialized = false;
    const updateList = async () => {
      const parentData = dataOwner.__asor_def;
      let items = await evaluateInContext(el, iteratorNames.items, parentData);
      if (isNumber(items)) {
        items = convertNumberToRange(items);
      }
      if (isUndefined(items)) {
        warn(`${iteratorNames.items} is not defined`, el);
        return;
      }
      await appendItems(el, items, parentData, templateContent, iteratorNames);
      isInitialized = true;
    };
    updateList();
    const cleanup2 = onDataChange(dataOwner, () => {
      if (isInitialized) updateList();
    });
    return () => cleanup2();
  });
  var convertNumberToRange = (items) => {
    const count = items;
    return Array.from({ length: count }, (_, i) => i + 1);
  };

  // directives/a-if.js
  directive("if", ({ el, directive: directive2 }) => {
    const { expression } = directive2;
    const placeholder = document.createComment(`if: ${expression}`);
    let isConnected = false;
    const cleanup2 = () => {
      const shouldShow = evaluateInContext(el, expression);
      if (shouldShow && !isConnected && el.parentNode) {
        el.parentNode.insertBefore(placeholder, el.nextSibling);
        isConnected = true;
      } else if (!shouldShow && isConnected && el.parentNode) {
        el.parentNode.replaceChild(placeholder, el);
        isConnected = false;
      }
    };
    if (el.parentNode) el.parentNode.insertBefore(placeholder, el.nextSibling);
    return () => {
      cleanup2();
      if (placeholder.parentNode) placeholder.remove();
      if (isConnected && el.parentNode) el.remove();
    };
  });

  // directives/a-show.js
  directive("show", ({ el, directive: directive2 }) => {
    const { expression, modifiers } = directive2;
    const root = findRootElement(el);
    if (!root) {
      console.error("No se encontr\xF3 un elemento ra\xEDz con a-def para la directiva a-show.");
      return;
    }
    const update = async () => {
      try {
        const visible = await evaluateInContext(el, expression);
        if (!isUndefined(visible))
          updateVisibility(el, visible, modifiers.has("important"));
      } catch (error) {
        console.error(`Error updating visibility for element:`, el, error);
      }
    };
    update();
    const cleanup2 = onDataChange(root, () => update());
    return () => cleanup2();
  });
  function updateVisibility(el, visible, isImportant) {
    const transitionDirective = getDirectiveValue2(el, "transition");
    if (transitionDirective) dispatch(el, "asor:transition", { visible });
    else {
      el.style.display = visible ? "" : "none";
      if (isImportant) el.style.setProperty("display", el.style.display, "important");
    }
  }

  // features/supportProgressBar.js
  var PBar = class _PBar {
    static DEFAULT_OPTIONS = {
      color: "#29d",
      height: "3px",
      duration: 300,
      delay: 300,
      zIndex: 14062024,
      className: "asor-progress-bar"
    };
    constructor(options = {}) {
      this.options = { ..._PBar.DEFAULT_OPTIONS, ...options };
      this.bar = null;
      this.visible = false;
      this.timeout = null;
      this.value = 0;
      this.trickleInterval = null;
    }
    show() {
      if (this.visible) return;
      this.visible = true;
      this.value = 0;
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.createBar();
        this.trickle();
      }, this.options.delay);
    }
    hide() {
      if (!this.visible) return;
      clearTimeout(this.timeout);
      clearInterval(this.trickleInterval);
      this.visible = false;
      this.setValue(100);
      this.timeout = setTimeout(() => {
        this.removeBar();
        this.value = 0;
      }, this.options.duration);
    }
    setValue(value) {
      this.value = Math.min(100, Math.max(0, value));
      if (this.bar) {
        this.bar.style.width = `${this.value}%`;
        this.updateARIA();
      }
    }
    trickle() {
      clearInterval(this.trickleInterval);
      this.trickleInterval = setInterval(() => {
        const remainingProgress = 100 - this.value;
        const increment = 0.02 * Math.pow(1 - Math.sqrt(remainingProgress), 2);
        this.setValue(this.value + increment);
      }, 100);
    }
    createBar() {
      if (this.bar) return;
      this.bar = document.createElement("div");
      this.bar.className = this.options.className;
      this.bar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0;
            height: ${this.options.height};
            background-color: ${this.options.color};
            z-index: ${this.options.zIndex};
            transition: width ${this.options.duration}ms ease-out;
            box-shadow: 0 0 10px ${this.options.color}, 0 0 5px ${this.options.color};
            pointer-events: none;
        `;
      this.setAccessibility();
      document.body.appendChild(this.bar);
    }
    removeBar() {
      if (this.bar && this.bar.parentNode) {
        this.bar.parentNode.removeChild(this.bar);
        this.bar = null;
      }
    }
    setAccessibility() {
      if (!this.bar) return;
      this.bar.setAttribute("role", "progressbar");
      this.bar.setAttribute("aria-valuemin", "0");
      this.bar.setAttribute("aria-valuemax", "100");
      this.updateARIA();
    }
    updateARIA() {
      if (!this.bar) return;
      this.bar.setAttribute("aria-valuenow", Math.round(this.value));
      this.bar.setAttribute("aria-label", `Progress: ${Math.round(this.value)}%`);
    }
    static injectStyles() {
      const style = document.createElement("style");
      style.textContent = `
            @keyframes asor-progress-bar-pulse {
                0% { box-shadow: 0 0 10px ${_PBar.DEFAULT_OPTIONS.color}, 0 0 5px ${_PBar.DEFAULT_OPTIONS.color}; }
                50% { box-shadow: 0 0 20px ${_PBar.DEFAULT_OPTIONS.color}, 0 0 10px ${_PBar.DEFAULT_OPTIONS.color}; }
                100% { box-shadow: 0 0 10px ${_PBar.DEFAULT_OPTIONS.color}, 0 0 5px ${_PBar.DEFAULT_OPTIONS.color}; }
            }
            .${_PBar.DEFAULT_OPTIONS.className} {
                animation: asor-progress-bar-pulse 1.5s infinite ease-in-out;
            }
        `;
      const cspNonce = getMetaContent("csp-nonce");
      if (cspNonce) style.nonce = cspNonce;
      document.head.appendChild(style);
    }
  };
  PBar.injectStyles();

  // features/supportNavigate.js
  var MAX_CACHE_SIZE2 = 50;
  var NavigationManager = class {
    constructor() {
      this.progressBar = new PBar({ delay: 250 });
      this.cache = /* @__PURE__ */ new Map();
      this.scrollPositions = /* @__PURE__ */ new Map();
      this.currentRequest = null;
      this.executedScripts = /* @__PURE__ */ new Set();
      window.addEventListener("popstate", this.handlePopState.bind(this));
    }
    handleNavigate = async (event) => {
      if (this.shouldInterceptClick(event)) return;
      event.preventDefault();
      const url = event.currentTarget.href || event.currentTarget.getAttribute("href");
      if (!url) {
        handleError("No URL found for navigation.");
        return;
      }
      await this.navigate(url);
    };
    shouldInterceptClick = (event) => event.which > 1 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
    handlePopState = async () => {
      const url = window.location.href;
      const cacheKey = new URL(url, document.baseURI).href;
      if (this.cache.has(cacheKey)) {
        const response = this.cache.get(cacheKey);
        await this.renderView(response.html);
      } else {
        await this.navigate(url, { pushState: false });
      }
    };
    async navigate(url, options = { pushState: true }) {
      try {
        this.clearExecutedScripts();
        this.progressBar.show();
        this.saveScrollPosition();
        dispatch(document, "asor:navigating", { url });
        const response = await this.loadView(url);
        if (!response) return;
        const urlObject = new URL(url, document.baseURI);
        if (options.pushState) {
          await this.updateState("pushState", urlObject.href);
        } else {
          await this.updateState("replaceState", urlObject.href);
        }
        await this.renderView(response.html);
        this.restoreScrollPosition(url);
        this.animateTransition();
        dispatch(document, "asor:navigated", { url: urlObject.href });
      } catch (err) {
        handleError("Navigation error:", err);
      } finally {
        this.progressBar.hide();
      }
    }
    async loadView(url) {
      const fullUrl = new URL(url, document.baseURI).href;
      const cacheKey = fullUrl;
      if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
      if (this.currentRequest) this.currentRequest.abort();
      const controller = new AbortController();
      this.currentRequest = controller;
      try {
        const response = await fetch(fullUrl, {
          method: "GET",
          headers: { "X-Requested-With": "XMLHttpRequest" },
          signal: controller.signal
        });
        if (!response.ok) handleError(`Navigation to ${url} failed with state ${response.status}`);
        const html = await response.text();
        const result = { html };
        this.cache.set(cacheKey, result);
        this.trimCache();
        return result;
      } catch (err) {
        if (err.name === "AbortError") warn(`Solicitud a ${url} abortada`);
        else handleError(`Error while navigating to ${url}:`, err);
        throw err;
      } finally {
        if (this.currentRequest === controller) this.currentRequest = null;
      }
    }
    trimCache() {
      if (this.cache.size > MAX_CACHE_SIZE2) {
        const keysToDelete = Array.from(this.cache.keys()).slice(0, this.cache.size - MAX_CACHE_SIZE2);
        keysToDelete.forEach((key) => this.cache.delete(key));
      }
    }
    saveScrollPosition() {
      const url = new URL(window.location.href);
      const key = url.href;
      this.scrollPositions.set(key, {
        x: window.scrollX,
        y: window.scrollY
      });
    }
    restoreScrollPosition(url) {
      const urlObj = new URL(url);
      const key = urlObj.href;
      requestAnimationFrame(() => {
        const position = this.scrollPositions.get(key) || { x: 0, y: 0 };
        window.scrollTo(position.x, position.y);
      });
    }
    animateTransition() {
      document.body.style.opacity = "0";
      requestAnimationFrame(() => {
        document.body.style.transition = "opacity 0.3s";
        document.body.style.opacity = "1";
        setTimeout(() => {
          document.body.style.transition = "";
        }, 300);
      });
    }
    async updateState(method, url) {
      try {
        history[method]({}, document.title, url);
      } catch (err) {
        if (err instanceof DOMException && err.name === "SecurityError") {
          handleError(`You cannot use asor:navigate with a link to a different root domain: ${url}`);
        }
      }
    }
    async renderView(html) {
      const parser = new DOMParser();
      const newDocument = parser.parseFromString(html, "text/html");
      document.title = newDocument.title;
      await this.updateHead(newDocument.head);
      await this.updateBody(newDocument.body);
      this.executeScripts(document.head);
      this.executeScripts(document.body);
      if (window.Asor && isFunction(window.Asor.start)) window.Asor.start(true);
    }
    async updateHead(newHead) {
      const currentHead = document.head;
      Array.from(currentHead.children).forEach((child) => {
        if (!child.hasAttribute("data-persist")) child.remove();
      });
      Array.from(newHead.children).forEach((child) => {
        if (!child.hasAttribute("data-persist")) currentHead.appendChild(child.cloneNode(true));
      });
    }
    async updateBody(newBody) {
      document.body.innerHTML = newBody.innerHTML;
    }
    executeScripts(container) {
      container.querySelectorAll("script").forEach((oldScript) => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
        if (oldScript.src) {
          if (!this.executedScripts.has(oldScript.src)) {
            newScript.src = oldScript.src;
            this.executedScripts.add(oldScript.src);
          }
        } else {
          newScript.textContent = oldScript.textContent;
          this.executedScripts.add(oldScript.textContent);
        }
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
    }
    clearExecutedScripts() {
      this.executedScripts.clear();
    }
    async preloadView(url) {
      const fullUrl = new URL(url, document.baseURI).href;
      const cacheKey = fullUrl;
      if (this.cache.has(cacheKey)) return;
      try {
        const response = await fetch(fullUrl, {
          method: "GET",
          headers: { "X-Requested-With": "XMLHttpRequest" },
          signal: AbortSignal.timeout(1e4)
          // 10 seconds of waiting time
        });
        if (!response.ok) handleError(`Precarga de ${url} fall\xF3 con el estado ${response.status}`);
        const html = await response.text();
        this.cache.set(cacheKey, { html });
        this.trimCache();
      } catch (err) {
        handleError("Error en la precarga:", err);
      }
    }
  };

  // directives/a-navigate.js
  var navigationManager;
  directive("navigate", ({ el, directive: directive2 }) => {
    if (!navigationManager) navigationManager = new NavigationManager();
    if (el.hasNavigateListener) return;
    el.hasNavigateListener = true;
    let isNavigating = false;
    const handleNavigation = async (e) => {
      if (isNavigating) return;
      isNavigating = true;
      if (e.type === "click") e.preventDefault();
      try {
        if (await ifConfirm(el)) await navigationManager.handleNavigate(e);
      } catch (err) {
        handleError("Navigation error:", err);
      } finally {
        isNavigating = false;
      }
    };
    listen(el, "click", handleNavigation);
    if (directive2.hasModifier("lazy")) setupNavigationObserver(el, directive2);
    else if (directive2.hasModifier("hover")) setupNavigationLazy(el);
  });
  function setupNavigationObserver(el, directive2) {
    const onIntersection = () => {
      const url = el.getAttribute("href");
      if (url) navigationManager.preloadView(url);
    };
    return setupIntersectObserver(el, onIntersection, {
      rootMargin: directive2.getModifierValue("margin") || "90px",
      once: directive2.hasModifier("once")
    });
  }
  function setupNavigationLazy(el) {
    const handler = () => {
      const url = el.getAttribute("href");
      if (url) navigationManager.preloadView(url);
    };
    listen(el, "mouseenter", handler);
  }

  // directives/a-transition.js
  directive("transition", ({ el, directive: directive2 }) => {
    const options = parseTransitionOptions(directive2);
    let isTransitioning = false;
    let currentVisibility = null;
    const applyTransition2 = (isEnter) => {
      if (isTransitioning || isEnter === currentVisibility) return;
      isTransitioning = true;
      currentVisibility = isEnter;
      const phase = isEnter ? "enter" : "leave";
      const duration = isEnter ? options.enterDuration : options.leaveDuration;
      if (options.useClasses) applyTransitionClasses(el, phase, duration);
      else applyTransitionStyles(el, isEnter, options);
      setTimeout(() => {
        isTransitioning = false;
        if (!isEnter) el.style.display = "none";
      }, duration);
    };
    const handleTransition = (event) => {
      const visible = event.detail.visible;
      if (visible !== currentVisibility) {
        if (visible) el.style.display = "";
        applyTransition2(visible);
      }
    };
    const cleanup2 = listen(el, "asor:transition", handleTransition);
    currentVisibility = window.getComputedStyle(el).display !== "none";
    if (!currentVisibility) {
      el.style.display = "none";
    }
    return cleanup2;
  });
  function applyTransitionClasses(el, phase, duration) {
    const transitionClass = getDirectiveValue2(el, `transition:${phase}`)?.expression;
    const startClass = getDirectiveValue2(el, `transition:${phase}-start`)?.expression;
    const endClass = getDirectiveValue2(el, `transition:${phase}-end`)?.expression;
    if (transitionClass) el.classList.add(transitionClass);
    if (startClass) {
      el.classList.add(startClass);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.classList.remove(startClass);
          if (endClass) el.classList.add(endClass);
        });
      });
    }
    setTimeout(() => {
      if (transitionClass) el.classList.remove(transitionClass);
      if (endClass) el.classList.remove(endClass);
    }, duration);
  }
  function applyTransitionStyles(el, isEnter, options) {
    el.style.transition = "none";
    void el.offsetWidth;
    el.style.opacity = isEnter ? options.initialOpacity : "1";
    if (options.scale) el.style.transform = `scale(${isEnter ? options.initialScale : "1"})`;
    void el.offsetWidth;
    el.style.transition = `all ${isEnter ? options.enterDuration : options.leaveDuration}ms ${options.easing}`;
    el.style.opacity = isEnter ? "1" : options.initialOpacity;
    if (options.scale) el.style.transform = `scale(${isEnter ? "1" : options.initialScale})`;
    if (options.origin !== "center") el.style.transformOrigin = options.origin;
  }
  function parseTransitionOptions(directive2) {
    const options = {
      enterDuration: 300,
      leaveDuration: 300,
      delay: 0,
      easing: "ease",
      opacity: true,
      scale: false,
      initialOpacity: "0",
      initialScale: "0.95",
      useClasses: false,
      origin: "center"
    };
    const durationKeys = /* @__PURE__ */ new Map([["duration", "enterDuration"], ["enter", "enterDuration"], ["leave", "leaveDuration"], ["delay", "delay"]]);
    directive2.modifiers.forEach((value, key) => {
      if (durationKeys.has(key)) {
        options[durationKeys.get(key)] = extractDuration(/* @__PURE__ */ new Map([[key, value]]), options[durationKeys.get(key)]);
        if (key === "duration") options.leaveDuration = options.enterDuration;
      } else if (["ease", "ease-in", "ease-out", "ease-in-out", "linear"].includes(key)) {
        options.easing = key;
      } else if (key === "opacity") {
        options.opacity = true;
        options.scale = false;
      } else if (key === "scale") {
        options.scale = true;
        options.opacity = value !== "false";
        if (value && value !== "true") options.initialScale = parseFloat(value) / 100;
      } else if (key === "origin") {
        options.origin = value || "center";
      }
    });
    if (getDirectiveValue2(directive2.el, "transition:enter") || getDirectiveValue2(directive2.el, "transition:leave")) {
      options.useClasses = true;
    }
    return options;
  }

  // utils/toggle.js
  function toggleState(el, directive2, isTruthy, cachedDisplay = null) {
    isTruthy = directive2.hasModifier("remove") ? !isTruthy : isTruthy;
    if (directive2.hasModifier("class")) {
      let classes = directive2.expression.split(" ").filter(String);
      if (isTruthy) el.classList.add(...classes);
      else el.classList.remove(...classes);
    } else if (directive2.hasModifier("attr")) {
      if (isTruthy) el.setAttribute(directive2.expression, true);
      else el.removeAttribute(directive2.expression);
    } else {
      let cache2 = cachedDisplay ?? getStyle(el, "display");
      let display = ["inline", "block", "table", "flex", "grid", "inline-flex"].find((i) => directive2.hasModifier(i)) || "inline-block";
      display = directive2.hasModifier("remove") && !isTruthy ? cache2 : display;
      el.style.display = isTruthy ? display : "none";
    }
  }

  // directives/a-loading.js
  directive("loading", ({ el, directive: directive2 }) => {
    const delays = { shortest: 50, shorter: 100, short: 150, default: 200, long: 300, longer: 500, longest: 1e3 };
    const duration = directive2.getAllModifiers().reduce((acc, mod) => delays[mod.name] || acc, delays.default);
    let timeout, isLoading = false;
    const withDelay = (cb) => directive2.hasModifier("delay") && !directive2.hasModifier("none") ? () => {
      timeout = setTimeout(() => {
        cb();
      }, duration);
    } : cb;
    const start2 = withDelay(() => {
      if (!isLoading) {
        isLoading = true;
        toggleState(el, directive2, true);
      }
    });
    const end = () => {
      clearTimeout(timeout);
      if (isLoading) {
        isLoading = false;
        toggleState(el, directive2, false);
      }
    };
    const startCleanup = listen(document, "asor:before-send", start2);
    const endCleanup = listen(document, "asor:after-request", end);
    return () => {
      startCleanup();
      endCleanup();
      clearTimeout(timeout);
    };
  });

  // directives/a-offline.js
  var offlineHandlers = /* @__PURE__ */ new Set();
  var onlineHandlers = /* @__PURE__ */ new Set();
  function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    const handlers = isOnline ? onlineHandlers : offlineHandlers;
    handlers.forEach((handler) => handler());
  }
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  if (typeof navigator.onLine !== "undefined") updateOnlineStatus();
  directive("offline", ({ el, directive: directive2 }) => {
    const setOffline = () => toggleState(el, directive2, true);
    const setOnline = () => toggleState(el, directive2, false);
    offlineHandlers.add(setOffline);
    onlineHandlers.add(setOnline);
    if (typeof navigator.onLine !== "undefined") toggleState(el, directive2, !navigator.onLine);
    return () => {
      offlineHandlers.delete(setOffline);
      onlineHandlers.delete(setOnline);
    };
  });

  // directives/a-stream.js
  var RECONNECT_DELAY = 5e3;
  directive("stream", ({ el, directive: directive2 }) => {
    const url = directive2.expression;
    const swapMethod = getDirectiveValue2(el, "swap")?.expression || "innerHTML";
    let eventSource = null;
    const connect = () => {
      eventSource = new EventSource(url);
      el._stream = eventSource;
      eventSource.onopen = () => dispatch(el, "stream:open");
      eventSource.onmessage = (event) => handleMessage(el, event, swapMethod);
      eventSource.onerror = (error) => handleError2(el, error, connect);
    };
    const disconnect = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
    connect();
    return () => disconnect();
  });
  function handleMessage(el, event, swapMethod) {
    applySwapMethod(el, event.data, swapMethod);
    dispatch(el, "stream:message", { data: event.data });
  }
  function handleError2(el, error, reconnectCallback) {
    dispatch(el, "stream:error", { error });
    reconnectCallback();
    setTimeout(reconnectCallback, RECONNECT_DELAY);
  }

  // directives/a-id.js
  directive("id", async ({ el, directive: directive2 }) => {
    const names = await evaluateInContext(el, directive2.expression?.trim());
    if (!Array.isArray(names)) {
      console.error("a-id directive requires an array expression.");
      return;
    }
    if (!el._asor_ids) el._asor_ids = {};
    names.forEach((key) => {
      if (!el._asor_ids[key]) el._asor_ids[key] = generateUniqueId(key);
    });
  });

  // index.js
  var Asor = {
    on,
    stop,
    warn,
    error: handleError,
    store: handleStore,
    start,
    mount,
    debounce,
    throttle,
    evaluate: evaluateInContext,
    directive,
    component: registerComponent,
    updateDOM,
    onDataChange,
    dispatchSelf,
    getDirectives,
    dispatchGlobal
  };
  var asor_default = Asor;

  // builds/cdn.js
  window.Asor = asor_default;
  queueMicrotask(() => asor_default.start());
})();
