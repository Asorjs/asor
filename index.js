import { start, stop } from "./root.js";
import { directive } from "./directives.js";
import { dispatchGlobal, dispatchSelf, on } from "./utils/events.js";
import { onDataChange } from "./features/supportSubscribers.js";
import { evaluateInContext as evaluate} from "./features/supportEvaluateExpression.js";
import { handleStore as store } from "./features/supportStore.js";
import "./directives/index.js";

const Asor = {
    on,
    stop,
    store,
    start,
    evaluate,
    directive,
    onDataChange,
    dispatchSelf,
    dispatchGlobal,
};

export default Asor;