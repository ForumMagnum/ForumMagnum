import type { History } from "../history";
import type { Action } from "./types";
type ActionCreator = (history: History) => Action;
export declare const createUndoAction: ActionCreator;
export declare const createRedoAction: ActionCreator;
export {};
