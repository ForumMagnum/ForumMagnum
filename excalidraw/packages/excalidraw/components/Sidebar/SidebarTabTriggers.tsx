// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import { Tabs as RadixTabs } from "radix-ui";

export const SidebarTabTriggers = ({
  children,
  ...rest
}: { children: React.ReactNode } & Omit<
  React.RefAttributes<HTMLDivElement>,
  "onSelect"
>) => {
  return (
    <RadixTabs.List className="sidebar-triggers" {...rest}>
      {children}
    </RadixTabs.List>
  );
};
SidebarTabTriggers.displayName = "SidebarTabTriggers";
