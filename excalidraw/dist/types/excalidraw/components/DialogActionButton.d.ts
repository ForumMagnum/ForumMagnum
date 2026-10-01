import "./DialogActionButton.scss";
import type { ReactNode } from "react";
interface DialogActionButtonProps {
    label: string;
    children?: ReactNode;
    actionType?: "primary" | "danger";
    isLoading?: boolean;
}
declare const DialogActionButton: ({ label, onClick, className, children, actionType, type, isLoading, ...rest }: DialogActionButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) => import("react/jsx-runtime").JSX.Element;
export default DialogActionButton;
