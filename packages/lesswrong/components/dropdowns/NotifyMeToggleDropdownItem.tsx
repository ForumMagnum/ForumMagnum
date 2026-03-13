import React, { useCallback } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { NotifyMeDocument, useNotifyMe } from "../hooks/useNotifyMe";
import { useOptimisticToggle } from "../hooks/useOptimisticToggle";
import type { SubscriptionType } from "../../lib/collections/subscriptions/helpers";
import Checkbox from "@/lib/vendor/@material-ui/core/src/Checkbox";
import DropdownItem from "./DropdownItem";
import ToggleSwitch from "../common/ToggleSwitch";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from "../hooks/useStyles";

type NotifyMeToggleDropdownItemInternalProps = {
  document: NotifyMeDocument,
  title: string,
  enabled?: boolean,
  subscriptionType: SubscriptionType,
  useCheckboxIcon?: boolean,
}

export type NotifyMeToggleDropdownItemProps = {
  document?: NotifyMeDocument | null,
} & Omit<NotifyMeToggleDropdownItemInternalProps, "document">;

const styles = defineStyles("NotifyMeToggleDropdownItem", (_theme: ThemeType) => ({
  toggle: {
    marginLeft: 12,
  },
  menuItemCheckbox: {
    paddingRight: 8
  }
}));

export const NotifyMeToggleDropdownItemInternal = ({
  document,
  title,
  subscriptionType,
  useCheckboxIcon,
}: NotifyMeToggleDropdownItemInternalProps) => {
  const classes = useStyles(styles);
  const {isSubscribed, onSubscribe, disabled} = useNotifyMe({
    document,
    overrideSubscriptionType: subscriptionType,
    hideFlashes: true,
  });
  const [subscribed, toggleSubscribed] = useOptimisticToggle(
    isSubscribed ?? false,
    onSubscribe ?? (() => {}),
  );
  const afterIcon = useCallback(
    () => {
      if (useCheckboxIcon) {
        return <Checkbox checked={subscribed} />
      } 

      return <ToggleSwitch value={subscribed} className={classes.toggle} smallVersion />
    },
    [subscribed, useCheckboxIcon, classes.toggle],
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

export const NotifyMeToggleDropdownItem = (props: NotifyMeToggleDropdownItemProps) => {
  if (!(props.enabled ?? true) || !props.document) {
    return null;
  }
  return (
    <NotifyMeToggleDropdownItemInternal
      {...props as NotifyMeToggleDropdownItemInternalProps}
    />
  );
}

export default NotifyMeToggleDropdownItem;


