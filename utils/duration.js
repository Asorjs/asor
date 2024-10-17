import { isObject, isString } from "./types";

export function extractDuration(modifiers, defaultDuration) {
    if (!(modifiers instanceof Map)) return defaultDuration;

    for (const [, value] of modifiers) {
        const durationValue = isObject(value) ? value.value : value;

        if (isString(durationValue)) {
            const parsedDuration = parseTime(durationValue);
            if (parsedDuration !== null) return parsedDuration;
        }
    }

    return defaultDuration;
}

export function parseTime(duration) {
    const durationRegex = /^(\d+)(ms|s)$/;
    if (isString(duration) && durationRegex.test(duration)) {
        const [, _duration, unit] = duration.match(durationRegex);
        return unit === "ms" ? Number(_duration) : Number(_duration) * 1000;
    }
    return null;
}
