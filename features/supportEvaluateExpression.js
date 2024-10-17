import { handleError, safeCall } from "../utils/logger";
import { isFunction, isString } from "../utils/types";
import { prepareContext } from "./supportContext";

const expressionCache = new Map();
const MAX_CACHE_SIZE = 500;

const createErrorOptions = (el, expression) => ({
    el, expression,
    rethrow: false,
    defaultValue: null,
    message: `Error evaluating expression: "${expression}"`,
});

const createExpressionBody = (expression) => `
    with (__context) {
        with ($data) {
            return (${expression});
        }
    }
`;

const wrapWithErrorHandling = (body) => `
    try {
        ${body}
    } catch (e) {
        if (e instanceof ReferenceError) return undefined;
        throw e;
    }
`;

export const buildFunction = (expression) => {
    const body = createExpressionBody(expression);
    const wrappedBody = wrapWithErrorHandling(body);
    return new Function('__context', wrappedBody);
};

const getCacheKey = (expression, context) => {
    const contextKeys = Object.keys(context).sort().join(',');
    return `${expression}::${contextKeys}`;
};

const addToCache = (key, value) => {
    if (expressionCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = expressionCache.keys().next().value;
        expressionCache.delete(oldestKey);
    }
    expressionCache.set(key, value);
};

export function evaluateExpression(el, expression, context) {
    const errorOptions = createErrorOptions(el, expression);
    
    if (isFunction(expression)) return safeCall(expression, errorOptions, context);
    
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
    
    return safeCall(() => compiledFn(fullContext), errorOptions);
}

export const evaluateInContext = (el, expression, additionalContext = {}) => 
    evaluateExpression(el, expression, additionalContext);