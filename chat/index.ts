// Import with proper typing
import * as api from "./lib";
import * as utils from "./utils";
import * as types from "./types";
import * as constants from "./constants";
import * as components from "./components";
import * as hooks from "./hooks";

// Create a properly typed Chat module
export const Chat = {
    api,
    utils,
    types,
    constants,
    components,
    hooks,
} as const;

export {
    components as ChatComponents,
}

// Export types for the Chat module itself
export type ChatModule = typeof Chat;