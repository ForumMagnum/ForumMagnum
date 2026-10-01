/**
 * "drag to pin" hint shown in a picker popup whose top picks are
 * customizable — with a reset link while the picks are customized
 */
export declare const TopPicksTip: ({ className, tip, onReset, resetTitle, }: {
    className?: string;
    tip: string;
    /** present only while the top picks are customized */
    onReset?: () => void;
    resetTitle: string;
}) => import("react/jsx-runtime").JSX.Element;
