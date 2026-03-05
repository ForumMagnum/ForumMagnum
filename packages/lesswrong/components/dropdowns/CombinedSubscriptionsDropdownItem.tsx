import React from "react";
import { NotifyMeDropdownItem, type NotifyMeDropdownItemProps } from "./NotifyMeDropdownItem";
import { NotifyMeToggleDropdownItemPropsExternal } from "./NotifyMeToggleDropdownItem";

/**
 * On friendly sites, this is a single menu item that opens a submenu with subscription options.
 * On other sites, the subscription options are individual menu items.
 */
export const CombinedSubscriptionsDropdownItem = ({notifyMeItems}: {
  notifyMeItems: Array<NotifyMeDropdownItemProps & NotifyMeToggleDropdownItemPropsExternal>,
}) => {
  return <>
    {notifyMeItems.map((props) =>
      <NotifyMeDropdownItem {...props} key={props.subscriptionType} />
    )}
  </>
}
