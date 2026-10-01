export declare class Debug {
    static DEBUG_LOG_TIMES: boolean;
    private static TIMES_AGGR;
    private static TIMES_AVG;
    private static LAST_DEBUG_LOG_CALL;
    private static DEBUG_LOG_INTERVAL_ID;
    private static LAST_FRAME_TIMESTAMP;
    private static FRAME_COUNT;
    private static ANIMATION_FRAME_ID;
    private static scheduleAnimationFrame;
    private static setupInterval;
    private static debugLogger;
    static logTime: (time?: number, name?: string) => void;
    static logTimeAverage: (time?: number, name?: string) => void;
    private static logWrapper;
    static logTimeWrap: <T extends any[], R>(fn: (...args: T) => R, name?: string) => (...args: T) => R;
    static logTimeAverageWrap: <T extends any[], R>(fn: (...args: T) => R, name?: string) => (...args: T) => R;
    static perfWrap: <T extends any[], R>(fn: (...args: T) => R, name?: string) => (...args: T) => R;
    private static CHANGED_CACHE;
    static logChanged(name: string, obj: Record<string, unknown>): void;
}
