// import { start, stop } from "./root";
// import { directive, getDirectives } from "./directives";
// import { dispatchGlobal, dispatchSelf, on } from "./utils/events";
// import { onDataChange } from "./features/supportSubscribers";
// import { evaluateInContext as evaluate} from "./features/supportEvaluateExpression";
// import { handleStore as store } from "./features/supportStore";
// import { registerComponent as component } from "./features/supportComponents";
// import { mount } from "./directives";
// import { handleError  as error, warn } from "./utils/logger";
// import { debounce } from "./utils/debounce";
// import { throttle } from "./utils/throttle";
// import { updateDOM } from "./features/supportUpdateDom";
// import "./directives/index";

// const Asor = {
//     on,
//     stop,
//     warn,
//     error,
//     store,
//     start,
//     mount,
//     debounce,
//     throttle,
//     evaluate,
//     directive,
//     component,
//     updateDOM,
//     onDataChange,
//     dispatchSelf,
//     getDirectives,
//     dispatchGlobal,
// };

// export default Asor;

import { start, stop } from "./root";
import { directive, getDirectives } from "./directives";
import { dispatchGlobal, dispatchSelf, on } from "./utils/events";
import { onDataChange } from "./features/supportSubscribers";
import { evaluateInContext as evaluate} from "./features/supportEvaluateExpression";
import { handleStore as store } from "./features/supportStore";
import { registerComponent as component } from "./features/supportComponents";
import { mount } from "./directives";
import { handleError  as error, warn } from "./utils/logger";
import { debounce } from "./utils/debounce";
import { throttle } from "./utils/throttle";
import { updateDOM } from "./features/supportUpdateDom";
import "./directives/index";

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