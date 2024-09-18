import { directive } from "../directives.js";
import { getData, setData } from "../features/supportDataStore.js";
import { onElementRemoved } from "../features/supportMutationObserver.js";
import { findRootElement } from "../utils/dom.js";
import { isElement } from "../utils/types.js";

directive("ref", ({ el, directive: directive2 }) => {    
    const refName = directive2.expression?.trim();
    if (!refName) return;

    const updateRef = (action) => {
        const root = findRootElement(el);
        if (!root._asor_refs) root._asor_refs = {};
        action(root._asor_refs);

        if (root !== document.documentElement) {
            const rootData = getData(root) || {};
            rootData.$refs = root._asor_refs;
            setData(root, rootData);
        }
    };

    const setRef = () => updateRef((refs) => refs[refName] = el);
    const removeRef = () => updateRef((refs) => delete refs[refName]);

    setRef();

    return onElementRemoved((removedEl) => {
        if (isElement(removedEl) && removedEl === el) removeRef();
    });
});