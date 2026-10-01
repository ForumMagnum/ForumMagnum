import type { Emitter } from "../../common/src/index";
export declare const useEmitter: <TEvent extends unknown>(emitter: Emitter<[TEvent]>, initialState: TEvent) => TEvent;
