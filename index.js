import { start, stop } from "./root.js";
import { directive, getDirectives } from "./directives.js";
import { dispatchGlobal, dispatchSelf, on } from "./utils/events.js";
import { onDataChange } from "./features/supportSubscribers.js";
import { evaluateInContext as evaluate} from "./features/supportEvaluateExpression.js";
import { handleStore as store } from "./features/supportStore.js";
import { registerComponent as component } from "./features/supportComponents.js";
import { mount } from "./directives.js";
import { handleError  as error, warn } from "./utils/logger.js";
import { debounce } from "./utils/debounce.js";
import { throttle } from "./utils/throttle.js";
import { updateDOM } from "./features/supportUpdateDom.js";

import "./directives/index.js";

const Asor = {
    on,
    stop,
    warn,
    error,
    store,
    start,
    mount,
    debounce,
    throttle,
    evaluate,
    directive,
    component,
    updateDOM,
    onDataChange,
    dispatchSelf,
    getDirectives,
    dispatchGlobal,
};

export default Asor;