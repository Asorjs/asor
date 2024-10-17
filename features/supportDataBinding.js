import { listen } from "../utils/events";
import { isArray, isObject, isString } from "../utils/types";
import { getData, setData, updateData } from "./supportDataStore";

const valueGetters = {
    text: el => el.textContent,
    html: el => el.innerHTML,
    value: el => el.value,
    checked: el => el.checked,
    selected: el => el.selected,
    class: el => el.className,
};

const valueSetters = new Map([
    [ 'text', (el, value) => el.textContent = value ?? "" ],
    [ 'html', (el, value) => el.innerHTML = value ?? "" ],
    [ 'value', (el, value) => { if (el.value !== value) el.value = value ?? "" } ],
    [ 'checked', (el, value) => el.checked = !!value ],
    [ 'disabled', (el, value) => el.disabled = !!value ],
    [ 'readonly', (el, value) => el.readOnly = !!value ],
    [ 'required', (el, value) => el.required = !!value ],
    [ 'multiple', (el, value) => el.multiple = !!value ],
    [ 'hidden', (el, value) => el.hidden = !!value ],
    [ 'radio', (el, value) => el.checked = (el.value == value) ],
    [ 'open', (el, value) => el.open = !!value ],
    [ 'class', updateClasses ],
    [ 'style', updateStyles ],
    [ 'selected', updateSelectSelected ],
    [ 'multipleSelect', updateMultipleSelect ],
    [ 'contenteditable', (el, value) => { if (el.innerHTML !== value) el.innerHTML = value } ],
    [ 'number', (el, value) => { el.value = value === null || value === undefined ? '' : Number(value) } ],
]);

// export function updateElement(el, bindType, value) {
//     if (!el) return;

//     // Manejo especial para selects múltiples
//     if (el.tagName === 'SELECT' && el.multiple && bindType === 'value') {
//         updateMultipleSelect(el, value);
//         return;
//     }

//     const currentValue = getElementValue(el, bindType);
//     if (Object.is(currentValue, value)) return;
//     setElementValue(el, bindType, value);
// }

export function updateElement(el, bindType, value) {
    if (!el) return;
    const currentValue = getElementValue(el, bindType);
    // Evitar actualizar el elemento si el valor no ha cambiado
    if (Object.is(currentValue, value)) return;
    setElementValue(el, bindType, value);
}

function getElementValue(el, bindType) {
    return valueGetters[bindType]?.(el) ?? el.getAttribute(bindType);
}

export function setElementValue(el, bindType, value) {
    (valueSetters.get(bindType) || ((el, value) => el.setAttribute(bindType, value ?? "")))(el, value);
}

function updateClasses(el, value) {
    if (isString(value)) el.className = value;
    else if (isArray(value)) el.className = value.join(' ');
    else if (isObject(value)) {
        for (const [className, condition] of Object.entries(value)) {
            if (className.includes(' ')) {
                className.split(' ').forEach(singleClass => { // For multiple classes, we divide and apply individually.
                    el.classList.toggle(singleClass.trim(), !!condition);
                });
            } else el.classList.toggle(className, !!condition);
        }
    }
}

function updateStyles(el, value) {
    if (isString(value))
        el.style.cssText = value;
    else if (isObject(value))
        Object.assign(el.style, value);
}

// function handleTwoWayBindingInputUpdate(el, bindExpression, event) {
//     const newValue = getTargetValue(el, event);
//     const defElement = el.closest('[a-def]');
//     if (!defElement) return;

//     const data = getData(defElement);
//     if (data) {
//         const updatedData = { ...data, [bindExpression]: newValue };
//         setData(defElement, updatedData);
//         updateData(defElement);
//     }
// }

function handleTwoWayBindingInputUpdate(el, bindExpression, event) {
    const newValue = getTargetValue(el, event);
    const defElement = el.closest("[a-def]");
    if (!defElement) return;
    const data = getData(defElement);
    if (data) {
        // setData(defElement, updatedData);
        updateData(defElement, { [bindExpression]: newValue });
    }
}


function getTargetValue(el, event) {
    if (el.tagName === 'SELECT' && el.multiple)
        return Array.from(el.selectedOptions).map(option => option.value);
    else if (el.type === 'date' || el.type === 'datetime-local')
        return el.valueAsDate;
    else if (el.type === 'checkbox')
        return event.target.checked;
    else if (el.type === 'file')
        return el.multiple ? Array.from(el.files) : el.files[0];
    else
        return event.target.value;
}

function updateSelectSelected(el, value) {
    const options = Array.from(el.options);
    if (isArray(value))
        options.forEach(option => option.selected = value.includes(option.value));
    else {
        const toSelect = options.find(option => option.value == value);
        if (toSelect) {
            toSelect.selected = true;
            el.value = toSelect.value;
        }
    }
}

function updateMultipleSelect(el, value) {
    if (!isArray(value)) value = [value];
    Array.from(el.options).forEach(option => option.selected = value.includes(option.value));
}

export function setupInputEvent(el, bindExpression ) {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
        const eventType = (el.type === 'checkbox' || el.type === 'radio' || el.type === 'file') ? 'change' : 'input';
        return listen(el, eventType, (event) => handleTwoWayBindingInputUpdate(el, bindExpression, event));
    }

    return null;
}