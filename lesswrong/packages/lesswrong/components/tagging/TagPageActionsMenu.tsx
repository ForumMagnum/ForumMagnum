import React, { useState } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { MAIN_TAB_ID, TagLens } from '@/lib/arbital/useTagLenses';
import { useTracking } from '@/lib/analyticsEvents';
import { useMutation, gql, useApolloClient } from '@apollo/client';
import { useCurrentUser } from '../common/withUser';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions.ts';
import { useMessages } from '../common/withMessages';
import { captureException } from '@sentry/core';
import ForumIcon from "@/components/common/ForumIcon";
import DropdownMenu from "@/components/dropdowns/DropdownMenu";
import { MenuItem } from "@/components/common/Menus";
import LWTooltip from "@/components/common/LWTooltip";
import AnalyticsTracker from "@/components/common/AnalyticsTracker";
import { Menu } from "@/components/mui-replacement";

const styles = defineStyles("TagPageActionsMenu", (theme: ThemeType) => ({
  tagPageTripleDotMenu: {},
  icon: {},
  menu: {},
  infoCircle: {
    color: theme.palette.greyAlpha(0.5),
    marginLeft: 6,
    "--icon-size": "16px",
  },
}))

const TagPageActionsMenuButton = ({tagOrLens, createLens}: {
  tagOrLens: TagLens|undefined
  createLens: (() => void)|null,
}) => {
  const classes = useStyles(styles);
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const [everOpened, setEverOpened] = useState(false);
  const { captureEvent } = useTracking({eventType: "tagPageMenuClicked", eventProps: {tagOrLensId: tagOrLens?._id, itemType: "tag"}});
  if (!tagOrLens) {
    return null;
  }

  return <>
    <span
      className={classes.tagPageTripleDotMenu}
      onClick={event => {
        setAnchorEl(event.currentTarget)
        setEverOpened(true);
      }}
    >
      <ForumIcon icon="EllipsisVertical" className={classes.icon}/>
    </span>
    <Menu
      onClick={() => {
        captureEvent("tagPageMenuClicked")
        setAnchorEl(null)
      }}
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      className={classes.menu}
    >
      {everOpened && <TagPageActionsMenu
        tagOrLens={tagOrLens}
        createLens={createLens}
      />}
    </Menu>
  </>
}

const TagPageActionsMenu = ({tagOrLens, createLens}: {
  tagOrLens: TagLens
  createLens: (() => void)|null,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const apolloClient = useApolloClient();
  const isLensPage = tagOrLens._id !== MAIN_TAB_ID;
  const classes = useStyles(styles);
  
  const [promoteLensMutation] = useMutation(gql`
    mutation promoteLensToMain($lensId: String!) {
      promoteLensToMain(lensId: $lensId)
    }
  `);
  async function promoteLens() {
    try {
      const {data: _} = await promoteLensMutation({
        variables: { lensId: tagOrLens._id },
      });
      
      // This invalidates a lot of client apollo cache contents in a way that's
      // hard to fix incrementally, so just reload everything
      await apolloClient.resetStore();
    } catch(err) {
      captureException(err);
      flash(err.toString());
    }
  }

  return <AnalyticsTracker eventType="tagPageTripleDotClicked" captureOnClick>
    <DropdownMenu>
      {!!createLens && <MenuItem onClick={createLens}>
        New Lens
      </MenuItem>}
    {userIsAdminOrMod(currentUser) && isLensPage && <MenuItem onClick={promoteLens}>
      Make {tagOrLens.tabTitle ?? "This Lens"} Main
      {" "}
      <LWTooltip title={<>
        <p>Swaps the currently selected lens ({tagOrLens.tabTitle}) with the Main lens. All revisions on this lens will become revisions of the main lens, and vise versa. The tab title and other lens metadata will not be changed.</p>
        <p>Summaries will not be swapped.</p>
        <p>You must be a moderator or admin to do this.</p>
      </>}>
        <ForumIcon className={classes.infoCircle} icon="InfoCircle"/>
        </LWTooltip>
      </MenuItem>}
    </DropdownMenu>
  </AnalyticsTracker>
}

const TagPageActionsMenuButtonComponent = registerComponent('TagPageActionsMenuButton', TagPageActionsMenuButton);
const TagPageActionsMenuComponent = registerComponent('TagPageActionsMenu', TagPageActionsMenu);

declare global {
  interface ComponentTypes {
    TagPageActionsMenu: typeof TagPageActionsMenuComponent
    TagPageActionsMenuButton: typeof TagPageActionsMenuButtonComponent
  }
}

export {
  TagPageActionsMenuButtonComponent as TagPageActionsMenuButton,
  TagPageActionsMenuComponent as TagPageActionsMenu
}

