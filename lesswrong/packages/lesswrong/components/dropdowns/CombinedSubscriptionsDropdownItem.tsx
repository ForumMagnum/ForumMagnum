import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { isFriendlyUI } from "../../themes/forumTheme";
import Card from "@material-ui/core/Card";
import { NotifyMeDropdownItemProps } from "./NotifyMeDropdownItem";
import { NotifyMeToggleDropdownItemPropsExternal } from "./NotifyMeToggleDropdownItem";
import LWTooltip from "@/components/common/LWTooltip";
import DropdownMenu from "@/components/dropdowns/DropdownMenu";
import DropdownItem from "@/components/dropdowns/DropdownItem";
import NotifyMeDropdownItem from "@/components/dropdowns/NotifyMeDropdownItem";
import NotifyMeToggleDropdownItem from "@/components/dropdowns/NotifyMeToggleDropdownItem";

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
export const CombinedSubscriptionsDropdownItem = ({notifyMeItems, classes}: {
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

const CombinedSubscriptionsDropdownItemComponent = registerComponent(
  "CombinedSubscriptionsDropdownItem",
  CombinedSubscriptionsDropdownItem,
  {styles},
);

declare global {
  interface ComponentTypes {
    CombinedSubscriptionsDropdownItem: typeof CombinedSubscriptionsDropdownItemComponent
  }
}

export default CombinedSubscriptionsDropdownItemComponent;
