import React from "react";
import type { PointerType } from "../../element/src/types";
import "./ToolIcon.scss";
import type { CSSProperties } from "react";
export type IconButtonSize = "small" | "medium";
type IconButtonBaseProps = {
    icon?: React.ReactNode;
    "aria-label": string;
    "aria-keyshortcuts"?: string;
    "data-testid"?: string;
    label?: string;
    title?: string;
    size?: IconButtonSize;
    keyBindingLabel?: string | null;
    showAriaLabel?: boolean;
    hidden?: boolean;
    visible?: boolean;
    disabled?: boolean;
    className?: string;
    style?: CSSProperties;
    isLoading?: boolean;
};
type IconButtonProps = (IconButtonBaseProps & {
    type: "button";
    children?: React.ReactNode;
    onClick?(event: React.MouseEvent): void;
}) | (IconButtonBaseProps & {
    type: "icon";
    children?: React.ReactNode;
    onClick?(): void;
}) | (IconButtonBaseProps & {
    type: "toggle";
    checked: boolean;
    /**
     * Fired on activation — a completed pointer gesture (via `click`, so a
     * press canceled by sliding off the button doesn't select) or
     * keyboard/AT activation, in which case pointerType is null.
     * pointerType is captured on pointer-down, where it's reliable
     * (unlike the click event's own pointerType on iOS).
     */
    onSelect?(data: {
        pointerType: PointerType | null;
    }): void;
    /** the press that may become a click — e.g. to arm a drag out of the toolbar */
    onPointerDown?(event: React.PointerEvent<HTMLButtonElement>): void;
});
export declare const IconButton: React.ForwardRefExoticComponent<IconButtonProps & React.RefAttributes<unknown>>;
export {};
