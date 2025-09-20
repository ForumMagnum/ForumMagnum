import React from "react";
import { isFriendlyUI } from "../../themes/forumTheme";
import { Card } from "@/components/widgets/Paper";
import { NotifyMeDropdownItem, type NotifyMeDropdownItemProps } from "./NotifyMeDropdownItem";
import NotifyMeToggleDropdownItem, { NotifyMeToggleDropdownItemPropsExternal } from "./NotifyMeToggleDropdownItem";
import LWTooltip from "../common/LWTooltip";
import DropdownMenu from "./DropdownMenu";
import DropdownItem from "./DropdownItem";
import { defineStyles, useStyles } from "../hooks/useStyles";

const styles = defineStyles("CombinedSubscriptionsDropdownItem", (_theme: ThemeType) => ({
  dropdownWrapper: {
    padding: "0 14px 0 10px",
    transform: "translateX(2px) translateY(-6px)",
  },
}));

/**
 * On friendly sites, this is a single menu item that opens a submenu with subscription options.
 * On other sites, the subscription options are individual menu items.
 */
export const CombinedSubscriptionsDropdownItem = ({notifyMeItems}: {
  notifyMeItems: Array<NotifyMeDropdownItemProps & NotifyMeToggleDropdownItemPropsExternal>,
}) => {
  const classes = useStyles(styles);
  if (isFriendlyUI()) {
    return <LWTooltip
      title={
        <div className={classes.dropdownWrapper}>
          <Card>
            <DropdownMenu>
              {notifyMeItems.map((props) =>
                <NotifyMeToggleDropdownItem
                  key={props.subscriptionType}
                  {...props}
                />
              )}
            </DropdownMenu>
          </Card>
        </div>
      }
      clickable
      tooltip={false}
      inlineBlock={false}
      placement="right-start"
    >
      <DropdownItem
        title="Get notified"
        icon="BellBorder"
        afterIcon="ThickChevronRight"
      />
    </LWTooltip>
  } else {
    return <>
      {notifyMeItems.map((props) =>
        <NotifyMeDropdownItem {...props} key={props.subscriptionType} />
      )}
    </>
  };
}
