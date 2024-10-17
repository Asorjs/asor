import { getDirectiveValue } from "../directives";
import { handleError } from "../utils/logger";

export function collectData(el) {
    return new DataCollection(el);
}

class DataCollection {
    constructor(el) {
        this.formData = new FormData();
        this.hasFile = false;
        this.errors = [];

        if (el.tagName === "FORM") this.serializeForm(el);
        else this.collectElementData(el);

        this.addDirectiveData(el);
    }

    collectElementData(el) {
        const handler = this.elementHandlers[el.tagName];
        if (handler) handler.call(this, el);
    }

    elementHandlers = {
        SELECT: this.handleSelect,
        TEXTAREA: this.handleTextArea,
        INPUT: this.handleInput,
        BUTTON: this.handleButton
    };

    handleSelect(select) {
        if (select.multiple)
            Array.from(select.selectedOptions).forEach(option => {
                this.formData.append(select.name, option.value);
            });
        else this.formData.append(select.name, select.value);
    }

    handleTextArea(textarea) {
        this.formData.append(textarea.name, textarea.value);
    }

    handleInput(input) {
        const handlers = {
            checkbox: () => this.formData.append(input.name, input.checked),
            radio: () => { 
                if (input.checked) this.formData.append(input.name, input.value);
            },
            file: () => {
                if (input.files.length > 0) {
                    Array.from(input.files).forEach(file => {
                        this.formData.append(input.name, file);
                    });
                    this.hasFile = true;
                }
            },
            date: () => {
                const date = new Date(input.value);
                if (!isNaN(date.getTime())) this.formData.append(input.name, date.toISOString());
            },
            number: () => {
                const num = parseFloat(input.value);
                if (!isNaN(num)) this.formData.append(input.name, num);
            },
            default: () => this.formData.append(input.name, input.value)
        };

        (handlers[input.type] || handlers.default)();
    }

    handleButton(button) {
        if (button.name && (button.type === 'submit' || button.type === 'button'))
            this.formData.append(button.name, button.value || button.textContent);
    }

    addDirectiveData(el) {
        const dataDirective = getDirectiveValue(el, "data");
        if (dataDirective)
            this.formData.append(dataDirective.value, dataDirective.expression);

        const addDirective = getDirectiveValue(el, "add");
        if (addDirective)
            try {
                const addData = JSON.parse(addDirective.expression);
                Object.entries(addData).forEach(([key, value]) => {
                    this.formData.append(key, value);
                });
            } catch (error) {
                handleError("Error parsing add directive:", error);
            }
    }

    serializeForm(form) {
        this.formData = new FormData(form);
        this.hasFile = Array.from(this.formData.values()).some(value => value instanceof File);
    }

    toObject() {
        const obj = {};
        for (let [key, value] of this.formData.entries()) {
            if (obj[key]) {
                if (!Array.isArray(obj[key]))
                    obj[key] = [obj[key]];
                obj[key].push(value);
            } else obj[key] = value;
        }
        return obj;
    }

    toJSON() {
        return JSON.stringify(this.toObject());
    }

    get() {
        return this.formData;
    }

    hasFiles() {
        return this.hasFile;
    }

    getErrors() {
        return this.errors;
    }
}