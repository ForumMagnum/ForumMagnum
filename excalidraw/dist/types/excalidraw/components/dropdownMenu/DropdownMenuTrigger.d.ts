declare const MenuTrigger: {
    ({ className, children, onToggle, title, ...rest }: {
        className?: string;
        children: React.ReactNode;
        onToggle: () => void;
        title?: string;
    } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect">): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export default MenuTrigger;
