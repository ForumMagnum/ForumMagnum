interface CollapsibleProps {
    label: React.ReactNode;
    open: boolean;
    openTrigger: () => void;
    children: React.ReactNode;
    className?: string;
    showCollapsedIcon?: boolean;
}
declare const Collapsible: ({ label, open, openTrigger, children, className, showCollapsedIcon, }: CollapsibleProps) => import("react/jsx-runtime").JSX.Element;
export default Collapsible;
