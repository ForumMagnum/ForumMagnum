// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import { Tabs as RadixTabs } from "radix-ui";

export const TTDDialogTab = ({
  tab,
  children,
  ...rest
}: {
  tab: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <RadixTabs.Content {...rest} value={tab}>
      {children}
    </RadixTabs.Content>
  );
};
TTDDialogTab.displayName = "TTDDialogTab";
