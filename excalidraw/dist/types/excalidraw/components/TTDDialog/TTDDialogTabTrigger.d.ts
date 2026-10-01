export declare const TTDDialogTabTrigger: {
    ({ children, tab, onSelect, ...rest }: {
        children: React.ReactNode;
        tab: string;
        onSelect?: React.ReactEventHandler<HTMLButtonElement> | undefined;
    } & Omit<React.HTMLAttributes<HTMLButtonElement>, "onSelect">): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
