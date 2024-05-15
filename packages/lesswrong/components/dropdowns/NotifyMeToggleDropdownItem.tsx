import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { NotifyMeDocument, useNotifyMe } from "../hooks/useNotifyMe";
import { useOptimisticToggle } from "../hooks/useOptimisticToggle";
import type { SubscriptionType } from "../../lib/collections/subscriptions/schema";

type NotifyMeToggleDropdownItemInternalProps = {
  document: NotifyMeDocument,
  title: string,
  enabled?: boolean,
  subscriptionType: SubscriptionType,
  classes: ClassesType,
}

type NotifyMeToggleDropdownItemProps = {
  document?: NotifyMeDocument | null,
} & Omit<NotifyMeToggleDropdownItemInternalProps, "document">;

export type NotifyMeToggleDropdownItemPropsExternal = Omit<NotifyMeToggleDropdownItemProps, "classes">;


const styles = (_theme: ThemeType) => ({
  toggle: {
    marginLeft: 12,
  },
});

export const NotifyMeToggleDropdownItemInternal = ({
  document,
  title,
  subscriptionType,
  classes,
}: NotifyMeToggleDropdownItemInternalProps) => {
  const {isSubscribed, onSubscribe, loading, disabled } = useNotifyMe({
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
    () => <ToggleSwitch value={subscribed} className={classes.toggle} smallVersion />,
    [subscribed, ToggleSwitch, classes.toggle],
  );

  return (
    <DropdownItem
      title={title}
      onClick={toggleSubscribed}
      afterIcon={afterIcon}
      loading={loading}
      disabled={disabled}
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
