import { isElement, isFunction } from "./types.js";

  export function warn(message, context = {}, ...args) {
    logMessage("Warning", message, context, ...args);
  }
  
  export function handleError(error, context = {}) {
    const message = typeof error === 'string' ? error : error.message || 'Unknown error';
    const details = { message, ...context };
    setTimeout(() => logMessage("Error", message, details), 0);
  }
  
  export function safeCall(fn, options = {}, ...args) {
    const { el, expression, message = '', defaultValue = null, rethrow = false, onError } = options;
  
    try {
      return fn(...args);
    } catch (error) {
      const fullMessage = `${message}\n${error.message}`;
      handleError(fullMessage, { el, expression });
      if (onError && isFunction(onError)) onError(error, { el, expression, message });
      if (rethrow) throw error;
  
      return defaultValue;
    }
  }
  
  function logMessage(type, message, context = {}, ...args) {
    const { el, expression, component } = context;
    const timestamp = new Date().toISOString();
    const details = { message, el, expression, component, timestamp, additionalInfo: args };
  
    // Normalize the log type and obtain the appropriate log function
    const normalizedType = type.toLowerCase();
    const logFunction = console[normalizedType] || console.log;
  
    console.groupCollapsed(`%c[Asor ${type}]: ${message}`, `color: ${normalizedType === "error" ? "#FF0000" : "#FFA500"}; font-weight: bold;`);
    logFunction(message);
    if (component) logFunction(`Component: ${component}`);
    if (expression) logFunction(`Expression: "${expression}"`);
    if (el && isElement(el)) logFunction("Element:", el);
    logFunction("Timestamp:", timestamp);
  
    if (args.length > 0) {
      console.groupCollapsed("Additional Info");
      args.forEach((arg, index) => logFunction(`Argument ${index + 1}:`, arg));
      console.groupEnd();
    }
    console.groupCollapsed(`${type} Details`);
    logFunction(details);
    console.groupEnd();
    console.groupCollapsed("Stack Trace");
    console.trace();
    console.groupEnd();
    console.groupEnd();
  }