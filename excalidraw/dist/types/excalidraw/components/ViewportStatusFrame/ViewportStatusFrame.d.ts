import "./ViewportStatusFrame.scss";
import type { CSSProperties } from "react";
import type { ViewportStatusFrame as ViewportStatusFrameType } from "../../types";
export declare const ViewportStatusBorder: ({ border, style, }: {
    border: string;
    style?: CSSProperties;
}) => import("react/jsx-runtime").JSX.Element;
export declare const ViewportStatusBadge: ({ label, border, }: {
    label: NonNullable<ViewportStatusFrameType["label"]>;
    border?: ViewportStatusFrameType["border"];
}) => import("react/jsx-runtime").JSX.Element;
