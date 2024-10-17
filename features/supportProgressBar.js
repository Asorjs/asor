import { getMetaContent } from "../utils/dom";

export class PBar {
    static DEFAULT_OPTIONS = {
        color: "#29d",
        height: "3px",
        duration: 300,
        delay: 300,
        zIndex: 14062024,
        className: "asor-progress-bar"
    };

    constructor(options = {}) {
        this.options = { ...PBar.DEFAULT_OPTIONS, ...options };
        this.bar = null;
        this.visible = false;
        this.timeout = null;
        this.value = 0;
        this.trickleInterval = null;
    }

    show() {
        if (this.visible) return;

        this.visible = true;
        this.value = 0;
        clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
            this.createBar();
            this.trickle();
        }, this.options.delay);
    }

    hide() {
        if (!this.visible) return;

        clearTimeout(this.timeout);
        clearInterval(this.trickleInterval);

        this.visible = false;
        this.setValue(100);

        this.timeout = setTimeout(() => {
            this.removeBar();
            this.value = 0;
        }, this.options.duration);
    }

    setValue(value) {
        this.value = Math.min(100, Math.max(0, value));
        if (this.bar) {
            this.bar.style.width = `${this.value}%`;
            this.updateARIA();
        }
    }

    trickle() {
        clearInterval(this.trickleInterval);
        this.trickleInterval = setInterval(() => {
            const remainingProgress = 100 - this.value;
            const increment = 0.02 * Math.pow(1 - Math.sqrt(remainingProgress), 2);
            this.setValue(this.value + increment);
        }, 100);
    }

    createBar() {
        if (this.bar) return;

        this.bar = document.createElement("div");
        this.bar.className = this.options.className;
        this.bar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0;
            height: ${this.options.height};
            background-color: ${this.options.color};
            z-index: ${this.options.zIndex};
            transition: width ${this.options.duration}ms ease-out;
            box-shadow: 0 0 10px ${this.options.color}, 0 0 5px ${this.options.color};
            pointer-events: none;
        `;

        this.setAccessibility();
        document.body.appendChild(this.bar);
    }

    removeBar() {
        if (this.bar && this.bar.parentNode) {
            this.bar.parentNode.removeChild(this.bar);
            this.bar = null;
        }
    }

    setAccessibility() {
        if (!this.bar) return;
        this.bar.setAttribute("role", "progressbar");
        this.bar.setAttribute("aria-valuemin", "0");
        this.bar.setAttribute("aria-valuemax", "100");
        this.updateARIA();
    }

    updateARIA() {
        if (!this.bar) return;
        this.bar.setAttribute("aria-valuenow", Math.round(this.value));
        this.bar.setAttribute("aria-label", `Progress: ${Math.round(this.value)}%`);
    }

    static injectStyles() {
        const style = document.createElement("style");
        style.textContent = `
            @keyframes asor-progress-bar-pulse {
                0% { box-shadow: 0 0 10px ${PBar.DEFAULT_OPTIONS.color}, 0 0 5px ${PBar.DEFAULT_OPTIONS.color}; }
                50% { box-shadow: 0 0 20px ${PBar.DEFAULT_OPTIONS.color}, 0 0 10px ${PBar.DEFAULT_OPTIONS.color}; }
                100% { box-shadow: 0 0 10px ${PBar.DEFAULT_OPTIONS.color}, 0 0 5px ${PBar.DEFAULT_OPTIONS.color}; }
            }
            .${PBar.DEFAULT_OPTIONS.className} {
                animation: asor-progress-bar-pulse 1.5s infinite ease-in-out;
            }
        `;

        const cspNonce = getMetaContent("csp-nonce");
        if (cspNonce) style.nonce = cspNonce;

        document.head.appendChild(style);
    }
}

PBar.injectStyles(); // Inject styles when the module is imported