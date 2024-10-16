import { start, stop } from "./root.js";
import { directive } from "./directives.js";
import { dispatchGlobal, dispatchSelf, on } from "./utils/events.js";
import { onDataChange } from "./features/supportSubscribers.js";
import { evaluateInContext as evaluate} from "./features/supportEvaluateExpression.js";
import { handleStore as store } from "./features/supportStore.js";
import { registerComponent as component } from "./features/supportComponents.js";
import { mount } from "./directives.js";
import { handleError  as error, warn } from "./utils/logger.js";
import "./directives/index.js";

const Asor = {
    on,
    stop,
    warn,
    error,
    store,
    start,
    mount,
    evaluate,
    directive,
    component,
    onDataChange,
    dispatchSelf,
    dispatchGlobal,
};

export default Asor;