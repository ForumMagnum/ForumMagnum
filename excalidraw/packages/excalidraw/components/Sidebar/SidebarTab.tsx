// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import { Tabs as RadixTabs } from "radix-ui";

import type { SidebarTabName } from "../../types";

export const SidebarTab = ({
  tab,
  children,
  ...rest
}: {
  tab: SidebarTabName;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <RadixTabs.Content {...rest} value={tab} data-testid={tab}>
      {children}
    </RadixTabs.Content>
  );
};
SidebarTab.displayName = "SidebarTab";
