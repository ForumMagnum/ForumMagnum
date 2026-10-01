declare const DropdownMenuSub: {
    ({ children }: {
        children?: React.ReactNode;
    }): import("react/jsx-runtime").JSX.Element;
    Trigger: {
        ({ children, icon, shortcut, className, }: {
            children: React.ReactNode;
            icon?: import("react").JSX.Element;
            shortcut?: string;
            className?: string;
        }): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    Content: {
        ({ children, className, }: {
            children?: React.ReactNode;
            className?: string;
        }): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    displayName: string;
};
export default DropdownMenuSub;
