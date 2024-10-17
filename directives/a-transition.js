import { directive, getDirectiveValue } from "../directives";
import { listen } from "../utils/events";
import { extractDuration } from "../utils/duration";

directive("transition", ({ el, directive }) => {
    const options = parseTransitionOptions(directive);
    let isTransitioning = false;
    let currentVisibility = null;
    
    const applyTransition = (isEnter) => {
        if (isTransitioning || isEnter === currentVisibility) return;
        isTransitioning = true;
        currentVisibility = isEnter;

        const phase = isEnter ? 'enter' : 'leave';
        const duration = isEnter ? options.enterDuration : options.leaveDuration;
        
        if (options.useClasses) applyTransitionClasses(el, phase, duration);
        else applyTransitionStyles(el, isEnter, options);

        setTimeout(() => {
            isTransitioning = false;
            if (!isEnter) el.style.display = 'none';
        }, duration);
    };

    const handleTransition = (event) => {
        const visible = event.detail.visible;
        if (visible !== currentVisibility) {
            if (visible) el.style.display = ''; // Ensure that the element is visible before the transition
            applyTransition(visible);
        }
    };

    const cleanup = listen(el, 'asor:transition', handleTransition);

    currentVisibility = window.getComputedStyle(el).display !== 'none';
    if (!currentVisibility) {
        el.style.display = 'none';
    }

    return cleanup;
});

function applyTransitionClasses(el, phase, duration) {
    const transitionClass = getDirectiveValue(el, `transition:${phase}`)?.expression;
    const startClass = getDirectiveValue(el, `transition:${phase}-start`)?.expression;
    const endClass = getDirectiveValue(el, `transition:${phase}-end`)?.expression;

    if (transitionClass) el.classList.add(transitionClass);
    if (startClass) {
        el.classList.add(startClass);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.classList.remove(startClass);
                if (endClass) el.classList.add(endClass);
            });
        });
    }

    setTimeout(() => {
        if (transitionClass) el.classList.remove(transitionClass);
        if (endClass) el.classList.remove(endClass);
    }, duration);
}

function applyTransitionStyles(el, isEnter, options) {
    el.style.transition = 'none';
    void el.offsetWidth;

    el.style.opacity = isEnter ? options.initialOpacity : '1';
    if (options.scale) el.style.transform = `scale(${isEnter ? options.initialScale : '1'})`;

    void el.offsetWidth;

    el.style.transition = `all ${isEnter ? options.enterDuration : options.leaveDuration}ms ${options.easing}`;
    el.style.opacity = isEnter ? '1' : options.initialOpacity;
    if (options.scale) el.style.transform = `scale(${isEnter ? '1' : options.initialScale})`;

    if (options.origin !== 'center') el.style.transformOrigin = options.origin;
}

function parseTransitionOptions(directive) {
    const options = {
        enterDuration: 300,
        leaveDuration: 300,
        delay: 0,
        easing: 'ease',
        opacity: true,
        scale: false,
        initialOpacity: '0',
        initialScale: '0.95',
        useClasses: false,
        origin: 'center'
    };

    const durationKeys = new Map([['duration', 'enterDuration'],['enter', 'enterDuration'],['leave', 'leaveDuration'], ['delay', 'delay']]);

    directive.modifiers.forEach((value, key) => {
        if (durationKeys.has(key)) {
            options[durationKeys.get(key)] = extractDuration(new Map([[key, value]]), options[durationKeys.get(key)]);
            if (key === 'duration') options.leaveDuration = options.enterDuration;
        } else if (['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear'].includes(key)) {
            options.easing = key;
        } else if (key === 'opacity') {
            options.opacity = true;
            options.scale = false;
        } else if (key === 'scale') {
            options.scale = true;
            options.opacity = value !== 'false';
            if (value && value !== 'true') options.initialScale = parseFloat(value) / 100;
        } else if (key === 'origin') {
            options.origin = value || 'center';
        }
    });

    if (getDirectiveValue(directive.el, 'transition:enter') || getDirectiveValue(directive.el, 'transition:leave')) {
        options.useClasses = true;
    }

    return options;
}