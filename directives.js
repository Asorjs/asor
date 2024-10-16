import { getData, setData } from './features/supportDataStore.js';
import { findElementsWithAsorDirectives } from './utils/dom.js';
import { handleError } from './utils/logger.js';

const directiveCache = new WeakMap();
const directiveHandlers = new Map();

const cacheRagex = new Map();
function getDirectiveRegex(prefixes) {
  const key = prefixes.join("|");
  if (!cacheRagex.has(key)) cacheRagex.set(key, new RegExp(`^(?:${key})([^\\s.:]+)(?:\\.[^\\s.:]+)*(?::[^\\s]+)?\\s*`));

    return cacheRagex.get(key);
}

const normalizeDirectiveName = (name) => {
    if (!name) throw new Error('Directive name is required');
    if (name.startsWith(':')) return `a-bind:${name.slice(1)}`;
    if (name.startsWith('@')) return `a-on:${name.slice(1)}`;
    return name.startsWith('a-') ? name : `a-${name}`;
};

export const directive = (name, handler) => directiveHandlers.set(name, handler);

export const mount = (root = document.body) => findElementsWithAsorDirectives(root).forEach(initDirectives);

export function initDirectives(el) {    
    if (!el) return handleError(`Undefined element: ${el}`);

    const manager = getDirectives(el);
    manager.directives
        .sort((a, b) => directiveOrderMap.get(a.name) - directiveOrderMap.get(b.name))
        .forEach(directive => {
            const handler = directiveHandlers.get(directive.name);
            if (handler) handler({ el, directive, manager });
        });    
}

export const ifElementHasAnyDirective = (el) => {
    return Array.from(el.attributes).some(attr => 
        attr.name.startsWith(':') || 
        attr.name.startsWith('@') || 
        attr.name.startsWith('a-')
    );
};

export const getDirectives = (el) => {
    let manager = directiveCache.get(el);
    if (!manager) {
        const directives = extractDirectives(el);
        manager = {
            el,
            directives,
            hasDirective: (name) => directives.some(d => d.name === name),
            getDirective: (name) => directives.find(d => d.name === name),
            delDirective: (name) => manager.directives = manager.directives.filter(d => d.name !== name)
        };
        directiveCache.set(el, manager);
    }
    return manager;
};

const directiveOrder = [
    "ref", "def", "id" ,"bind", "init", "confirm", "xhr", "on", 
    "effect", "show", "navigate", "transition", "for", "if", 
    "loading", "offline", "stream"
];

const directiveOrderMap = new Map(directiveOrder.map((d, i) => [d, i]));

export const getDirectiveValue = (el, directiveName) => {
    const directive = getDirectives(el).getDirective(directiveName);
    return directive ? { ...directive, name: directiveName } : null;
};

const extractDirectives = el => {
    if (!el?.attributes) {
        handleError('Invalid element in extractDirectives');
        return [];
    }

    const regex = getDirectiveRegex(['a-', '@', ':']);
    return Array.from(el.attributes)
        .filter(attr => regex.test(attr.name))
        .map(({ name, value }) => createDirectiveObject(el, name, value));
};

const createDirectiveObject = (el, name, expression) => {
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
        hasModifier: modName => modifiers.has(modName),
        getModifierValue: modName => modifiers.get(modName),
        getAllModifiers: () => Array.from(modifiers, ([name, value]) => ({ name, value })),
        hasModifiers: () => modifiers.size > 0,
        firstModifier: () => {
            const [name, value] = modifiers.entries().next().value || [];
            return name ? { name, value } : null;
        }
    };
};

const parseDirectiveName = normalizedName => {
    const regex = /^a-(?:(on):)?([^:.]+)(?::([^.]+))?/;
    const [, onPrefix, name, value] = normalizedName.match(regex) || [];
    
    return {
        directiveName: onPrefix || name,
        directiveValue: onPrefix ? name : value
    };
};

const parseModifiers = name => {
    const modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];
    return new Map(modifiers.map(mod => {
        const [key, val] = mod.slice(1).split('-');
        return [key, val === undefined ? true : val];
    }));
};

export async function reinitializeDirectives(newDOM, oldDOM) {
    const newElements = findElementsWithAsorDirectives(newDOM);
    const oldElements = findElementsWithAsorDirectives(oldDOM);

    newElements.forEach(newEl => {
        const oldEl = oldElements.find(el => el.isEqualNode(newEl));
        if (!oldEl || !areDirectivesEqual(newEl, oldEl))
            initDirectives(newEl);
        else {
            // If the element exists and the directives are the same, we preserve the state
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