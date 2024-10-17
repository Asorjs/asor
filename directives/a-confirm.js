import { directive } from "../directives";
import { handleError } from "../utils/logger";

directive("confirm", ({ el, directive }) => {
    let message = directive.expression;
    let shouldPrompt = directive.hasModifier("prompt");

    message = message.replaceAll("\\n", "\n");     // Convert sanitized ("sanitized") line breaks to actual line breaks
    if (message === "") message = "Are you sure?";

    const handle = (isConfirmed, action, instead) => {
        if (isConfirmed) action();
        else instead();
    };

    el.__confirm_action = (confirmAction, alternativeAction) => {
        if (shouldPrompt) {
            const [question, expected] = message.split("|");

            if (!expected) handleError("Directives: You must provide an expectation with @confirm.prompt.");

            const userInput = prompt(question);
            handle(userInput === expected, confirmAction, alternativeAction);
        } else handle(confirm(message), confirmAction, alternativeAction);
    };
});
