import { directive } from "../directives.js";
import { getData, setData } from "../features/supportDataStore.js";
import { findRootElement } from "../utils/dom.js";

directive("ref", ({ el, directive }) => {    
    const refName = directive.expression;
    if (!refName) return;

    const root = findRootElement(el);
    if (!root._asor_refs) root._asor_refs = {};

    root._asor_refs[refName] = el;

    // Actualizar los datos raíz si no es el document.documentElement
    if (root !== document.documentElement) {
        const rootData = getData(root) || {};
        rootData.$refs = root._asor_refs;
        setData(root, rootData);
    }

    return () => cleanup(rootData);
});


function cleanup(root) {
    const refName = getDirectiveValue(root, "ref")?.expression;
    if (refName) {
        delete root._asor_refs[refName];
        if (root !== document.documentElement) {
            const rootData = getData(root) || {};
            if (rootData.$refs) {
                delete rootData.$refs[refName];
                setData(root, rootData);
            }
        }
    }
}