import { getDirectiveValue } from "../directives.js";
import { isFunction } from "./types.js";

export async function ifConfirm(el) {
    const confirmDirective = getDirectiveValue(el, "confirm");
    if (!confirmDirective?.expression) return true;

    return new Promise(resolve => {
        if (isFunction (el.__confirm_action))
            el.__confirm_action(() => resolve(true), () => resolve(false));
        else 
            resolve(true);
    });
}