import React, { FC } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useNotifyMe } from "../hooks/useNotifyMe";
import type { SubscriptionType } from "../../lib/collections/subscriptions/schema";

export type NotifyMeDropdownItemProps = {
  document: AnyBecauseTodo,
  enabled?: boolean,
  subscribeMessage: string,
  unsubscribeMessage: string,
  subscriptionType?: SubscriptionType,
  tooltip?: string,
}

const NotifyMeDropdownItemInternal: FC<NotifyMeDropdownItemProps> = ({
  document,
  subscribeMessage,
  unsubscribeMessage,
  subscriptionType,
  tooltip,
}) => {
  const {loading, disabled, isSubscribed, onSubscribe} = useNotifyMe({
    document,
    overrideSubscriptionType: subscriptionType,
  });
  if (disabled) {
    return null;
  }

  const message = isSubscribed ? unsubscribeMessage : subscribeMessage;

  const {DropdownItem} = Components;
  return (
    <DropdownItem
      title={message}
      onClick={onSubscribe}
      icon={isSubscribed ? "Bell" : "BellBorder"}
      loading={loading}
      tooltip={tooltip}
    />
  );
}

const NotifyMeDropdownItem = (props: NotifyMeDropdownItemProps) =>
  props.document && (props.enabled ?? true)
    ? <NotifyMeDropdownItemInternal {...props} />
    : null;

const NotifyMeDropdownItemComponent = registerComponent(
  "NotifyMeDropdownItem",
  NotifyMeDropdownItem,
);

declare global {
  interface ComponentTypes {
    NotifyMeDropdownItem: typeof NotifyMeDropdownItemComponent
  }
}
