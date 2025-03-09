import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { NotifyMeDocument, useNotifyMe } from "../hooks/useNotifyMe";
import { useOptimisticToggle } from "../hooks/useOptimisticToggle";
import type { SubscriptionType } from "../../lib/collections/subscriptions/helpers";
import Checkbox from "@material-ui/core/Checkbox";

type NotifyMeToggleDropdownItemInternalProps = {
  document: NotifyMeDocument,
  title: string,
  enabled?: boolean,
  subscriptionType: SubscriptionType,
  useCheckboxIcon?: boolean,
  classes: ClassesType<typeof styles>,
}

type NotifyMeToggleDropdownItemProps = {
  document?: NotifyMeDocument | null,
} & Omit<NotifyMeToggleDropdownItemInternalProps, "document">;

export type NotifyMeToggleDropdownItemPropsExternal = Omit<NotifyMeToggleDropdownItemProps, "classes">;


const styles = (_theme: ThemeType) => ({
  toggle: {
    marginLeft: 12,
  },
  menuItemCheckbox: {
    paddingRight: 8
  }
});

export const NotifyMeToggleDropdownItemInternal = ({
  document,
  title,
  subscriptionType,
  useCheckboxIcon,
  classes,
}: NotifyMeToggleDropdownItemInternalProps) => {
  const {isSubscribed, onSubscribe, disabled} = useNotifyMe({
    document,
    overrideSubscriptionType: subscriptionType,
    hideFlashes: true,
  });
  const [subscribed, toggleSubscribed] = useOptimisticToggle(
    isSubscribed ?? false,
    onSubscribe ?? (() => {}),
  );

  const {DropdownItem, ToggleSwitch} = Components;

  const afterIcon = useCallback(
    () => {
      if (useCheckboxIcon) {
        return <Checkbox checked={subscribed} />
      } 

      return <ToggleSwitch value={subscribed} className={classes.toggle} smallVersion />
    },
    [subscribed, useCheckboxIcon, ToggleSwitch, classes.toggle],
  );

  return (
    <DropdownItem
      title={title}
      onClick={toggleSubscribed}
      afterIcon={afterIcon}
      disabled={disabled}
      menuItemClassName={useCheckboxIcon ? classes.menuItemCheckbox : undefined}
    />
  );
}

export const NotifyMeToggleDropdownItem = (
  props: NotifyMeToggleDropdownItemProps,
) => {
  if (!(props.enabled ?? true) || !props.document) {
    return null;
  }
  return (
    <NotifyMeToggleDropdownItemInternal
      {...props as NotifyMeToggleDropdownItemInternalProps}
    />
  );
}

const NotifyMeToggleDropdownItemComponent = registerComponent(
  "NotifyMeToggleDropdownItem",
  NotifyMeToggleDropdownItem,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotifyMeToggleDropdownItem: typeof NotifyMeToggleDropdownItemComponent
  }
}
