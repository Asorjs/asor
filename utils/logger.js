import { isFunction } from "./types";

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
  const color = type.toLowerCase() === "error" ? "#FF0000" : "#FFA500";

  console.groupCollapsed(`%c[Asor ${type}]: ${message}`, `color: ${color}; font-weight: bold;`);
  console.log(details);
  console.groupCollapsed("Stack Trace");
  console.trace();
  console.groupEnd();
}