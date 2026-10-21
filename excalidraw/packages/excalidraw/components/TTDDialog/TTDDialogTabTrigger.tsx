// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import { Tabs as RadixTabs } from "radix-ui";

export const TTDDialogTabTrigger = ({
  children,
  tab,
  onSelect,
  ...rest
}: {
  children: React.ReactNode;
  tab: string;
  onSelect?: React.ReactEventHandler<HTMLButtonElement> | undefined;
} & Omit<React.HTMLAttributes<HTMLButtonElement>, "onSelect">) => {
  return (
    <RadixTabs.Trigger value={tab} asChild onSelect={onSelect}>
      <button type="button" className="ttd-dialog-tab-trigger" {...rest}>
        {children}
      </button>
    </RadixTabs.Trigger>
  );
};
TTDDialogTabTrigger.displayName = "TTDDialogTabTrigger";
