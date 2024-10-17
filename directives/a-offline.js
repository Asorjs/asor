import { toggleState } from "../utils/toggle";
import { directive } from "../directives";

const offlineHandlers = new Set();
const onlineHandlers = new Set();

function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    const handlers = isOnline ? onlineHandlers : offlineHandlers;
    handlers.forEach(handler => handler());
}

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

if (typeof navigator.onLine !== "undefined") updateOnlineStatus();

directive("offline", ({ el, directive }) => {
    const setOffline = () => toggleState(el, directive, true);
    const setOnline  = () => toggleState(el, directive, false);

    offlineHandlers.add(setOffline);
    onlineHandlers.add(setOnline);

    if (typeof navigator.onLine !== "undefined") toggleState(el, directive, !navigator.onLine);

    return () => {
        offlineHandlers.delete(setOffline);
        onlineHandlers.delete(setOnline);
    };
});