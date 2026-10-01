export type Animation<R extends object> = (params: {
    deltaTime: number;
    state?: R;
}) => R | null | undefined;
export declare class AnimationController {
    private static scheduledFrame;
    private static animations;
    static start<R extends object>(key: string, animation: Animation<R>): void;
    private static scheduleNextFrame;
    private static cancelScheduledFrame;
    private static cancelScheduledFrameIfIdle;
    private static tick;
    static running(key: string): boolean;
    static cancel(key: string): void;
    static reset(): void;
}
