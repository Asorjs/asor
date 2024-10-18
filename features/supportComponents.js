import { handleError, safeCall } from "../utils/logger";
import { prepareContext } from "./supportContext";
import { isFunction } from "../utils/types";

const components = new Map();

export function registerComponent(name, componentFunction) {
  if (typeof componentFunction !== "function") {
    handleError(`Component "${name}" must be a function.`);
    return;
  }

  components.set(name, componentFunction);
}

export function getComponent(name) {
  return components.get(name);
}

export function hasComponent(name) {
  return components.has(name);
}

export function getComponents() {
  return components.get();
}

export const executeComponentFunction = (expression, el) => {
  const componentFunction = getComponent(expression);
  try {
    const context = prepareContext(el, {});
    return componentFunction(context);
  } catch (error) {
    handleError(`Error executing component: ${error.message}`, {
      el,
      expression,
    });

    return null;
  }
};