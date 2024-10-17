import { handleError } from "../utils/logger";
import { ifConfirm } from "../utils/confirm";
import { debounce } from "../utils/debounce";
import { throttle } from "../utils/throttle";
import { listen, dispatch } from "../utils/events";
import { isFunction } from "../utils/types";

export const keyCodeMap = { enter: 13, tab: 9, delete: 46, esc: 27, space: 32, up: 38, down: 40, left: 37, right: 39, shift: 16, ctrl: 17, alt: 18, meta: 91 };
export const MODIFIER_KEYS = ["shift", "ctrl", "alt", "meta"];

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];

const handlerPool = new WeakMap();

export const getRequestMethodFromDirective = (directive) => HTTP_METHODS.includes(directive.value?.toLowerCase()) ? directive.value.toLowerCase() : "get";

const EVENT_TYPE_MAP = {
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
    "datetime-local": "change",
  },
  default: "click",
};

export function getDefaultEventType(el) {
  const tagName = el.tagName.toLowerCase();
  const type = (el.type || "").toLowerCase();
  
  if (tagName === "input") return EVENT_TYPE_MAP.input[type] || "input";
  return EVENT_TYPE_MAP[tagName] || (el.isContentEditable ? "input" : el.getAttribute("tabindex") !== null ? "focus" : EVENT_TYPE_MAP.default);
}

export const createEventHandler = (el, handler, options = {}) => {
  const { preventDefault, stopPropagation, once, delay, throttleTime, passive, keyModifiers, self } = {
    preventDefault: false, stopPropagation: false, once: false, delay: 0, throttleTime: 0, passive: false, keyModifiers: [], self: false, ...options
  };

  const handlerKey = JSON.stringify({ preventDefault, stopPropagation, once, delay, throttleTime, passive, keyModifiers, self });
  if (!handlerPool.has(el)) handlerPool.set(el, new Map());
  
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

const executeHandler = (handler, delay, throttleTime) =>
  delay > 0 ? debounce(handler, delay)() : (throttleTime > 0 ? throttle(handler, throttleTime)() : handler());

const cleanupHandler = (el, handlerKey) => {
  const elHandlers = handlerPool.get(el);
  elHandlers.delete(handlerKey);
  if (elHandlers.size === 0) handlerPool.delete(el);
};

const handleEvent = async (el, event, handler) => {
  try {
    if (!(await ifConfirm(el))) return;
   
    const result = isFunction(handler) ? await handler.call(el, event) : true;
    if (result !== false && el.__xhr_handler && !el.__xhr_request_in_progress)
   
        await el.__xhr_handler.call(el, event);
  } catch (err) {
    handleError("Error in event handler:", err, el);
  }
};

const isKeyEvent = (event) => event.type?.startsWith("key");
const checkKeyModifiers = (event, keyModifiers) => keyModifiers.every((key) => MODIFIER_KEYS.includes(key) ? event[`${key}Key`] : event.keyCode === keyCodeMap[key]);

export const setupIntersectionObserver = (el, callback, options = {}) => {
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

export const setupOutsideEvent = (el, eventName, handler, options = {}) => listen(document, eventName, (event) => { if (!el.contains(event.target)) handler(event); }, options);

export const delegateEvent = (container, eventType, selector, handler) =>
  listen(container, eventType, (event) => {
    const target = event.target.closest(selector);
    if (target && container.contains(target)) handler.call(target, event);
});

export const setupIntersectObserver = (el, handler, options) => {
  const { rootMargin = "0px", threshold = 0.1, once } = options;
  const callback = (entry, element) => {
    const event = { type: "intersect", detail: { entry, element }, target: element };
    if (dispatch(element, "intersect", event.detail)) handler.call(element, event);
  };
  return setupIntersectionObserver(el, callback, { rootMargin, threshold, once, disconnect: once });
};