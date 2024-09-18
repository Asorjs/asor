import { directive } from "../directives.js";
import { toggleState } from "../utils/toggle.js";
import { listen } from "../utils/events.js";

directive("loading", ({ el, directive }) => {
    const delays = { shortest: 50, shorter: 100, short: 150, default: 200, long: 300, longer: 500, longest: 1000 };
    const duration = directive.getAllModifiers().reduce((acc, mod) => delays[mod.name] || acc, delays.default);
    
    let timeout, isLoading = false;
    
    const withDelay = (cb) => directive.hasModifier("delay") && !directive.hasModifier("none")
        ? () => { timeout = setTimeout(() => { cb(); }, duration); }
        : cb;

    const start = withDelay(() => {
        if (!isLoading) {
            isLoading = true;
            toggleState(el, directive, true);
        }
    });

    const end = () => {
        clearTimeout(timeout);
        if (isLoading) {
            isLoading = false;
            toggleState(el, directive, false);
        }
    };

    const startCleanup = listen(document, "asor:before-send", start);
    const endCleanup = listen(document, "asor:after-request", end);

    return () => {
        startCleanup();
        endCleanup();
        clearTimeout(timeout);
    };
});
