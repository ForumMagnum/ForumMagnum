type Props<T> = {
    value: T;
    shortcut?: string;
    choices: {
        value: T;
        label: React.ReactNode;
        ariaLabel?: string;
    }[];
    onChange: (value: T) => void;
    children: React.ReactNode;
    name: string;
    icon?: React.ReactNode;
};
declare const DropdownMenuItemContentRadio: {
    <T>({ value, shortcut, onChange, choices, children, name, icon, }: Props<T>): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export default DropdownMenuItemContentRadio;
