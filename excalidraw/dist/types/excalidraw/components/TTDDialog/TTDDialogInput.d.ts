interface TTDDialogInputProps {
    input: string;
    placeholder: string;
    onChange: (value: string) => void;
    onKeyboardSubmit?: () => void;
    errorLine?: number | null;
}
export declare const TTDDialogInput: ({ input, placeholder, onChange, onKeyboardSubmit, errorLine, }: TTDDialogInputProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
