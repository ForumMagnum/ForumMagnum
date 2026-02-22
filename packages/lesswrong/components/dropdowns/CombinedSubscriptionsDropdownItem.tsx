import { defineStyles, useStyles } from "../hooks/useStyles";
import { NotifyMeDropdownItem, type NotifyMeDropdownItemProps } from "./NotifyMeDropdownItem";
import { NotifyMeToggleDropdownItemPropsExternal } from "./NotifyMeToggleDropdownItem";

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
  return <>
          {notifyMeItems.map((props) =>
            <NotifyMeDropdownItem {...props} key={props.subscriptionType} />
          )}
        </>;
}
