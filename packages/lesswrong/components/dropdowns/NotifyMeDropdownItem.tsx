import React, { FC } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { NotifyMeDocument, useNotifyMe } from "../hooks/useNotifyMe";
import type { SubscriptionType } from "../../lib/collections/subscriptions/helpers";

type NotifyMeDropdownItemInternalProps = {
  document: NotifyMeDocument,
  enabled?: boolean,
  subscribeMessage: string,
  unsubscribeMessage: string,
  subscriptionType?: SubscriptionType,
  tooltip?: string,
}

export type NotifyMeDropdownItemProps = {
  document?: NotifyMeDocument | null,
} & Omit<NotifyMeDropdownItemInternalProps, "document">;

const NotifyMeDropdownItemInternal: FC<NotifyMeDropdownItemInternalProps> = ({
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
    ? <NotifyMeDropdownItemInternal
      {...props as NotifyMeDropdownItemInternalProps}
    />
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
