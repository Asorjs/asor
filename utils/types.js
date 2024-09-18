export const isObject = (subject)  => subject !== null && typeof subject === 'object' && !Array.isArray(subject);
export const isFunction = (subject) => typeof subject === "function";
export const isArray = (subject) => Array.isArray(subject);
export const isString = (subject) => typeof subject === "string";
export const isNumber = (subject) => typeof subject === "number"
export const isBoolean = (subject) => typeof subject === "boolean"
export const isUndefined = (subject) => subject === undefined
export const isElement = (subject) => subject instanceof Element
export const isNull = (subject) => subject === null
export const isEqual = (obj1, obj2) => JSON.stringify(obj1) === JSON.stringify(obj2);