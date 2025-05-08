import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { isFriendlyUI } from "../../themes/forumTheme";
import { Card } from "@/components/widgets/Paper";
import { NotifyMeDropdownItemProps, NotifyMeDropdownItem } from "./NotifyMeDropdownItem";
import { NotifyMeToggleDropdownItemPropsExternal, NotifyMeToggleDropdownItem } from "./NotifyMeToggleDropdownItem";
import { LWTooltip } from "../common/LWTooltip";
import { DropdownMenu } from "./DropdownMenu";
import { DropdownItem } from "./DropdownItem";

const styles = (_theme: ThemeType) => ({
  dropdownWrapper: {
    padding: "0 14px 0 10px",
    transform: "translateX(2px) translateY(-6px)",
  },
});

/**
 * On friendly sites, this is a single menu item that opens a submenu with subscription options.
 * On other sites, the subscription options are individual menu items.
 */
export const CombinedSubscriptionsDropdownItemInner = ({notifyMeItems, classes}: {
  notifyMeItems: Array<NotifyMeDropdownItemProps & NotifyMeToggleDropdownItemPropsExternal>,
  classes: ClassesType<typeof styles>,
}) => {
  return isFriendlyUI
    ? (
      <LWTooltip
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
    )
    : (
      <>
        {notifyMeItems.map((props) =>
          <NotifyMeDropdownItem {...props} key={props.subscriptionType} />
        )}
      </>
    );
}

export const CombinedSubscriptionsDropdownItem = registerComponent(
  "CombinedSubscriptionsDropdownItem",
  CombinedSubscriptionsDropdownItemInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    CombinedSubscriptionsDropdownItem: typeof CombinedSubscriptionsDropdownItem
  }
}
